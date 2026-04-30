// Supabase Edge Function — Fundi Finance Email
// Handles two types:
//   "welcome"  — sent immediately after onboarding (called from client)
//   "d1-batch" — called by pg_cron hourly; targets users 20h+ since last lesson
//
// Env vars (set in Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY            — Resend API key
//   SUPABASE_URL              — injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — injected automatically by Supabase
//
// Resend Templates (edit at resend.com/templates):
//   fundi-welcome       — a599bf54-7f17-4ed6-8f27-cdb058e0ae5d
//   fundi-d1-retention  — 14f12c73-516c-4649-bf18-048c8891b535

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY           = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FROM = "Fundi Finance <hello@fundiapp.co.za>";

const WELCOME_TEMPLATE_ID = "a599bf54-7f17-4ed6-8f27-cdb058e0ae5d";
const D1_TEMPLATE_ID      = "14f12c73-516c-4649-bf18-048c8891b535";

// ── Goal → human-readable label + encouragement ───────────────────────────────

const GOAL_LABELS: Record<string, { label: string; emoji: string; line: string }> = {
  "invest":         { label: "Start Investing",         emoji: "📈", line: "Every rand invested today is a rand working for you tomorrow." },
  "save-for-home":  { label: "Save for a Home",         emoji: "🏡", line: "You are building the foundation, literally." },
  "debt-free":      { label: "Get Debt-Free",           emoji: "⛓️‍💥", line: "Every lesson you complete is another link broken." },
  "emergency-fund": { label: "Build an Emergency Fund", emoji: "🛡️", line: "Peace of mind is a financial decision too." },
};

function goalInfo(goal?: string) {
  return GOAL_LABELS[goal ?? ""] ?? {
    label: "Build Financial Confidence",
    emoji: "💡",
    line:  "Knowledge is the best investment you can make.",
  };
}

// ── Streak helper ─────────────────────────────────────────────────────────────

function streakLine(streak: number): string {
  if (streak <= 0) return "Start your streak today, one lesson is all it takes.";
  if (streak === 1) return "You are on a 1-day streak. Keep it alive!";
  if (streak < 7)  return `You are on a ${streak}-day streak; don't break the chain! 🔥`;
  if (streak < 30) return `${streak} days in a row. That is real discipline. 🔥`;
  return `${streak} days straight. You are in the top 1% of learners. 🏆`;
}

function streakBadge(streak: number): string {
  if (streak <= 0) return "";
  return `<div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50px;padding:6px 18px;margin-top:12px;">
    <span style="color:#fff;font-size:15px;font-weight:700;">🔥 ${streak}-day streak</span>
  </div>`;
}

// ── Resend helper — sends via template_id + variables ─────────────────────────

async function sendViaTemplate(
  to: string,
  subject: string,
  templateId: string,
  variables: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:        FROM,
        to,
        subject,
        template_id: templateId,
        variables,
      }),
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("retention_fired, username, goal")
      .eq("user_id", user.id)
      .maybeSingle();

    const fired: string[] = (profile?.retention_fired ?? "").split(",").filter(Boolean);
    if (fired.includes("welcome")) {
      return new Response(JSON.stringify({ skipped: true, reason: "already_sent" }), { status: 200 });
    }

    const username = profile?.username ?? "Mfundi";
    const g        = goalInfo(profile?.goal);

    const result = await sendViaTemplate(
      user.email,
      `Welcome to Fundi Finance, ${username}!`,
      WELCOME_TEMPLATE_ID,
      {
        username,
        goal_emoji: g.emoji,
        goal_label: g.label,
        goal_line:  g.line,
      },
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

      const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
      if (authErr || !authUser?.user?.email) {
        results.push({ userId, status: "skipped_no_email" });
        continue;
      }

      const username = profile?.username ?? "Mfundi";
      const g        = goalInfo(profile?.goal);
      const subject  = streak > 0
        ? `${username}, your ${streak}-day streak is waiting 🔥`
        : `${username}, your momentum is waiting 🔥`;

      const emailResult = await sendViaTemplate(
        authUser.user.email,
        subject,
        D1_TEMPLATE_ID,
        {
          username,
          streak_badge: streakBadge(streak),
          streak_line:  streakLine(streak),
          goal_emoji:   g.emoji,
          goal_label:   g.label,
        },
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

  return new Response(
    JSON.stringify({ error: "Unknown type. Use 'welcome' or 'd1-batch'." }),
    { status: 400 },
  );
});
