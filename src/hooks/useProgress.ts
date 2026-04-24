"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProgressState = {
  xp: number;
  streak: number;
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
  lastActivityDate: null,
  completedLessons: [],
  freezeCount: 0,
  weeklyXp: 0,
  weekKey: "",
};

function getCurrentWeekKey(): string {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const d = String(sunday.getDate()).padStart(2, "0");
  return `fundi-week-${y}-${m}-${d}`;
}

/**
 * Compute the real streak from daily_xp_history.
 *
 * History keys are UTC dates (YYYY-MM-DD).  We walk backward from today:
 * - If today has XP, start counting from today.
 * - Otherwise start from yesterday (user hasn't done a lesson yet today).
 * Streak freezes bridge a single missing day when there is active XP on
 * both sides of the gap.
 */
function computeStreakFromHistory(
  history: Record<string, number>,
  freezeCount: number
): number {
  if (!history || Object.keys(history).length === 0) return 0;

  const now = new Date();
  const todayUTC = now.toISOString().slice(0, 10);
  const yesterdayUTC = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);

  const activeToday = (history[todayUTC] ?? 0) > 0;

  // If neither today nor yesterday has XP the streak has lapsed.
  if (!activeToday && (history[yesterdayUTC] ?? 0) === 0) return 0;

  // Start walking from the most recent active day.
  const startDate = activeToday ? todayUTC : yesterdayUTC;
  let streak = 0;
  let freezesLeft = Math.max(0, freezeCount);
  const d = new Date(startDate + "T12:00:00Z");

  while (true) {
    const key = d.toISOString().slice(0, 10);
    if ((history[key] ?? 0) > 0) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else if (freezesLeft > 0) {
      // Peek one day further back — only use a freeze if the chain continues.
      const prevD = new Date(d);
      prevD.setUTCDate(prevD.getUTCDate() - 1);
      const prevKey = prevD.toISOString().slice(0, 10);
      if ((history[prevKey] ?? 0) > 0) {
        freezesLeft--;
        streak++; // the frozen (skipped) day counts
        d.setUTCDate(d.getUTCDate() - 1); // step past the gap
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
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
        .select("xp,streak,last_activity_date,completed_lessons,freeze_count,weekly_xp,week_key,daily_xp_history")
        .eq("user_id", userId)
        .maybeSingle();
      const wk = getCurrentWeekKey();
      const freezeCount = Math.max(0, Number(data?.freeze_count ?? 0));
      const history = (data?.daily_xp_history ?? {}) as Record<string, number>;

      // Compute the real streak from ground-truth history rather than the
      // stored counter, which can drift when manual patches or bugs corrupt it.
      // Falls back to the stored counter only when history is completely empty.
      const computedStreak =
        Object.keys(history).length > 0
          ? computeStreakFromHistory(history, freezeCount)
          : Math.max(0, Number(data?.streak ?? 0));

      setState({
        xp: data?.xp ?? 0,
        streak: computedStreak,
        lastActivityDate: data?.last_activity_date ? String(data.last_activity_date) : null,
        completedLessons: (data?.completed_lessons ?? []) as string[],
        freezeCount,
        weeklyXp: data?.week_key === wk ? Math.max(0, Number(data?.weekly_xp ?? 0)) : 0,
        weekKey: wk,
      });
    })().catch((e) => console.warn("load progress failed", e));
  }, [userId]);

  const persist = async (partial: Partial<ProgressState>) => {
    if (!userId) return;
    const next = { ...state, ...partial };
    // NOTE: streak and last_activity_date are intentionally excluded here.
    // They are owned exclusively by the /api/progress/sync-streak route, which
    // uses the server-side clock and atomic read-modify-write logic.
    const payload: Record<string, unknown> = {
      user_id: userId,
      xp: next.xp,
      completed_lessons: next.completedLessons,
      freeze_count: next.freezeCount,
      weekly_xp: next.weeklyXp,
      week_key: next.weekKey || getCurrentWeekKey(),
      updated_at: new Date().toISOString(),
    };
    await supabase.from("user_progress").upsert(payload, { onConflict: "user_id" });
  };

  const addXP = (amount: number) => {
    setState((prev) => {
      const wk = getCurrentWeekKey();
      const next = {
        ...prev,
        xp: Math.max(0, prev.xp + amount),
        weeklyXp: prev.weekKey === wk ? prev.weeklyXp + amount : amount,
        weekKey: wk,
      };
      void persist(next);
      return next;
    });
  };

  const tryDeductXp = (amount: number): boolean => {
    if (state.xp < amount) return false;
    const nextXp = Math.max(0, state.xp - amount);
    setState((prev) => ({ ...prev, xp: nextXp }));
    void persist({ xp: nextXp });
    return true;
  };

  const completeLesson = (id: string) => {
    setState((prev) => {
      const nextLessons = prev.completedLessons.includes(id) ? prev.completedLessons : [...prev.completedLessons, id];
      void persist({ completedLessons: nextLessons });
      return { ...prev, completedLessons: nextLessons };
    });
  };

  const applyStreakAfterLesson = async (): Promise<number | null> => {
    if (!userId) return null;
    try {
      const r = await fetch("/api/progress/sync-streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await r.json();
      if (!json?.ok) return state.streak;
      setState((prev) => ({ ...prev, streak: json.streak, lastActivityDate: json.lastActivityDate }));
      return json.streak as number;
    } catch {
      return state.streak;
    }
  };

  const buyStreakFreeze = (cost = 200): boolean => {
    if (!tryDeductXp(cost)) return false;
    const next = state.freezeCount + 1;
    setState((prev) => ({ ...prev, freezeCount: next }));
    void persist({ freezeCount: next });
    return true;
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
        freeze_count: 0,
      },
      { onConflict: "user_id" }
    );
  };

  return {
    ready,
    userId,
    xp: state.xp,
    streak: state.streak,
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
    persistWeeklyChallengeCompletion,
    resetProgress,
  };
}
