import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/apiAuth";

/**
 * Records an auto-captured client error as a "bug" in the feedback table so the
 * team can triage it in the admin console and (once fixed) notify the user.
 * Stored alongside manual reports; resolution state lives in email_status.
 */
export async function POST(req: NextRequest) {
  let body: {
    area?: string; message?: string; stack?: string; url?: string; userAgent?: string;
    extra?: Record<string, unknown> | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = (body.message ?? "").toString().slice(0, 500).trim();
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  const area = (body.area ?? "unknown").toString().slice(0, 80);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ ok: true, skipped: true });

  // User is optional - errors can happen on unauthenticated screens.
  const user = await getUserFromRequest(req).catch(() => null);
  const admin = createClient(supabaseUrl, serviceKey);

  const subject = `[Auto] ${area}: ${message}`.slice(0, 200);
  const description = [
    `Area: ${area}`,
    `URL: ${body.url ?? "-"}`,
    `User: ${user?.email ?? "anonymous"}`,
    `Device: ${body.userAgent ?? "-"}`,
    body.extra ? `Extra: ${JSON.stringify(body.extra)}` : null,
    "",
    body.stack || message,
  ].filter(Boolean).join("\n").slice(0, 6000);

  const id = crypto.randomUUID();
  const { error: insertErr } = await admin.from("feedback").insert({
    id,
    user_id: user?.id ?? null,
    subject,
    description,
    issue_type: "bug",
    email_status: {
      auto: true,
      area,
      url: body.url ?? null,
      userAgent: body.userAgent ?? null,
      userEmail: user?.email ?? null,
      status: "new",
    },
  });
  if (insertErr) return NextResponse.json({ ok: false }, { status: 500 });

  // Throttle the team alert: only email on the first occurrence of this exact
  // error in the last 24h (avoid inbox spam from a repeating bug).
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("subject", subject)
      .gte("created_at", since);

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && (count ?? 1) <= 1) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Fundi Finance <hello@fundiapp.co.za>",
          to: [process.env.ALERT_EMAIL || "kwanelebc031@gmail.com"],
          subject: `Auto-captured bug: ${area}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px">
              <h2 style="color:#E03C31">A user hit a bug</h2>
              <p style="margin:4px 0"><b>Area:</b> ${area}</p>
              <p style="margin:4px 0"><b>User:</b> ${user?.email ?? "anonymous"}</p>
              <p style="margin:4px 0"><b>Message:</b> ${message}</p>
              <p style="margin:4px 0"><b>URL:</b> ${body.url ?? "-"}</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
              <p style="font-size:13px;color:#6b7280">Triage and notify the user from the admin console:</p>
              <p><a href="https://fundiapp.co.za/admin/bugs" style="color:#007A4D;font-weight:700">Open bug console →</a></p>
            </div>`,
        }),
      }).catch(() => {});
    }
  } catch {
    /* team alert is best-effort */
  }

  return NextResponse.json({ ok: true, id });
}
