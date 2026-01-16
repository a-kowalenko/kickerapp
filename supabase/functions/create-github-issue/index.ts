import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const GITHUB_OWNER = "a-kowalenko";
const GITHUB_REPO = "kickerapp";
const SUPPORT_EMAIL = "support@kickerapp.dev";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface BugReportData {
    userName: string;
    userEmail: string;
    message: string;
    userAgent?: string;
    url?: string;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        const githubToken = Deno.env.get("GITHUB_PAT");
        if (!githubToken) {
            console.error("GITHUB_PAT not configured");
            return new Response(
                JSON.stringify({ error: "GitHub integration not configured" }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const data: BugReportData = await req.json();

        // Validation
        if (!data.message?.trim() || data.message.trim().length < 10) {
            return new Response(
                JSON.stringify({
                    error: "Bug description must be at least 10 characters",
                }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Create issue title from first line or truncated message
        const firstLine = data.message.trim().split("\n")[0];
        const issueTitle =
            firstLine.length > 80
                ? `Bug: ${firstLine.substring(0, 77)}...`
                : `Bug: ${firstLine}`;

        // Format the issue body
        const issueBody = `## Bug Report

**Reported by:** ${data.userName || "Anonymous"} (${
            data.userEmail || "No email provided"
        })
**Date:** ${new Date().toISOString().split("T")[0]}
**Time:** ${new Date().toISOString().split("T")[1].split(".")[0]} UTC

### Description

${data.message.trim()}

---

<details>
<summary>Technical Details</summary>

- **User Agent:** ${data.userAgent || "Not provided"}
- **URL:** ${data.url || "Not provided"}

</details>

---
*Submitted via KickerApp Bug Reporter*`;

        // Create GitHub issue
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "Content-Type": "application/json",
                    "User-Agent": "KickerApp-Bug-Reporter",
                },
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody,
                    labels: ["bug", "user-reported"],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error("GitHub API error:", response.status, errorData);
            return new Response(
                JSON.stringify({ error: "Failed to create GitHub issue" }),
                {
                    status: 500,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const issue = await response.json();

        // Send notification email to support
        try {
            await resend.emails.send({
                from: "KickerApp Bug Reporter <bugs@kickerapp.dev>",
                to: [SUPPORT_EMAIL],
                replyTo: data.userEmail || undefined,
                subject: `[Bug Report] ${issueTitle.replace("Bug: ", "")}`,
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Bug Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
                            <img src="https://www.kickerapp.dev/logo_darkmode.png" alt="KickerApp" width="48" height="48" style="border-radius: 10px; display: inline-block; vertical-align: middle;">
                            <span style="font-size: 24px; font-weight: 700; color: #0284c7; vertical-align: middle; margin-left: 12px;">KickerApp</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 40px;">
                            <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center;">🐛 New Bug Report</h1>
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #71717a; text-align: center;">A user has submitted a bug report via the app.</p>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">👤 <strong>From:</strong></p>
                                        <p style="margin: 0 0 16px 0; font-size: 15px; color: #18181b;">${
                                            data.userName || "Anonymous"
                                        } ${
                    data.userEmail
                        ? `(<a href="mailto:${data.userEmail}" style="color: #0284c7; text-decoration: none;">${data.userEmail}</a>)`
                        : ""
                }</p>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">🔗 <strong>GitHub Issue:</strong></p>
                                        <p style="margin: 0; font-size: 15px;"><a href="${
                                            issue.html_url
                                        }" style="color: #0284c7; text-decoration: none;">#${
                    issue.number
                }</a></p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; font-weight: 600;">💬 Bug Description:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; font-size: 15px; color: #18181b; white-space: pre-wrap;">${data.message.trim()}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 16px; background-color: #f4f4f5; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 12px 16px;">
                                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #71717a;">📍 URL: ${
                                            data.url || "Not provided"
                                        }</p>
                                        <p style="margin: 0; font-size: 12px; color: #71717a;">🌐 User Agent: ${
                                            data.userAgent || "Not provided"
                                        }</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${
                                            issue.html_url
                                        }" style="display: inline-block; padding: 14px 40px; background-color: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">View on GitHub</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">&copy; ${new Date().getFullYear()} KickerApp. Bug Report Notification.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
            });
        } catch (supportEmailError) {
            console.error(
                "Failed to send support notification:",
                supportEmailError
            );
            // Don't fail the request if support email fails
        }

        // Send confirmation email to user (if email provided)
        if (data.userEmail) {
            try {
                await resend.emails.send({
                    from: "KickerApp <noreply@kickerapp.dev>",
                    to: [data.userEmail],
                    subject: "We received your bug report - KickerApp",
                    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bug Report Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 32px 40px 24px 40px; text-align: center; border-bottom: 1px solid #e4e4e7;">
                            <img src="https://www.kickerapp.dev/logo_darkmode.png" alt="KickerApp" width="48" height="48" style="border-radius: 10px; display: inline-block; vertical-align: middle;">
                            <span style="font-size: 24px; font-weight: 700; color: #0284c7; vertical-align: middle; margin-left: 12px;">KickerApp</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 32px 40px;">
                            <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center;">Thanks for the bug report! 🐛</h1>
                            <p style="margin: 0 0 28px 0; font-size: 15px; color: #71717a; text-align: center;">We've received your report and will investigate it as soon as possible.</p>
                            
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; font-weight: 600;">📋 Your report:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; font-size: 15px; color: #18181b; white-space: pre-wrap;">${data.message.trim()}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef2f2; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 14px 16px;">
                                        <p style="margin: 0; font-size: 13px; color: #b91c1c;">🔧 We take every bug report seriously and will work on fixing it. You may receive a follow-up email if we need more information.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;">Have more details to share? <a href="mailto:support@kickerapp.dev" style="color: #0284c7; text-decoration: none;">Contact Support</a></p>
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">&copy; ${new Date().getFullYear()} KickerApp. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
                });
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Don't fail the request if confirmation email fails
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error creating GitHub issue:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
