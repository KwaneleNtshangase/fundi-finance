// Supabase Edge Function — Fundi Finance Email
// Handles two types:
//   "welcome"  — send immediately after onboarding (called from client)
//   "d1-batch" — called by pg_cron hourly; finds users 20h+ since last lesson
//
// Requires env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY          — your Resend API key
//   SUPABASE_URL            — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Fundi Finance <hello@fundiapp.co.za>";

// ── Email templates ──────────────────────────────────────────────────────────

function welcomeHtml(username: string): string {
  const name = username || "Mfundi";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Fundi Finance</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A7C4E 0%,#2E9E68 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">🎓</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Welcome to Fundi Finance</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">funda iFinance — learn finance</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 16px;font-size:17px;color:#1a1a1a;font-weight:700;">Sawubona, ${name}! 👋</p>
            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
              You've just taken the first step towards understanding your money — and that matters more than most people realise.
            </p>
            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
              Fundi is built for real South Africans: no jargon, no judgement, just practical lessons you can apply today.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="background:#1A7C4E;border-radius:12px;">
                  <a href="https://fundiapp.co.za" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                    Start your first lesson →
                  </a>
                </td>
              </tr>
            </table>
            <!-- What's next -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0faf5;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A7C4E;text-transform:uppercase;letter-spacing:0.5px;">What to expect</p>
                <p style="margin:0 0 8px;font-size:14px;color:#2c5f42;">🏆 <strong>XP & streaks</strong> — earn points for every lesson, build a daily habit</p>
                <p style="margin:0 0 8px;font-size:14px;color:#2c5f42;">💰 <strong>Budget Planner</strong> — apply what you learn, instantly</p>
                <p style="margin:0;font-size:14px;color:#2c5f42;">📈 <strong>Real SA context</strong> — rands, SARS, TFSA, not dollars and 401(k)s</p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">
              Each lesson takes about 3 minutes. Even one lesson a day adds up to a completely different financial life in 90 days.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              Fundi Finance · <a href="https://fundiapp.co.za" style="color:#1A7C4E;text-decoration:none;">fundiapp.co.za</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function d1Html(username: string): string {
  const name = username || "Mfundi";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your streak is waiting</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E8511A 0%,#F47C3C 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:8px;">🔥</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Your streak is waiting</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 16px;font-size:17px;color:#1a1a1a;font-weight:700;">Hey ${name} 👋</p>
            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
              You crushed your last lesson on Fundi — don't let that momentum slip.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
              <strong>One lesson. 3 minutes.</strong> That's all it takes to keep your streak alive and stay on track.
            </p>
            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#E8511A;border-radius:12px;">
                  <a href="https://fundiapp.co.za" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
                    Continue learning →
                  </a>
                </td>
              </tr>
            </table>
            <!-- Reminder box -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff8f5;border:1px solid #f5ddd3;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
              <tr><td>
                <p style="margin:0;font-size:14px;color:#7a3a1a;line-height:1.6;">
                  💡 <strong>Did you know?</strong> People who do one lesson a day for 30 days report feeling significantly more confident about their money decisions. You're on the right path.
                </p>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
              If you'd rather not receive these reminders, just ignore this — we won't spam you.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              Fundi Finance · <a href="https://fundiapp.co.za" style="color:#1A7C4E;text-decoration:none;">fundiapp.co.za</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Resend helper ────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: txt };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { type?: string } = {};
  try { body = await req.json(); } catch { /* ok — fallthrough */ }

  // ── WELCOME EMAIL ─────────────────────────────────────────────────────────
  // Called from the client immediately after onboarding completes.
  // Auth: user's JWT (the client is logged in).
  if (body.type === "welcome") {
    // Identify user from JWT
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
    if (authErr || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });
    }

    // Check we haven't already sent the welcome email
    const { data: profile } = await supabase
      .from("profiles")
      .select("retention_fired, username")
      .eq("user_id", user.id)
      .maybeSingle();

    const fired: string[] = (profile?.retention_fired ?? "").split(",").filter(Boolean);
    if (fired.includes("welcome")) {
      return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), { status: 200 });
    }

    const username = profile?.username ?? "";
    const result = await sendEmail(
      user.email,
      "Welcome to Fundi Finance 🎓",
      welcomeHtml(username),
    );

    if (result.ok) {
      // Mark welcome as sent
      await supabase.from("profiles").update({
        retention_fired: [...fired, "welcome"].join(","),
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify(result), { status: result.ok ? 200 : 500 });
  }

  // ── D+1 RETENTION BATCH ───────────────────────────────────────────────────
  // Called by pg_cron hourly (server-to-server with service role key).
  // Finds all users whose last lesson was 20–48h ago and haven't received the D+1 email.
  if (body.type === "d1-batch") {
    // Only allow server calls (no user JWT expected here)
    const { data: candidates, error: queryErr } = await supabase
      .from("user_progress")
      .select("user_id, last_lesson_at")
      .not("last_lesson_at", "is", null)
      // Between 20h and 48h ago (48h upper bound = no point emailing after 2 days)
      .lt("last_lesson_at", new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString())
      .gt("last_lesson_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    if (queryErr) {
      return new Response(JSON.stringify({ error: queryErr.message }), { status: 500 });
    }

    if (!candidates?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_candidates" }), { status: 200 });
    }

    const results: Array<{ userId: string; status: string }> = [];

    for (const row of candidates) {
      const userId = row.user_id as string;

      // Check retention_fired to avoid duplicate D+1 email
      const { data: profile } = await supabase
        .from("profiles")
        .select("retention_fired, username")
        .eq("user_id", userId)
        .maybeSingle();

      const fired: string[] = (profile?.retention_fired ?? "").split(",").filter(Boolean);
      if (fired.includes("d1")) {
        results.push({ userId, status: "skipped_already_sent" });
        continue;
      }

      // Get user email from auth
      const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
      if (authErr || !authUser?.user?.email) {
        results.push({ userId, status: "skipped_no_email" });
        continue;
      }

      const username = profile?.username ?? "";
      const emailResult = await sendEmail(
        authUser.user.email,
        "Your Fundi streak is waiting 🔥",
        d1Html(username),
      );

      if (emailResult.ok) {
        // Mark d1 as sent
        await supabase.from("profiles").update({
          retention_fired: [...fired, "d1"].join(","),
        }).eq("user_id", userId);
        results.push({ userId, status: "sent" });
      } else {
        results.push({ userId, status: `failed: ${emailResult.error}` });
      }
    }

    const sent = results.filter(r => r.status === "sent").length;
    return new Response(JSON.stringify({ sent, results }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: "Unknown type. Use 'welcome' or 'd1-batch'." }), { status: 400 });
});
