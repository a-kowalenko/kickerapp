import { useQuery } from "react-query";
import supabase, { databaseSchema } from "../services/supabase";

/**
 * Fetch link preview data for a URL
 * First checks the database cache, then falls back to edge function
 */
async function fetchLinkPreview(url) {
    // Check cache in database first
    const { data: cached } = await supabase
        .from("link_previews")
        .select("*")
        .eq("url", url)
        .single();

    // Return cached if fresh (< 7 days) and not an error
    if (cached && !cached.error) {
        const fetchedAt = new Date(cached.fetched_at);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (fetchedAt > sevenDaysAgo) {
            return cached;
        }
    }

    // Fetch from edge function
    const { data, error } = await supabase.functions.invoke(
        "fetch-link-preview",
        {
            body: { url, schema: databaseSchema },
        }
    );

    if (error) {
        console.error("Link preview fetch error:", error);
        throw error;
    }

    return data;
}

/**
 * Hook to fetch OpenGraph link preview data
 * Uses aggressive caching since OG data rarely changes
 *
 * @param {string} url - The URL to fetch preview for
 * @param {boolean} enabled - Whether to enable the query
 * @returns {object} React Query result with data, isLoading, isError
 */
export function useLinkPreview(url, enabled = true) {
    return useQuery({
        queryKey: ["linkPreview", url],
        queryFn: () => fetchLinkPreview(url),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache
        enabled: enabled && !!url,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
}
