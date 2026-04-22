import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    // Silently succeed if Resend not configured — feedback still saved in DB
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { subject, description, issueType, userEmail } = (await req.json()) as {
    subject?: string;
    description?: string;
    issueType?: string;
    userEmail?: string;
  };

  if (!subject || !description) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const typeLabel: Record<string, string> = {
    bug: "Bug Report",
    feature: "Feature Request",
    "lesson-content": "Lesson Content Issue",
    account: "Account Issue",
    other: "Other",
  };
  const typeDisplay = typeLabel[issueType ?? ""] ?? issueType ?? "Unknown";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Fundi Finance <hello@fundiapp.co.za>",
      to: ["support@fundiapp.co.za"],
      reply_to: userEmail ?? "no-reply@fundiapp.co.za",
      subject: `[${typeDisplay}] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px">
          <h2 style="color:#007A4D">New Feedback from Fundi Finance</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;font-weight:700;width:140px;color:#6b7280">Type</td>
              <td style="padding:8px 0">${typeDisplay}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:700;color:#6b7280">From</td>
              <td style="padding:8px 0">${userEmail ?? "Anonymous"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-weight:700;color:#6b7280">Subject</td>
              <td style="padding:8px 0">${subject}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
          <h3 style="font-size:14px;color:#374151;margin-bottom:8px">Description</h3>
          <p style="background:#f9fafb;border-radius:8px;padding:14px;white-space:pre-wrap;font-size:14px">${description}</p>
          <p style="font-size:12px;color:#9ca3af;margin-top:24px">Sent from Fundi Finance app feedback form</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    // Don't fail the user-facing request — feedback is already in DB
    console.error("[feedback-email] Resend error:", text);
    return NextResponse.json({ ok: true, emailError: text });
  }
  return NextResponse.json({ ok: true });
}
