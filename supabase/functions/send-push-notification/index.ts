// Supabase Edge Function: send-push-notification
// Sends FCM push notifications when users are mentioned in comments or chat

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Firebase Admin SDK alternative for Deno
// We'll use the FCM HTTP v1 API directly with service account JWT

interface WebhookPayload {
    type: "INSERT";
    table: string;
    schema: string;
    record: {
        id: number;
        content: string;
        player_id: number;
        kicker_id: number;
        match_id?: number;
        recipient_id?: number;
    };
    old_record: null;
}

interface FCMMessage {
    token: string;
    notification: {
        title: string;
        body: string;
    };
    data: {
        type: string;
        matchId?: string;
        kickerId: string;
        url: string;
    };
    webpush?: {
        fcm_options: {
            link: string;
        };
    };
}

// Parse mentions from content
function parseMentions(content: string): {
    playerIds: number[];
    hasEveryone: boolean;
} {
    const playerIds: number[] = [];
    let hasEveryone = false;

    // Check for @everyone
    if (content.includes("@everyone")) {
        hasEveryone = true;
    }

    // Parse @[name](id) format
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
        const playerId = parseInt(match[2], 10);
        if (!isNaN(playerId)) {
            playerIds.push(playerId);
        }
    }

    return { playerIds, hasEveryone };
}

