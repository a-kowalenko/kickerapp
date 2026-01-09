// Supabase Edge Function: send-test-notification
// Sends a test FCM push notification to verify notifications are working

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
    subscriptionId: number;
    databaseSchema?: string;
}

interface FCMMessage {
    token: string;
    notification?: {
        title: string;
        body: string;
    };
    data: {
        type: string;
        tag?: string;
        title: string;
        body: string;
        url: string;
    };
    webpush?: {
        headers?: {
            Urgency?: string;
        };
        fcm_options?: {
            link: string;
        };
    };
    apns?: {
        headers?: {
            "apns-priority"?: string;
        };
        payload: {
            aps: {
                alert: {
                    title: string;
                    body: string;
                };
                sound?: string;
                "mutable-content"?: number;
            };
        };
    };
}

// Get access token for FCM using service account
async function getFCMAccessToken(serviceAccount: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600;

    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: exp,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    const payloadB64 = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    const signatureInput = `${headerB64}.${payloadB64}`;

    const privateKeyPem = serviceAccount.private_key;
    const pemContents = privateKeyPem
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(atob(pemContents), (c) =>
        c.charCodeAt(0)
    );

    const key = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        encoder.encode(signatureInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    const jwt = `${signatureInput}.${signatureB64}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

// Send FCM notification
async function sendFCMNotification(
    accessToken: string,
    projectId: string,
    message: FCMMessage
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            }
        );

        const responseText = await response.text();
        console.log("FCM response status:", response.status);
        console.log("FCM response body:", responseText);

        if (!response.ok) {
            console.error("FCM send error:", responseText);
            return { success: false, error: responseText };
        }

        return { success: true };
    } catch (error) {
        console.error("FCM send exception:", error);
        return { success: false, error: String(error) };
    }
}

// CORS headers for all responses
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Parse request body
        const body: RequestBody = await req.json();
        const { subscriptionId, databaseSchema = "public" } = body;

        if (!subscriptionId) {
            return new Response(
                JSON.stringify({ error: "subscriptionId is required" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Get service account from environment
        const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
        if (!serviceAccountJson) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
        }
        const serviceAccount = JSON.parse(serviceAccountJson);

        // Create Supabase client with user's auth token to verify ownership
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SECRET_API_KEY")!;

        // Use service key but verify user owns the subscription
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            db: { schema: databaseSchema },
            global: {
                headers: { Authorization: authHeader },
            },
        });

        // Get subscription and verify it belongs to the authenticated user
        const { data: subscription, error: subError } = await supabase
            .from("push_subscriptions")
            .select("id, fcm_token, user_id")
            .eq("id", subscriptionId)
            .single();

        if (subError || !subscription) {
            return new Response(
                JSON.stringify({
                    error: "Subscription not found or not authorized",
                }),
                {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Get the authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Verify user owns this subscription
        if (subscription.user_id !== user.id) {
            return new Response(
                JSON.stringify({
                    error: "Not authorized to send test to this device",
                }),
                {
                    status: 403,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Get FCM access token
        const accessToken = await getFCMAccessToken(serviceAccount);

        // Build test notification with unique tag to ensure it always shows
        const title = "🔔 Test Notification";
        const notificationBody =
            "If you see this, push notifications are working!";
        const url = "/settings";
        const uniqueTag = `test-${Date.now()}`; // Unique tag ensures notification always shows

        // Use data-only message format (no notification field) to match how regular notifications work
        // This ensures consistent behavior across platforms
        const message: FCMMessage = {
            token: subscription.fcm_token,
            // NO notification field - use data-only message like regular notifications
            data: {
                type: "test",
                tag: uniqueTag,
                title,
                body: notificationBody,
                url,
            },
            webpush: {
                headers: {
                    Urgency: "high",
                },
                fcm_options: {
                    link: url,
                },
            },
            apns: {
                headers: {
                    "apns-priority": "10",
                },
                payload: {
                    aps: {
                        alert: {
                            title,
                            body: notificationBody,
                        },
                        sound: "default",
                        "mutable-content": 1,
                    },
                },
            },
        };

        console.log("Sending FCM message:", JSON.stringify(message, null, 2));

        const result = await sendFCMNotification(
            accessToken,
            serviceAccount.project_id,
            message
        );

        if (result.success) {
            console.log(
                `Test notification sent successfully to subscription ${subscriptionId}`
            );
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Test notification sent",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        } else {
            console.error(`Failed to send test notification: ${result.error}`);
            // Token might be invalid, but don't delete it - let user know
            return new Response(
                JSON.stringify({
                    success: false,
                    message:
                        "Failed to send notification. The device token may be invalid.",
                    details: result.error,
                }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }
    } catch (error) {
        console.error("Error in send-test-notification:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
