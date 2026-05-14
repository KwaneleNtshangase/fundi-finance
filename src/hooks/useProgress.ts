"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProgressState = {
  xp: number;
  streak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  completedLessons: string[];
  freezeCount: number;
  weeklyXp: number;
  weekKey: string;
};

export type WeeklyCompletionEntry = {
  completedAt: string;
  bonusXP: number;
};

export type WeeklyCompletionsMap = Record<string, WeeklyCompletionEntry>;

const DEFAULT_STATE: ProgressState = {
  xp: 0,
  streak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  completedLessons: [],
  freezeCount: 0,
  weeklyXp: 0,
  weekKey: "",
};

// ── Offline-first cache ────────────────────────────────────────────────────────
// Write-through localStorage cache so the app loads instantly even on
// poor / no connectivity (SA users on prepaid data and during load-shedding).
// Supabase remains the source of truth — cache is overwritten on every
// successful Supabase read; it only fills the gap while waiting for network.
const PROGRESS_CACHE_KEY = "fundi-progress-v1";

function readProgressCache(): ProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROGRESS_CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<ProgressState>;
    return {
      xp: Number(p.xp ?? 0),
      streak: Number(p.streak ?? 0),
      longestStreak: Number(p.longestStreak ?? 0),
      lastActivityDate: p.lastActivityDate ?? null,
      completedLessons: Array.isArray(p.completedLessons) ? p.completedLessons : [],
      freezeCount: Number(p.freezeCount ?? 0),
      weeklyXp: Number(p.weeklyXp ?? 0),
      weekKey: p.weekKey ?? "",
    };
  } catch {
    return null;
  }
}

function writeProgressCache(s: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(s));
  } catch { /* ignore quota errors — cache is best-effort */ }
}

function getCurrentWeekKey(): string {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const d = String(sunday.getDate()).padStart(2, "0");
  return `fundi-week-${y}-${m}-${d}`;
}