// Get access token for FCM using service account
async function getFCMAccessToken(serviceAccount: any): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    // Create JWT header and payload
    const header = {
        alg: "RS256",
        typ: "JWT",
    };

    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: exp,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
    };

    // Encode header and payload
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

    // Import private key and sign
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
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
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

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
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
): Promise<boolean> {
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

        if (!response.ok) {
            const error = await response.text();
            console.error("FCM send error:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("FCM send exception:", error);
        return false;
    }
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    try {
        console.log("=== Push notification function called v2 ===");
        console.log("Timestamp:", new Date().toISOString());

        // Get raw body text first for debugging
        const rawBody = await req.text();
        console.log("Raw body received:", rawBody);
        console.log("Raw body length:", rawBody.length);
        console.log("Content-Type:", req.headers.get("content-type"));

        // Try to parse as JSON
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("First 100 chars:", rawBody.substring(0, 100));
            console.error(
                "Char codes:",
                [...rawBody.substring(0, 20)].map((c) => c.charCodeAt(0))
            );
            return new Response(
                JSON.stringify({
                    error: parseError.message,
                    rawBody: rawBody.substring(0, 200),
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        console.log("Received body:", JSON.stringify(body, null, 2));

        // Check if this is a Database Webhook payload
        const isWebhook = body.type === "INSERT" && body.record;
        console.log("Is webhook:", isWebhook);

        let content: string;
        let senderPlayerId: number;
        let kickerId: number;
        let matchId: number | null = null;
        let notificationType: "comment" | "chat";
        let databaseSchema: string;

        if (isWebhook) {
            // Database Webhook format
            const webhook = body as WebhookPayload;
            content = webhook.record.content;
            senderPlayerId = webhook.record.player_id;
            kickerId = webhook.record.kicker_id;
            databaseSchema = webhook.schema || "public";

            // Determine type based on table name
            if (webhook.table === "match_comments") {
                notificationType = "comment";
                matchId = webhook.record.match_id || null;
            } else {
                notificationType = "chat";
                // Skip whispers (private messages)
                if (webhook.record.recipient_id) {
                    console.log("Skipping whisper message");
                    return new Response(
                        JSON.stringify({ sent: 0, reason: "whisper" }),
                        {
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                }
            }
        } else {
            // Direct API call format (legacy)
            content = body.content;
            senderPlayerId = body.senderPlayerId;
            kickerId = body.kickerId;
            matchId = body.matchId;
            notificationType = body.type;
            databaseSchema = body.databaseSchema || "public";
        }

        console.log("Processing notification:", {
            notificationType,
            kickerId,
            matchId,
        });

        // Check for @ mentions
        if (!content.includes("@")) {
            console.log("No mentions in content");
            return new Response(
                JSON.stringify({ sent: 0, reason: "no_mentions" }),
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        // Get service account from environment
        const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
        if (!serviceAccountJson) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
        }
        const serviceAccount = JSON.parse(serviceAccountJson);

        // Create Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            db: { schema: databaseSchema },
        });

        // Get sender name
        const { data: senderData } = await supabase
            .from("player")
            .select("name")
            .eq("id", senderPlayerId)
            .single();
        const senderName = senderData?.name || "Someone";

        // Parse mentions from content
        const { playerIds, hasEveryone } = parseMentions(content);

        if (playerIds.length === 0 && !hasEveryone) {
            console.log("No valid mentions found in content");
            return new Response(JSON.stringify({ sent: 0 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get user IDs to notify
        let userIdsToNotify: string[] = [];

        if (hasEveryone) {
            // Get all players in this kicker (except sender)
            const { data: allPlayers, error: playersError } = await supabase
                .from("player")
                .select("user_id")
                .eq("kicker_id", kickerId)
                .neq("id", senderPlayerId);

            if (playersError) {
                console.error("Error fetching players:", playersError);
            } else {
                userIdsToNotify = allPlayers
                    .map((p: any) => p.user_id)
                    .filter((id: string | null) => id !== null);
            }
        } else {
            // Get user IDs for mentioned players (except sender)
            const { data: mentionedPlayers, error: mentionError } =
                await supabase
                    .from("player")
                    .select("user_id")
                    .in("id", playerIds)
                    .neq("id", senderPlayerId);

            if (mentionError) {
                console.error(
                    "Error fetching mentioned players:",
                    mentionError
                );
            } else {
                userIdsToNotify = mentionedPlayers
                    .map((p: any) => p.user_id)
                    .filter((id: string | null) => id !== null);
            }
        }

        if (userIdsToNotify.length === 0) {
            console.log("No users to notify");
            return new Response(JSON.stringify({ sent: 0 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get FCM tokens for these users (using public schema for push_subscriptions)
        const supabasePublic = createClient(supabaseUrl, supabaseServiceKey);
        const { data: subscriptions, error: subError } = await supabasePublic
            .from("push_subscriptions")
            .select("fcm_token, user_id")
            .in("user_id", userIdsToNotify);

        if (subError) {
            console.error("Error fetching subscriptions:", subError);
            throw subError;
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log("No FCM tokens found for users");
            return new Response(JSON.stringify({ sent: 0 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log(`Found ${subscriptions.length} FCM tokens to notify`);

        // Get FCM access token
        const accessToken = await getFCMAccessToken(serviceAccount);

        // Build notification content
        const title =
            notificationType === "comment"
                ? `${senderName} mentioned you in a comment`
                : `${senderName} mentioned you in chat`;

        // Clean content for display (remove mention markup)
        const cleanContent = content
            .replace(/@\[([^\]]+)\]\(\d+\)/g, "@$1")
            .replace(/@everyone/g, "@everyone");

        // Truncate content for notification body
        const notificationBody =
            cleanContent.length > 100
                ? cleanContent.substring(0, 97) + "..."
                : cleanContent;

        // Build target URL
        const url =
            notificationType === "comment" && matchId
                ? `/matches/${matchId}`
                : "/home";

        // Send notifications
        let sentCount = 0;
        const invalidTokens: string[] = [];

        for (const sub of subscriptions) {
            const message: FCMMessage = {
                token: sub.fcm_token,
                notification: {
                    title,
                    body: notificationBody,
                },
                data: {
                    type: notificationType,
                    kickerId: kickerId.toString(),
                    url,
                    ...(matchId && { matchId: matchId.toString() }),
                },
                webpush: {
                    fcm_options: {
                        link: url,
                    },
                },
            };

            const success = await sendFCMNotification(
                accessToken,
                serviceAccount.project_id,
                message
            );

            if (success) {
                sentCount++;
            } else {
                invalidTokens.push(sub.fcm_token);
            }
        }

        // Clean up invalid tokens
        if (invalidTokens.length > 0) {
            console.log(`Removing ${invalidTokens.length} invalid tokens`);
            await supabasePublic
                .from("push_subscriptions")
                .delete()
                .in("fcm_token", invalidTokens);
        }

        console.log(`Successfully sent ${sentCount} notifications`);

        return new Response(
            JSON.stringify({
                sent: sentCount,
                total: subscriptions.length,
                invalidRemoved: invalidTokens.length,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error) {
        console.error("Error in send-push-notification:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }
});
