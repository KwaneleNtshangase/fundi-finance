import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { to, username } = (await req.json()) as { to?: string; username?: string };
  if (!to || !username) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fundi Finance <hello@fundiapp.co.za>",
      to: [to],
      subject: "Welcome to Fundi - your financial journey starts now 🚀",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
          <h2>Welcome to Fundi, ${username} 👋</h2>
          <p>You're in. One small lesson a day can change how you handle money.</p>
          <p>Start now, build your streak, and keep stacking wins.</p>
          <p><a href="https://fundiapp.co.za" style="display:inline-block;padding:10px 16px;background:#007A4D;color:#fff;text-decoration:none;border-radius:8px">Complete your first lesson</a></p>
          <p style="font-size:12px;color:#6b7280">You've got this. Team Fundi</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: text }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
