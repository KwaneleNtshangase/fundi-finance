import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint — visit /api/feedback-test in your browser.
 * Sends a test email to every fundiapp.co.za address and reports per-address results.
 * DELETE THIS FILE before a public launch.
 */

const ADDRESSES = [
  "support@fundiapp.co.za",
  "hello@fundiapp.co.za",
  "legal@fundiapp.co.za",
  "noreply@fundiapp.co.za",
  "privacy@fundiapp.co.za",
];

async function sendTest(resendKey: string, to: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fundi Finance <hello@fundiapp.co.za>",
      to: [to],
      subject: `[Fundi Test] Delivery check → ${to}`,
      html: `<p>This is a delivery test sent via Resend to <strong>${to}</strong>. If you received this, delivery to this address is working correctly.</p><p><em>Sent: ${new Date().toISOString()}</em></p>`,
    }),
  });
  const body = await res.json().catch(() => null);
  return { to, status: res.status, ok: res.ok, resend_id: body?.id ?? null, error: res.ok ? null : body };
}

export async function GET() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({
      ok: false,
      error: "RESEND_API_KEY not set in Vercel environment variables.",
    });
  }

  const results = await Promise.all(ADDRESSES.map((addr) => sendTest(resendKey, addr)));

  const allOk = results.every((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({
    summary: allOk
      ? "All emails accepted by Resend for delivery. Check each inbox (including Junk/Spam)."
      : `${failed.length} address(es) rejected by Resend.`,
    results,
  });
}
