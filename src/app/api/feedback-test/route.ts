import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint — visit /api/feedback-test in your browser to verify
 * Resend is configured correctly and the domain is verified.
 *
 * DELETE THIS FILE before going to a public launch.
 */
export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({
      ok: false,
      step: "env",
      error: "RESEND_API_KEY is not set in Vercel environment variables.",
      fix: "Go to Vercel → Project → Settings → Environment Variables and add RESEND_API_KEY, then redeploy.",
    });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fundi Finance <hello@fundiapp.co.za>",
      to: ["support@fundiapp.co.za"],
      subject: "[Fundi Diagnostic] Resend test email",
      html: "<p>This is a test email sent from the /api/feedback-test diagnostic endpoint. If you received this, Resend is working correctly.</p>",
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    return NextResponse.json({
      ok: false,
      step: "resend_send",
      status: response.status,
      resend_error: body,
      fix:
        response.status === 403
          ? "API key is invalid or revoked — regenerate it in Resend."
          : response.status === 422
          ? "Domain fundiapp.co.za is not verified in Resend. Go to resend.com → Domains, add fundiapp.co.za, then add the DNS records shown to your domain registrar."
          : "Unknown Resend error — see resend_error above.",
    });
  }

  return NextResponse.json({
    ok: true,
    message: "Test email sent successfully! Check support@fundiapp.co.za inbox.",
    resend_response: body,
  });
}
