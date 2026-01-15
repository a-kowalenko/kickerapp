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
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${data.name} (${data.email})</p>
        <p><strong>Subject:</strong> ${subjectLabel}</p>
        <hr />
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${data.message}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Sent from KickerApp Contact Form</p>
      `,
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
            html: `
        <h2>Thanks for contacting us, ${data.name}!</h2>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <hr />
        <h3>Your message:</h3>
        <p><strong>Subject:</strong> ${subjectLabel}</p>
        <p style="white-space: pre-wrap;">${data.message}</p>
        <hr />
        <p>Best regards,<br />The KickerApp Team</p>
        <p style="color: #666; font-size: 12px;">This is an automated confirmation. Please don't reply to this email.</p>
      `,
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
