import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const SUPPORT_EMAIL = "support@kickerapp.dev";
const MIN_SUBMISSION_TIME = 3000; // 3 seconds minimum

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
    honeypot?: string;
    formLoadTime: number;
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
        const data: ContactFormData = await req.json();

        // Spam check 1: Honeypot field filled = bot
        if (data.honeypot) {
            // Silently "succeed" to not alert bot
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Spam check 2: Form submitted too quickly = bot
        const timeTaken = Date.now() - data.formLoadTime;
        if (timeTaken < MIN_SUBMISSION_TIME) {
            return new Response(
                JSON.stringify({
                    error: "Please take your time filling out the form",
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

        // Validation
        if (!data.name?.trim()) {
            return new Response(JSON.stringify({ error: "Name is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!data.email?.trim() || !data.email.includes("@")) {
            return new Response(
                JSON.stringify({ error: "Valid email is required" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (!data.subject) {
            return new Response(
                JSON.stringify({ error: "Subject is required" }),
                {
                    status: 400,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        if (!data.message?.trim() || data.message.trim().length < 10) {
            return new Response(
                JSON.stringify({
                    error: "Message must be at least 10 characters",
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

        // Subject labels for email
        const subjectLabels: Record<string, string> = {
            general: "General Inquiry",
            bug: "Bug Report",
            feature: "Feature Request",
            account: "Account Issues",
            feedback: "Feedback",
            other: "Other",
        };

        const subjectLabel = subjectLabels[data.subject] || data.subject;

        // Send email to support
        const { error: supportError } = await resend.emails.send({
            from: "KickerApp Contact <contact@kickerapp.dev>",
            to: [SUPPORT_EMAIL],
            replyTo: data.email,
            subject: `[${subjectLabel}] Contact Form: ${data.name}`,
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
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
                            <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center;">📬 New Contact Form Submission</h1>
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #71717a; text-align: center;">You received a new message from the contact form.</p>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">👤 <strong>From:</strong></p>
                                        <p style="margin: 0 0 16px 0; font-size: 15px; color: #18181b;">${
                                            data.name
                                        } (<a href="mailto:${
                data.email
            }" style="color: #0284c7; text-decoration: none;">${
                data.email
            }</a>)</p>
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">🏷️ <strong>Subject:</strong></p>
                                        <p style="margin: 0; font-size: 15px; color: #18181b;">${subjectLabel}</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; font-weight: 600;">💬 Message:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; font-size: 15px; color: #18181b; white-space: pre-wrap;">${
                                            data.message
                                        }</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="mailto:${
                                            data.email
                                        }?subject=Re: ${subjectLabel}" style="display: inline-block; padding: 14px 40px; background-color: #0284c7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">Reply to ${
                data.name
            }</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #a1a1aa;">&copy; ${new Date().getFullYear()} KickerApp. Contact Form Submission.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        });

        if (supportError) {
            console.error("Failed to send support email:", supportError);
            throw supportError;
        }

        // Send confirmation email to user
        const { error: confirmError } = await resend.emails.send({
            from: "KickerApp <noreply@kickerapp.dev>",
            to: [data.email],
            subject: "We received your message - KickerApp",
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Message Received</title>
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
                            <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #18181b; text-align: center;">Thanks for reaching out, ${
                                data.name
                            }! 👋</h1>
                            <p style="margin: 0 0 28px 0; font-size: 15px; color: #71717a; text-align: center;">We've received your message and will get back to you as soon as possible.</p>
                            
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a; font-weight: 600;">📋 Your message:</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5; border-radius: 8px; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">🏷️ <strong>Subject:</strong> ${subjectLabel}</p>
                                        <p style="margin: 0; font-size: 15px; color: #18181b; white-space: pre-wrap;">${
                                            data.message
                                        }</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0f9ff; border-radius: 8px;">
                                <tr>
                                    <td style="padding: 14px 16px;">
                                        <p style="margin: 0; font-size: 13px; color: #0369a1;">💡 We typically respond within 24-48 hours. Check your inbox (and spam folder) for our reply.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px; border-top: 1px solid #e4e4e7; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa;">Need urgent help? <a href="mailto:support@kickerapp.dev" style="color: #0284c7; text-decoration: none;">Contact Support</a></p>
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

        if (confirmError) {
            console.error("Failed to send confirmation email:", confirmError);
            // Don't fail the request if confirmation email fails
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Email sent successfully",
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error processing contact form:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to send message. Please try again.",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
