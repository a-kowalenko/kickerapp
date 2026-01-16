import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

// Parse OG meta tags from HTML
function parseOpenGraph(html: string, baseUrl: string) {
    const getMeta = (property: string): string | null => {
        // Try property="og:X" content="Y" format
        const match1 = html.match(
            new RegExp(
                `<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`,
                "i"
            )
        );
        if (match1) return match1[1];

        // Try content="Y" property="og:X" format
        const match2 = html.match(
            new RegExp(
                `<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`,
                "i"
            )
        );
        if (match2) return match2[1];

        return null;
    };

    const getMetaName = (name: string): string | null => {
        const match1 = html.match(
            new RegExp(
                `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`,
                "i"
            )
        );
        if (match1) return match1[1];

        const match2 = html.match(
            new RegExp(
                `<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`,
                "i"
            )
        );
        if (match2) return match2[1];

        return null;
    };

    const getTitle = (): string | null => {
        return (
            getMeta("title") ||
            html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
            null
        );
    };

    const getDescription = (): string | null => {
        return getMeta("description") || getMetaName("description") || null;
    };

    const getFavicon = (): string | null => {
        // Try various favicon link patterns
        const patterns = [
            /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
            /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
            /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                const href = match[1];
                if (href.startsWith("http")) return href;
                if (href.startsWith("//")) return `https:${href}`;
                if (href.startsWith("/")) {
                    try {
                        return `${new URL(baseUrl).origin}${href}`;
                    } catch {
                        return null;
                    }
                }
                try {
                    return `${new URL(baseUrl).origin}/${href}`;
                } catch {
                    return null;
                }
            }
        }

        // Fallback to default favicon location
        try {
            return `${new URL(baseUrl).origin}/favicon.ico`;
        } catch {
            return null;
        }
    };

    const getImage = (): string | null => {
        const image = getMeta("image");
        if (!image) return null;

        // Handle relative image URLs
        if (image.startsWith("http")) return image;
        if (image.startsWith("//")) return `https:${image}`;
        if (image.startsWith("/")) {
            try {
                return `${new URL(baseUrl).origin}${image}`;
            } catch {
                return image;
            }
        }
        return image;
    };

    let siteName = getMeta("site_name");
    if (!siteName) {
        try {
            siteName = new URL(baseUrl).hostname.replace(/^www\./, "");
        } catch {
            siteName = null;
        }
    }

    return {
        title: getTitle()?.trim().slice(0, 200) || null,
        description: getDescription()?.trim().slice(0, 500) || null,
        image: getImage(),
        site_name: siteName,
        favicon: getFavicon(),
    };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { url, schema = "kopecht" } = await req.json();

        if (!url || typeof url !== "string") {
            return new Response(JSON.stringify({ error: "URL is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Validate URL format
        let normalizedUrl = url;
        if (url.startsWith("www.")) {
            normalizedUrl = `https://${url}`;
        }

        try {
            new URL(normalizedUrl);
        } catch {
            return new Response(JSON.stringify({ error: "Invalid URL" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
            { db: { schema } }
        );

        // Check cache first
        const { data: cached } = await supabase
            .from("link_previews")
            .select("*")
            .eq("url", url)
            .single();

        // Return cached if fresh (< 7 days) and not an error
        if (cached) {
            const fetchedAt = new Date(cached.fetched_at);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (fetchedAt > sevenDaysAgo) {
                return new Response(JSON.stringify(cached), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                });
            }
        }

        // Fetch the URL with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        let response;
        try {
            response = await fetch(normalizedUrl, {
                signal: controller.signal,
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (compatible; KickerApp/1.0; +https://kickerapp.com)",
                    Accept: "text/html,application/xhtml+xml",
                },
                redirect: "follow",
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // Only process HTML responses
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) {
            throw new Error("Not an HTML page");
        }

        const html = await response.text();
        const ogData = parseOpenGraph(html, normalizedUrl);

        // Upsert to cache
        const previewData = {
            url,
            ...ogData,
            fetched_at: new Date().toISOString(),
            error: false,
            error_message: null,
        };

        await supabase
            .from("link_previews")
            .upsert(previewData, { onConflict: "url" });

        return new Response(JSON.stringify(previewData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

        console.error("Link preview error:", errorMessage);

        return new Response(
            JSON.stringify({
                error: true,
                error_message: errorMessage,
                title: null,
                description: null,
                image: null,
                site_name: null,
                favicon: null,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
