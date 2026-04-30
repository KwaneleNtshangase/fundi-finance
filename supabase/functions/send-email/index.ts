// Supabase Edge Function — Fundi Finance Email
// Handles two types:
//   "welcome"  — sent immediately after onboarding (called from client)
//   "d1-batch" — called by pg_cron hourly; targets users 20h+ since last lesson
//
// Env vars (set in Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY            — Resend API key
//   SUPABASE_URL              — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Fundi Finance <hello@fundiapp.co.za>";

// ── Goal → human-readable label + encouragement ──────────────────────────────

const GOAL_LABELS: Record<string, { label: string; emoji: string; line: string }> = {
  "invest":         { label: "Start Investing",        emoji: "📈", line: "Every rand invested today is a rand working for you tomorrow." },
  "save-for-home":  { label: "Save for a Home",        emoji: "🏡", line: "You're building the foundation — literally." },
  "debt-free":      { label: "Get Debt-Free",          emoji: "⛓️‍💥", line: "Every lesson you complete is another link broken." },
  "emergency-fund": { label: "Build an Emergency Fund",emoji: "🛡️", line: "Peace of mind is a financial decision too." },
};

function goalInfo(goal?: string) {
  return GOAL_LABELS[goal ?? ""] ?? { label: "Build Financial Confidence", emoji: "💡", line: "Knowledge is the best investment you can make." };
}

// ── Streak helper ─────────────────────────────────────────────────────────────

function streakLine(streak: number): string {
  if (streak <= 0) return "Start your streak today — one lesson is all it takes.";
  if (streak === 1) return "You're on a 1-day streak. Keep it alive!";
  if (streak < 7)  return `You're on a ${streak}-day streak — don't break the chain! 🔥`;
  if (streak < 30) return `${streak} days in a row. That's real discipline. 🔥`;
  return `${streak} days straight. You're in the top 1% of learners. 🏆`;
}

// ── Welcome email template ────────────────────────────────────────────────────

