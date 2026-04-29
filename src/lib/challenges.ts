import { supabase } from "@/lib/supabaseClient";
import { DAILY_CHALLENGE_BANK, type ChallengeBankItem, type ChallengeDifficulty, type ChallengeType, WEEKLY_CHALLENGE_BANK } from "@/lib/challengeBank";

type AssignmentKeyRow = {
  id: string;
  period_type: "daily" | "weekly";
  period_key: string;
  challenge_code: string;
};

type AssignmentRow = {
  id: string;
  challenge_code: string;
  target_value: number;
  xp_reward: number;
};

type ProgressRow = {
  current_value: number;
  target_value: number;
  is_complete: boolean;
} | null;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekKey() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;
}

function difficultyPool(lessons: number): ChallengeDifficulty[] {
  if (lessons < 5) return ["easy"];
  if (lessons <= 20) return ["easy", "medium"];
  return ["medium", "hard"];
}

function choose(bank: ChallengeBankItem[], allowed: ChallengeDifficulty[], count: number, excludes = new Set<string>()) {
  const pool = bank.filter((c) => allowed.includes(c.difficulty) && !excludes.has(c.id));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

export async function assignChallengesForUser(userId: string) {
  const today = getTodayKey();
  const week = getWeekKey();
  const { data: progress } = await supabase.from("user_progress").select("completed_lessons").eq("user_id", userId).maybeSingle();
  const lessons = Array.isArray(progress?.completed_lessons) ? progress.completed_lessons.length : 0;
  const allowed = difficultyPool(lessons);

  const { data: existing } = await supabase
    .from("user_challenge_assignments")
    .select("id,period_type,period_key,challenge_code")
    .eq("user_id", userId)
    .in("period_key", [today, week]);

  const keyed = (existing ?? []) as AssignmentKeyRow[];
  const dailyExisting = keyed.filter((r) => r.period_type === "daily" && r.period_key === today);
  const weeklyExisting = keyed.filter((r) => r.period_type === "weekly" && r.period_key === week);
  const inserts: Record<string, unknown>[] = [];

  if (dailyExisting.length < 3) {
    const selected = choose(DAILY_CHALLENGE_BANK, allowed, 3 - dailyExisting.length, new Set(dailyExisting.map((r) => r.challenge_code)));
    for (const c of selected) {
      inserts.push({
        user_id: userId,
        period_type: "daily",
        period_key: today,
        challenge_code: c.id,
        difficulty: c.difficulty,
        target_value: c.targetValue ?? 1,
        xp_reward: c.xpReward,
      });
    }
  }
  if (weeklyExisting.length < 2) {
    const selected = choose(WEEKLY_CHALLENGE_BANK, allowed, 2 - weeklyExisting.length, new Set(weeklyExisting.map((r) => r.challenge_code)));
    for (const c of selected) {
      inserts.push({
        user_id: userId,
        period_type: "weekly",
        period_key: week,
        challenge_code: c.id,
        difficulty: c.difficulty,
        target_value: c.targetValue ?? 1,
        xp_reward: c.xpReward,
      });
    }
  }
  if (inserts.length) {
    await supabase.from("user_challenge_assignments").insert(inserts);
  }
}

export async function evaluateChallengeProgress(userId: string, event: string, payload: Record<string, unknown> = {}) {
  const today = getTodayKey();
  const week = getWeekKey();
  const { data: rows } = await supabase
    .from("user_challenge_assignments")
    .select("id,challenge_code,target_value,xp_reward,completed_at")
    .eq("user_id", userId)
    .is("completed_at", null)
    .in("period_key", [today, week]);
  if (!rows?.length) return;

  const fullBank = [...DAILY_CHALLENGE_BANK, ...WEEKLY_CHALLENGE_BANK];
  for (const r of rows as AssignmentRow[]) {
    const definition = fullBank.find((d) => d.id === r.challenge_code);
    if (!definition || definition.event !== event) continue;
    // "set_max" mode: use max(current, value) for threshold checks like streak_count.
    // Default mode "add" accumulates value (e.g. lesson count, XP earned).
    const rawValue = Number(payload.value ?? payload.amount ?? 1) || 1;
    const mode = String(payload.mode ?? "add");
    const { data: existing } = await supabase
      .from("user_challenge_progress")
      .select("current_value,target_value,is_complete")
      .eq("assignment_id", r.id)
      .maybeSingle();
    const progress = (existing ?? null) as ProgressRow;
    const currentProgress = Number(progress?.current_value ?? 0);
    const nextValue = mode === "set_max"
      ? Math.max(currentProgress, rawValue)
      : Math.max(0, currentProgress + rawValue);
    const target = Number(progress?.target_value ?? r.target_value ?? 1);
    const isComplete = nextValue >= target;
    await supabase.from("user_challenge_progress").upsert({
      assignment_id: r.id,
      current_value: nextValue,
      target_value: target,
      is_complete: isComplete,
      updated_at: new Date().toISOString(),
    }, { onConflict: "assignment_id" });

    if (isComplete && !progress?.is_complete) {
      await supabase.from("user_challenge_assignments").update({ completed_at: new Date().toISOString() }).eq("id", r.id);
      const { data: up } = await supabase.from("user_progress").select("xp").eq("user_id", userId).maybeSingle();
      await supabase.from("user_progress").upsert({ user_id: userId, xp: Number(up?.xp ?? 0) + Number(r.xp_reward ?? 0) }, { onConflict: "user_id" });
    }
  }
}

export async function rerollChallenge(userId: string, assignmentId: string) {
  const today = getTodayKey();
  const { data: up } = await supabase
    .from("user_progress")
    .select("challenge_rerolls_date,challenge_rerolls_used,completed_lessons")
    .eq("user_id", userId)
    .maybeSingle();
  const used = up?.challenge_rerolls_date === today ? Number(up?.challenge_rerolls_used ?? 0) : 0;
  if (used >= 1) return { ok: false, reason: "limit_reached" } as const;

  const { data: assignment } = await supabase.from("user_challenge_assignments").select("*").eq("id", assignmentId).maybeSingle();
  if (!assignment) return { ok: false, reason: "not_found" } as const;

  const { data: all } = await supabase
    .from("user_challenge_assignments")
    .select("challenge_code")
    .eq("user_id", userId)
    .eq("period_type", assignment.period_type)
    .eq("period_key", assignment.period_key);
  const existingCodes = new Set(((all ?? []) as { challenge_code: string }[]).map((r) => r.challenge_code));
  const bank = assignment.period_type === "daily" ? DAILY_CHALLENGE_BANK : WEEKLY_CHALLENGE_BANK;
  const candidate = bank.find((c) => c.difficulty === assignment.difficulty && !existingCodes.has(c.id) && c.id !== assignment.challenge_code);
  if (!candidate) return { ok: false, reason: "no_candidate" } as const;

  await supabase.from("user_challenge_assignments").update({
    challenge_code: candidate.id,
    target_value: candidate.targetValue ?? 1,
    xp_reward: candidate.xpReward,
    rerolled_from: assignment.challenge_code,
    completed_at: null,
    claimed_at: null,
  }).eq("id", assignmentId);
  await supabase.from("user_challenge_progress").delete().eq("assignment_id", assignmentId);
  await supabase.from("user_progress").upsert({
    user_id: userId,
    challenge_rerolls_date: today,
    challenge_rerolls_used: used + 1,
  }, { onConflict: "user_id" });
  return { ok: true } as const;
}

export function lookupChallenge(challengeCode: string, type: ChallengeType) {
  const bank = type === "daily" ? DAILY_CHALLENGE_BANK : WEEKLY_CHALLENGE_BANK;
  return bank.find((c) => c.id === challengeCode) ?? null;
}
