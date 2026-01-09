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
        content?: string;
        player_id?: number;
        kicker_id?: number;
        match_id?: number;
        recipient_id?: number;
        // Team invitation fields
        team_id?: number;
        inviting_player_id?: number;
        invited_player_id?: number;
        status?: string;
        // Mention notification fields (for chat_all)
        type?: string;
        user_id?: string;
        sender_player_id?: number;
        source_id?: number;
        content_preview?: string;
    };
    old_record: null;
}

interface PushSubscription {
    id: number;
    fcm_token: string;
    user_id: string;
    notify_all_chat: boolean;
    notify_mentions: boolean;
    notify_team_invites: boolean;
}

interface FCMMessage {
    token: string;
    notification?: {
        title: string;
        body: string;
    };
    data: {
        type: string;
        matchId?: string;
        kickerId: string;
        url: string;
        title: string;
        body: string;
        badge?: string;
        teamId?: string;
    };
    webpush?: {
        headers?: {
            Urgency?: string;
        };
        notification?: {
            title: string;
            body: string;
            icon?: string;
            badge?: string;
            tag?: string;
            renotify?: boolean;
            requireInteraction?: boolean;
        };
        fcm_options?: {
            link: string;
        };
    };
    apns?: {
        payload: {
            aps: {
                alert: {
                    title: string;
                    body: string;
                };
                sound?: string;
                badge?: number;
            };
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

// Handle chat_all push notifications (triggered from mention_notifications table)
async function handleChatAllNotification(
    webhook: WebhookPayload,
    databaseSchema: string
): Promise<Response> {
    const { record } = webhook;
    const userId = record.user_id!;
    const senderPlayerId = record.sender_player_id!;
    const kickerId = record.kicker_id!;
    const contentPreview = record.content_preview || "";

    // Get service account from environment
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SECRET_API_KEY")!;
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

    // Get FCM tokens for this user (only where notify_all_chat is enabled)
    const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select(
            "id, fcm_token, user_id, notify_all_chat, notify_mentions, notify_team_invites"
        )
        .eq("user_id", userId)
        .eq("notify_all_chat", true);

    if (subError) {
        console.error("Error fetching subscriptions:", subError);
        throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
        return new Response(
            JSON.stringify({ sent: 0, reason: "no_subscriptions_or_disabled" }),
            { headers: { "Content-Type": "application/json" } }
        );
    }

    // Get FCM access token
    const accessToken = await getFCMAccessToken(serviceAccount);

    // Build notification content
    const title = `New message from ${senderName}`;
    const notificationBody = contentPreview;
    const url = "/home";

    // Send notifications
    let sentCount = 0;
    const invalidTokens: string[] = [];

    for (const sub of subscriptions as PushSubscription[]) {
        // Get actual combined unread count for this user
        let badgeCount = 1;
        try {
            const { data: unreadData } = await supabase.rpc(
                "get_combined_unread_count_for_user",
                { p_user_id: sub.user_id }
            );
            if (unreadData !== null && unreadData !== undefined) {
                badgeCount = Math.max(1, Number(unreadData) + 1);
            }
        } catch (badgeError) {
            console.error("Error getting unread count for badge:", badgeError);
        }

        const message: FCMMessage = {
            token: sub.fcm_token,
            data: {
                type: "chat_all",
                kickerId: kickerId.toString(),
                url,
                title,
                body: notificationBody,
                badge: badgeCount.toString(),
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
                        badge: badgeCount,
                        "mutable-content": 1,
                    },
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
        await supabase
            .from("push_subscriptions")
            .delete()
            .in("fcm_token", invalidTokens);
    }

    console.log(`Successfully sent ${sentCount} chat_all notifications`);

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
}

// Handle team invitation push notifications
async function handleTeamInvitation(
    webhook: WebhookPayload,
    databaseSchema: string
): Promise<Response> {
    const { record } = webhook;
    const invitingPlayerId = record.inviting_player_id!;
    const invitedPlayerId = record.invited_player_id!;
    const teamId = record.team_id!;

    // Get service account from environment
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SECRET_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        db: { schema: databaseSchema },
    });

    // Get inviter name
    const { data: inviterData } = await supabase
        .from("player")
        .select("name")
        .eq("id", invitingPlayerId)
        .single();
    const inviterName = inviterData?.name || "Someone";

    // Get team name and kicker_id
    const { data: teamData } = await supabase
        .from("teams")
        .select("name, kicker_id")
        .eq("id", teamId)
        .single();
    const teamName = teamData?.name || "a team";
    const kickerId = teamData?.kicker_id;

    // Get invited player's user_id
    const { data: invitedPlayerData } = await supabase
        .from("player")
        .select("user_id")
        .eq("id", invitedPlayerId)
        .single();

    if (!invitedPlayerData?.user_id) {
        return new Response(JSON.stringify({ sent: 0, reason: "no_user_id" }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    const invitedUserId = invitedPlayerData.user_id;

    // Get FCM tokens for invited user (with preferences)
    const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select(
            "id, fcm_token, user_id, notify_all_chat, notify_mentions, notify_team_invites"
        )
        .eq("user_id", invitedUserId);

    if (subError) {
        console.error("Error fetching subscriptions:", subError);
        throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    // Filter by team invite preference
    const filteredSubs = (subscriptions as PushSubscription[]).filter(
        (sub) => sub.notify_team_invites !== false
    );

    if (filteredSubs.length === 0) {
        return new Response(
            JSON.stringify({ sent: 0, reason: "preference_disabled" }),
            { headers: { "Content-Type": "application/json" } }
        );
    }

    // Get FCM access token
    const accessToken = await getFCMAccessToken(serviceAccount);

    // Build notification content
    const title = `${inviterName} invited you to a team`;
    const notificationBody = `Join team "${teamName}"`;
    const url = "/teams/my";

    // Send notifications
    let sentCount = 0;
    const invalidTokens: string[] = [];

    for (const sub of filteredSubs) {
        // Get actual combined unread count for this user
        let badgeCount = 1;
        try {
            const { data: unreadData } = await supabase.rpc(
                "get_combined_unread_count_for_user",
                { p_user_id: sub.user_id }
            );
            if (unreadData !== null && unreadData !== undefined) {
                badgeCount = Math.max(1, Number(unreadData) + 1);
            }
        } catch (badgeError) {
            console.error("Error getting unread count for badge:", badgeError);
        }

        const message: FCMMessage = {
            token: sub.fcm_token,
            data: {
                type: "team_invite",
                kickerId: kickerId?.toString() || "",
                url,
                title,
                body: notificationBody,
                badge: badgeCount.toString(),
                teamId: teamId.toString(),
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
                        badge: badgeCount,
                        "mutable-content": 1,
                    },
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
        await supabase
            .from("push_subscriptions")
            .delete()
            .in("fcm_token", invalidTokens);
    }

    console.log(`Successfully sent ${sentCount} team invite notifications`);

    return new Response(
        JSON.stringify({
            sent: sentCount,
            total: filteredSubs.length,
            invalidRemoved: invalidTokens.length,
        }),
        {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        }
    );
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
        // Parse request body
        const rawBody = await req.text();
        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check if this is a Database Webhook payload
        const isWebhook = body.type === "INSERT" && body.record;

        let content: string;
        let senderPlayerId: number;
        let kickerId: number;
        let matchId: number | null = null;
        let notificationType: "comment" | "chat" | "chat_all" | "team_invite";
        let databaseSchema: string;

        if (isWebhook) {
            // Database Webhook format
            const webhook = body as WebhookPayload;
            databaseSchema = webhook.schema || "public";

            // Handle team_invitations table separately
            if (webhook.table === "team_invitations") {
                return await handleTeamInvitation(webhook, databaseSchema);
            }

            // Handle mention_notifications table for chat_all type
            if (webhook.table === "mention_notifications") {
                // Only process chat_all type from mention_notifications
                if (webhook.record.type !== "chat_all") {
                    return new Response(
                        JSON.stringify({ sent: 0, reason: "not_chat_all" }),
                        { headers: { "Content-Type": "application/json" } }
                    );
                }
                return await handleChatAllNotification(webhook, databaseSchema);
            }

            content = webhook.record.content!;
            senderPlayerId = webhook.record.player_id!;
            kickerId = webhook.record.kicker_id!;

            // Determine type based on table name
            if (webhook.table === "match_comments") {
                notificationType = "comment";
                matchId = webhook.record.match_id || null;
            } else {
                notificationType = "chat";
                // Skip whispers (private messages)
                if (webhook.record.recipient_id) {
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

        // Check for @ mentions
        if (!content.includes("@")) {
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
        const supabaseServiceKey = Deno.env.get("SECRET_API_KEY")!;
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
            return new Response(JSON.stringify({ sent: 0 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get FCM tokens for these users (using same schema as source data)
        // Include preference columns for filtering
        const { data: subscriptions, error: subError } = await supabase
            .from("push_subscriptions")
            .select(
                "id, fcm_token, user_id, notify_all_chat, notify_mentions, notify_team_invites"
            )
            .in("user_id", userIdsToNotify);

        if (subError) {
            console.error("Error fetching subscriptions:", subError);
            throw subError;
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ sent: 0 }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Filter by mentions preference
        const filteredSubscriptions = (
            subscriptions as PushSubscription[]
        ).filter((sub) => sub.notify_mentions !== false);

        if (filteredSubscriptions.length === 0) {
            return new Response(
                JSON.stringify({ sent: 0, reason: "preference_disabled" }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

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

        for (const sub of filteredSubscriptions) {
            // Get actual combined unread count for this user (chat + comments, for iOS/Android badge)
            let badgeCount = 1;
            try {
                const { data: unreadData } = await supabase.rpc(
                    "get_combined_unread_count_for_user",
                    { p_user_id: sub.user_id }
                );
                if (unreadData !== null && unreadData !== undefined) {
                    // Add 1 to include the current message being sent
                    badgeCount = Math.max(1, Number(unreadData) + 1);
                }
            } catch (badgeError) {
                console.error(
                    "Error getting unread count for badge:",
                    badgeError
                );
                // Fall back to badge: 1 if RPC fails
            }

            // Pure DATA-ONLY message - no notification field anywhere
            // The service worker's onBackgroundMessage will handle displaying the notification
            const message: FCMMessage = {
                token: sub.fcm_token,
                // Only data field - no notification field
                data: {
                    type: notificationType,
                    kickerId: kickerId.toString(),
                    url,
                    title,
                    body: notificationBody,
                    badge: badgeCount.toString(), // Send badge count to service worker
                    ...(matchId && { matchId: matchId.toString() }),
                },
                // Web push - only headers and link, NO notification
                webpush: {
                    headers: {
                        Urgency: "high",
                    },
                    fcm_options: {
                        link: url,
                    },
                },
                // iOS/APNs specific options (for native iOS apps, not PWA)
                apns: {
                    headers: {
                        "apns-priority": "10", // High priority for immediate delivery
                    },
                    payload: {
                        aps: {
                            alert: {
                                title,
                                body: notificationBody,
                            },
                            sound: "default",
                            badge: badgeCount,
                            "mutable-content": 1,
                        },
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
            await supabase
                .from("push_subscriptions")
                .delete()
                .in("fcm_token", invalidTokens);
        }

        console.log(`Successfully sent ${sentCount} notifications`);

        return new Response(
            JSON.stringify({
                sent: sentCount,
                total: filteredSubscriptions.length,
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