function welcomeHtml(username: string, goal?: string): string {
  const name = username || "Mfundi";
  const g = goalInfo(goal);
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

            <p style="margin:0 0 16px;font-size:18px;color:#1a1a1a;font-weight:700;">Sawubona, ${name}! 👋</p>

            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
              You've just taken the first step towards understanding your money — and that matters more than most people realise.
            </p>

            <!-- Goal card -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,#f0faf5 0%,#e6f5ed 100%);border:2px solid #1A7C4E;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#1A7C4E;text-transform:uppercase;letter-spacing:0.8px;">Your goal</p>
                <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#0f4f32;">${g.emoji} ${g.label}</p>
                <p style="margin:0;font-size:14px;color:#2c5f42;line-height:1.6;">${g.line}</p>
              </td></tr>
            </table>

            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
              Fundi is built for real South Africans — rands, SARS, TFSA, not dollars and 401(k)s. No jargon. No judgement. Just practical lessons you can apply today.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#1A7C4E;border-radius:12px;">
                  <a href="https://fundiapp.co.za" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                    Start your first lesson →
                  </a>
                </td>
              </tr>
            </table>

            <!-- What's next -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8f8f8;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:0.5px;">What to expect</p>
                <p style="margin:0 0 8px;font-size:14px;color:#333;">🏆 <strong>XP &amp; streaks</strong> — earn points, build a daily habit</p>
                <p style="margin:0 0 8px;font-size:14px;color:#333;">💰 <strong>Budget Planner</strong> — apply what you learn, instantly</p>
                <p style="margin:0;font-size:14px;color:#333;">📈 <strong>Personalised path</strong> — lessons matched to your goal</p>
              </td></tr>
            </table>

            <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
              Each lesson takes about 3 minutes. One a day for 90 days = a completely different financial life.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#bbb;">
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

// ── D+1 retention email template ──────────────────────────────────────────────

function d1Html(username: string, streak: number, goal?: string): string {
  const name = username || "Mfundi";
  const g = goalInfo(goal);
  const sLine = streakLine(streak);
  const streakBadge = streak > 0
    ? `<div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50px;padding:6px 18px;margin-top:12px;">
         <span style="color:#fff;font-size:15px;font-weight:700;">🔥 ${streak}-day streak</span>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your streak is waiting, ${name}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#E8511A 0%,#F47C3C 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:52px;margin-bottom:8px;">🔥</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;">Don't break your streak, ${name}</h1>
            ${streakBadge}
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px;">

            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
              ${sLine}
            </p>

            <!-- Goal reminder card -->
            <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff8f0;border:2px solid #f5a623;border-radius:14px;padding:18px 22px;margin-bottom:28px;">
              <tr><td>
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#b36a00;text-transform:uppercase;letter-spacing:0.8px;">Your goal</p>
                <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#7a3d00;">${g.emoji} ${g.label}</p>
                <p style="margin:0;font-size:14px;color:#8a5500;line-height:1.6;">
                  Every lesson you complete brings you closer. One missed day is fine — two starts a habit.
                </p>
              </td></tr>
            </table>

            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
              <strong>One lesson. 3 minutes.</strong> That's all it takes to keep the momentum going.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#E8511A;border-radius:12px;">
                  <a href="https://fundiapp.co.za" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
                    Continue learning →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#bbb;line-height:1.6;">
              If you'd rather not receive these nudges, just ignore this — we'll never spam you.
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#bbb;">
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

// ── Resend helper ─────────────────────────────────────────────────────────────

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

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { type?: string } = {};
  try { body = await req.json(); } catch { /* ok */ }

  // ── WELCOME EMAIL ───────────────────────────────────────────────────────────
  if (body.type === "welcome") {
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
    if (authErr || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401 });
    }

    // Fetch profile (username + goal) and dedupe check in one query
    const { data: profile } = await supabase
      .from("profiles")
      .select("retention_fired, username, goal")
      .eq("user_id", user.id)
      .maybeSingle();

    const fired: string[] = (profile?.retention_fired ?? "").split(",").filter(Boolean);
    if (fired.includes("welcome")) {
      return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), { status: 200 });
    }

    const username = profile?.username ?? "";
    const goal     = profile?.goal ?? undefined;

    const result = await sendEmail(
      user.email,
      `Welcome to Fundi Finance, ${username || "Mfundi"}! 🎓`,
      welcomeHtml(username, goal),
    );

    if (result.ok) {
      await supabase.from("profiles").update({
        retention_fired: [...fired, "welcome"].join(","),
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify(result), { status: result.ok ? 200 : 500 });
  }

  // ── D+1 RETENTION BATCH ─────────────────────────────────────────────────────
  if (body.type === "d1-batch") {
    // Find users whose last lesson was 20–48h ago
    const { data: candidates, error: queryErr } = await supabase
      .from("user_progress")
      .select("user_id, last_lesson_at, streak")
      .not("last_lesson_at", "is", null)
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
      const streak = (row.streak as number) ?? 0;

      // Fetch profile (username + goal + dedupe flag)
      const { data: profile } = await supabase
        .from("profiles")
        .select("retention_fired, username, goal")
        .eq("user_id", userId)
        .maybeSingle();

      const fired: string[] = (profile?.retention_fired ?? "").split(",").filter(Boolean);
      if (fired.includes("d1")) {
        results.push({ userId, status: "skipped_already_sent" });
        continue;
      }

      // Get user email from auth admin
      const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
      if (authErr || !authUser?.user?.email) {
        results.push({ userId, status: "skipped_no_email" });
        continue;
      }

      const username = profile?.username ?? "";
      const goal     = profile?.goal ?? undefined;
      const name     = username || "Mfundi";

      const emailResult = await sendEmail(
        authUser.user.email,
        `${name}, your ${streak > 0 ? `${streak}-day streak` : "momentum"} is waiting 🔥`,
        d1Html(username, streak, goal),
      );

      if (emailResult.ok) {
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
