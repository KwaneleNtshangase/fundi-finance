"use client";

import { supabase } from "@/lib/supabaseClient";
import { sastSundayDate, sastToday } from "@/lib/dates";

/**
 * Per-user weekly challenge stats, synced to user_progress.weekly_challenge_progress
 * via the merge_weekly_stats RPC (GREATEST for counters, union for day sets), so
 * two devices can only ever ADD progress, never lower each other.
 *
 * localStorage is a per-user write-through cache keyed by userId — the server
 * copy is what travels across devices.
 */
export type WeeklyStats = {
  weekKey: string; // Sunday anchor "YYYY-MM-DD"
  lessonsCompleted: number;
  xpEarned: number;
  perfectLessons: number;
  advancedLessons: number;
  days: string[]; // distinct SAST days with ≥1 lesson
  budgetDays: string[];
  calculatorDays: string[];
  lastLessonDay: string;
};

export function emptyWeeklyStats(weekKey = sastSundayDate()): WeeklyStats {
  return {
    weekKey,
    lessonsCompleted: 0,
    xpEarned: 0,
    perfectLessons: 0,
    advancedLessons: 0,
    days: [],
    budgetDays: [],
    calculatorDays: [],
    lastLessonDay: "",
  };
}

function statsKey(userId: string): string {
  return `notho-weekly-stats-${userId}`;
}

function sanitize(p: Partial<WeeklyStats> | null | undefined, weekKey: string): WeeklyStats {
  const base = emptyWeeklyStats(weekKey);
  if (!p) return base;
  const days = (a: unknown): string[] =>
    Array.isArray(a) ? a.filter((d): d is string => typeof d === "string").slice(0, 14) : [];
  return {
    weekKey,
    lessonsCompleted: Math.max(0, Number(p.lessonsCompleted ?? 0) || 0),
    xpEarned: Math.max(0, Number(p.xpEarned ?? 0) || 0),
    perfectLessons: Math.max(0, Number(p.perfectLessons ?? 0) || 0),
    advancedLessons: Math.max(0, Number(p.advancedLessons ?? 0) || 0),
    days: days(p.days),
    budgetDays: days(p.budgetDays),
    calculatorDays: days(p.calculatorDays),
    lastLessonDay: typeof p.lastLessonDay === "string" ? p.lastLessonDay : "",
  };
}

/** Read this week's stats from the per-user cache. A stale week resets to empty. */
export function readWeeklyStats(userId: string | null): WeeklyStats {
  const wk = sastSundayDate();
  if (typeof window === "undefined" || !userId) return emptyWeeklyStats(wk);
  try {
    const raw = localStorage.getItem(statsKey(userId));
    if (!raw) return emptyWeeklyStats(wk);
    const parsed = JSON.parse(raw) as Partial<WeeklyStats>;
    if (parsed.weekKey !== wk) return emptyWeeklyStats(wk);
    return sanitize(parsed, wk);
  } catch {
    return emptyWeeklyStats(wk);
  }
}

export function writeWeeklyStats(userId: string | null, stats: WeeklyStats): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(statsKey(userId), JSON.stringify(stats));
  } catch {
    /* best-effort cache */
  }
}

export function clearWeeklyStats(userId: string | null): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.removeItem(statsKey(userId));
  } catch {
    /* ignore */
  }
}

/** Push local stats to the server merge RPC; returns the merged result. */
export async function syncWeeklyStats(
  userId: string,
  local: WeeklyStats
): Promise<WeeklyStats | null> {
  const { data, error } = await supabase.rpc("merge_weekly_stats", {
    p_user_id: userId,
    p_week_key: local.weekKey,
    p_stats: local,
  });
  if (error) return null;
  const res = data as { ok?: boolean; stats?: Partial<WeeklyStats> } | null;
  if (!res?.ok || !res.stats) return null;
  const merged = sanitize(res.stats, local.weekKey);
  writeWeeklyStats(userId, merged);
  return merged;
}

export type WeeklyStatsBump = {
  lessonsCompleted?: number;
  xpEarned?: number;
  perfectLessons?: number;
  advancedLessons?: number;
  lessonDayToday?: boolean;
  budgetDayToday?: boolean;
  calculatorDayToday?: boolean;
};

/**
 * Apply a bump locally (instant UI) and fire the server merge in the
 * background. Returns the new local stats synchronously.
 */
export function bumpWeeklyStats(userId: string | null, bump: WeeklyStatsBump): WeeklyStats {
  const cur = readWeeklyStats(userId);
  const today = sastToday();
  const addDay = (arr: string[], on?: boolean) =>
    on && !arr.includes(today) ? [...arr, today] : arr;
  const next: WeeklyStats = {
    ...cur,
    lessonsCompleted: cur.lessonsCompleted + (bump.lessonsCompleted ?? 0),
    xpEarned: cur.xpEarned + (bump.xpEarned ?? 0),
    perfectLessons: cur.perfectLessons + (bump.perfectLessons ?? 0),
    advancedLessons: cur.advancedLessons + (bump.advancedLessons ?? 0),
    days: addDay(cur.days, bump.lessonDayToday),
    budgetDays: addDay(cur.budgetDays, bump.budgetDayToday),
    calculatorDays: addDay(cur.calculatorDays, bump.calculatorDayToday),
    lastLessonDay: bump.lessonDayToday ? today : cur.lastLessonDay,
  };
  writeWeeklyStats(userId, next);
  if (userId) void syncWeeklyStats(userId, next);
  return next;
}
