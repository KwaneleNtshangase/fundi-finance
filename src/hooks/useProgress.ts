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
        .select("xp,streak,longest_streak,last_activity_date,completed_lessons,freeze_count,weekly_xp,week_key")
        .eq("user_id", userId)
        .maybeSingle();
      const wk = getCurrentWeekKey();
      setState({
        xp: data?.xp ?? 0,
        streak: data?.streak ?? 0,
        longestStreak: Math.max(Number(data?.longest_streak ?? 0), Number(data?.streak ?? 0)),
        lastActivityDate: data?.last_activity_date ? String(data.last_activity_date) : null,
        completedLessons: (data?.completed_lessons ?? []) as string[],
        freezeCount: Math.max(0, Number(data?.freeze_count ?? 0)),
        weeklyXp: data?.week_key === wk ? Math.max(0, Number(data?.weekly_xp ?? 0)) : 0,
        weekKey: wk,
      });
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

  const applyStreakAfterLesson = (): number | null => {
    if (!userId) return null;
    void fetch("/api/progress/sync-streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json?.ok) {
          console.warn("[applyStreakAfterLesson] sync-streak failed:", json?.error);
          return;
        }
        setState((prev) => ({
          ...prev,
          streak: json.streak,
          longestStreak: Math.max(json.longestStreak ?? json.streak, prev.longestStreak),
          lastActivityDate: json.lastActivityDate,
        }));
      })
      .catch((e) => console.warn("[applyStreakAfterLesson] fetch failed:", e));
    return state.streak;
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
    persistWeeklyChallengeCompletion,
    resetProgress,
  };
}