export function useProgress() {
  // Seed from cache immediately (shows last-known XP/streak before Supabase responds)
  const [state, setState] = useState<ProgressState>(() => readProgressCache() ?? DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const completedLessons = useMemo(() => new Set(state.completedLessons), [state.completedLessons]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(DEFAULT_STATE);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("xp,streak,longest_streak,last_activity_date,completed_lessons,streak_freeze_count,weekly_xp,week_key")
        .eq("user_id", userId)
        .maybeSingle();
      const wk = getCurrentWeekKey();
      const dbLessons = (data?.completed_lessons ?? []) as string[];

      // Merge: take the union of DB lessons and any cached lessons.
      // This recovers lessons that were saved locally but whose DB write failed
      // (e.g. row didn't exist yet when .update() fired, poor connectivity, etc.)
      const cache = readProgressCache();
      const cacheLessons = cache?.completedLessons ?? [];
      const offlineLessons = cacheLessons.filter((l) => !dbLessons.includes(l));
      const mergedLessons = offlineLessons.length > 0
        ? [...dbLessons, ...offlineLessons]
        : dbLessons;

      // Write any recovered lessons back to Supabase immediately
      if (offlineLessons.length > 0 && userId) {
        void supabase
          .from("user_progress")
          .upsert(
            { user_id: userId, completed_lessons: mergedLessons, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
      }

      const fresh: ProgressState = {
        xp: data?.xp ?? 0,
        streak: data?.streak ?? 0,
        longestStreak: Math.max(Number(data?.longest_streak ?? 0), Number(data?.streak ?? 0)),
        lastActivityDate: data?.last_activity_date ? String(data.last_activity_date) : null,
        completedLessons: mergedLessons,
        freezeCount: Math.max(0, Number(data?.streak_freeze_count ?? 0)),
        weeklyXp: data?.week_key === wk ? Math.max(0, Number(data?.weekly_xp ?? 0)) : 0,
        weekKey: wk,
      };
      setState(fresh);
      // Update the offline-first cache so next load is instant even without network
      writeProgressCache(fresh);
    })().catch((e) => console.warn("load progress failed", e));
  }, [userId]);

  const persist = async (partial: Partial<ProgressState>) => {
    if (!userId) return;
    const next = { ...state, ...partial };
    const payload: Record<string, unknown> = {
      user_id: userId,
      xp: next.xp,
      streak: next.streak,
      last_activity_date: next.lastActivityDate,
      completed_lessons: next.completedLessons,
      streak_freeze_count: next.freezeCount,
      weekly_xp: next.weeklyXp,
      week_key: next.weekKey || getCurrentWeekKey(),
      updated_at: new Date().toISOString(),
    };
    await supabase.from("user_progress").upsert(payload, { onConflict: "user_id" });
  };

  const addXP = (amount: number) => {
    setState((prev) => {
      const wk = getCurrentWeekKey();
      const newXp = Math.max(0, prev.xp + amount);
      const newWeeklyXp = prev.weekKey === wk ? prev.weeklyXp + amount : amount;
      const next = { ...prev, xp: newXp, weeklyXp: newWeeklyXp, weekKey: wk };
      // Targeted update for only XP columns to avoid race with completeLesson's
      // targeted update for completed_lessons — never overwrite each other.
      if (userId) {
        void supabase
          .from("user_progress")
          .upsert(
            { user_id: userId, xp: newXp, weekly_xp: newWeeklyXp, week_key: wk, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
      }
      writeProgressCache(next);
      return next;
    });
  };

  const tryDeductXp = (amount: number): boolean => {
    if (state.xp < amount) return false;
    const nextXp = Math.max(0, state.xp - amount);
    setState((prev) => {
      const next = { ...prev, xp: nextXp };
      writeProgressCache(next);
      return next;
    });
    // Targeted update — only xp, not weekly_xp, to avoid stale overwrites
    if (userId) {
      void supabase
        .from("user_progress")
        .update({ xp: nextXp, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
    return true;
  };

  const completeLesson = (id: string) => {
    setState((prev) => {
      const nextLessons = prev.completedLessons.includes(id) ? prev.completedLessons : [...prev.completedLessons, id];
      const next = { ...prev, completedLessons: nextLessons };
      writeProgressCache(next);
      // Use upsert (not update) so that if the row doesn't exist yet — e.g. the
      // sync-streak call that creates it hasn't landed yet — the lesson is still
      // persisted. Only completed_lessons + updated_at are specified so no other
      // column (xp, streak, weekly_xp) gets touched or reset.
      if (userId) {
        void supabase
          .from("user_progress")
          .upsert(
            { user_id: userId, completed_lessons: nextLessons, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
      }
      return next;
    });
  };

  const applyStreakAfterLesson = async (): Promise<number> => {
    if (!userId) return state.streak;
    try {
      const r = await fetch("/api/progress/sync-streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await r.json();
      if (!json?.ok) {
        console.warn("[applyStreakAfterLesson] sync-streak failed:", json?.error);
        return state.streak;
      }
      setState((prev) => ({
        ...prev,
        streak: json.streak,
        longestStreak: Math.max(json.longestStreak ?? json.streak, prev.longestStreak),
        lastActivityDate: json.lastActivityDate,
      }));
      return json.streak as number;
    } catch (e) {
      console.warn("[applyStreakAfterLesson] fetch failed:", e);
      return state.streak;
    }
  };

  const buyStreakFreeze = (cost = 200): boolean => {
    if (!tryDeductXp(cost)) return false;
    const next = state.freezeCount + 1;
    setState((prev) => ({ ...prev, freezeCount: next }));
    // Targeted update — only freezeCount, xp already handled by tryDeductXp
    if (userId) {
      void supabase
        .from("user_progress")
        .update({ streak_freeze_count: next, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }
    return true;
  };

  // Consume one of the weekly streak_freeze_count tokens via DB RPC.
  // Returns { ok, streak, freezesLeft } or { ok: false, reason }.
  const useFreeze = async (): Promise<{ ok: boolean; streak?: number; freezesLeft?: number; reason?: string }> => {
    if (!userId) return { ok: false, reason: "not_logged_in" };
    if (state.freezeCount <= 0) return { ok: false, reason: "no_freezes_left" };
    const { data, error } = await supabase.rpc("use_streak_freeze", { p_user_id: userId });
    if (error) {
      console.warn("[useFreeze] RPC error", error.message);
      return { ok: false, reason: error.message };
    }
    const result = data as { ok: boolean; streak?: number; freezes_left?: number; reason?: string };
    if (result.ok) {
      setState((prev) => ({ ...prev, freezeCount: result.freezes_left ?? Math.max(0, prev.freezeCount - 1) }));
    }
    return { ok: result.ok, streak: result.streak, freezesLeft: result.freezes_left, reason: result.reason };
  };

  const persistWeeklyChallengeCompletion = async (weeklyId: string, bonusXP: number) => {
    if (!userId) return;
    const { data: row } = await supabase
      .from("user_progress")
      .select("weekly_completions")
      .eq("user_id", userId)
      .maybeSingle();
    const current = (row?.weekly_completions as WeeklyCompletionsMap | null) ?? {};
    const next = {
      ...current,
      [weeklyId]: { completedAt: new Date().toISOString(), bonusXP },
    };
    await supabase
      .from("user_progress")
      .upsert({ user_id: userId, weekly_completions: next }, { onConflict: "user_id" });
  };

  const resetProgress = async () => {
    setState(DEFAULT_STATE);
    if (!userId) return;
    await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        xp: 0,
        streak: 0,
        last_activity_date: null,
        completed_lessons: [],
        weekly_completions: {},
        weekly_xp: 0,
        week_key: getCurrentWeekKey(),
        streak_freeze_count: 0,
      },
      { onConflict: "user_id" }
    );
  };

  return {
    ready,
    userId,
    xp: state.xp,
    streak: state.streak,
    longestStreak: state.longestStreak,
    lastActivityDate: state.lastActivityDate,
    completedLessons,
    freezeCount: state.freezeCount,
    weeklyXp: state.weeklyXp,
    weekKey: state.weekKey,
    addXP,
    tryDeductXp,
    completeLesson,
    applyStreakAfterLesson,
    buyStreakFreeze,
    useFreeze,
    persistWeeklyChallengeCompletion,
    resetProgress,
  };
}
