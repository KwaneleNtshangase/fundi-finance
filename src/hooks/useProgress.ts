/* eslint-disable no-console */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProgressState = {
  xp: number;
  streak: number;
  lastActivityDate: string | null; // Date.toDateString()
  completedLessons: string[]; // `${courseId}:${lessonId}` strings
};

export type WeeklyCompletionEntry = {
  completedAt: string;
  bonusXP: number;
};

export type WeeklyCompletionsMap = Record<string, WeeklyCompletionEntry>;

const LS_KEY = "fundiUserProgress_v1";
const FREEZE_LS_KEY = "fundi-freeze-count";
const WEEKLY_XP_LS_KEY = "fundi-weekly-xp";
const WEEK_KEY_LS_KEY = "fundi-week-key";

function getStoredFreezeCount(): number {
  if (typeof window === "undefined") return 0;
  return Math.max(0, parseInt(window.localStorage.getItem(FREEZE_LS_KEY) ?? "0", 10));
}

/** Returns the ISO week key for the most recent Sunday: "fundi-week-YYYY-MM-DD" */
function getCurrentWeekKey(): string {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay()); // roll back to Sunday
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const d = String(sunday.getDate()).padStart(2, "0");
  return `fundi-week-${y}-${m}-${d}`;
}

/** Sum fundi-daily-xp-* keys for every day of the current week (Sun→today).
 *  Used as a migration fallback so lessons earned before weekly tracking was
 *  added are still reflected in the leaderboard/stats. */
function sumDailyXpThisWeek(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  let total = 0;
  for (let i = 0; i <= today.getDay(); i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    total += Math.max(0, parseInt(window.localStorage.getItem(`fundi-daily-xp-${iso}`) ?? "0", 10));
  }
  return total;
}

function getStoredWeeklyXp(): { weeklyXp: number; weekKey: string } {
  if (typeof window === "undefined") return { weeklyXp: 0, weekKey: "" };
  const stored = window.localStorage.getItem(WEEK_KEY_LS_KEY) ?? "";
  const current = getCurrentWeekKey();
  if (stored !== current) {
    // New week — seed from daily keys in case there are pre-tracking lessons this week
    const fromDaily = sumDailyXpThisWeek();
    window.localStorage.setItem(WEEKLY_XP_LS_KEY, String(fromDaily));
    window.localStorage.setItem(WEEK_KEY_LS_KEY, current);
    return { weeklyXp: fromDaily, weekKey: current };
  }
  const storedXp = Math.max(0, parseInt(window.localStorage.getItem(WEEKLY_XP_LS_KEY) ?? "0", 10));
  // Migration: if daily keys have more XP than stored (e.g. lessons before tracking was added),
  // use the daily sum and write it back so future sessions stay in sync.
  const fromDaily = sumDailyXpThisWeek();
  const xp = Math.max(storedXp, fromDaily);
  if (xp > storedXp) {
    window.localStorage.setItem(WEEKLY_XP_LS_KEY, String(xp));
  }
  return { weeklyXp: xp, weekKey: current };
}

const DEFAULT_STATE: ProgressState = {
  xp: 0,
  streak: 0,
  lastActivityDate: null,
  completedLessons: [],
};

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/** Normalize a Postgres `date` / ISO `YYYY-MM-DD` to local `Date.toDateString()` (avoids UTC day-shift). */
function pgDateToLocalDateString(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toDateString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toDateString();
}

/** Local calendar day as `YYYY-MM-DD` from a string that `Date` parses in local time (e.g. `toDateString()`). */
function localActivityToPgDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const lastActivityDate =
    a.lastActivityDate && b.lastActivityDate
      ? new Date(a.lastActivityDate) > new Date(b.lastActivityDate)
        ? a.lastActivityDate
        : b.lastActivityDate
      : a.lastActivityDate ?? b.lastActivityDate ?? null;

  return {
    xp: Math.max(a.xp, b.xp),
    streak: Math.max(a.streak, b.streak),
    lastActivityDate,
    completedLessons: uniq([...a.completedLessons, ...b.completedLessons]),
  };
}

function applyWeeklyCompletionsToLocalStorage(map: WeeklyCompletionsMap | null) {
  if (!map || typeof window === "undefined") return;
  for (const [wcId, meta] of Object.entries(map)) {
    if (!meta?.completedAt) continue;
    const key = `fundi-wc-${wcId}`;
    const raw = localStorage.getItem(key);
    let parsed: Record<string, unknown> = {
      lessonsCompleted: 0,
      xpEarned: 0,
      perfectLessons: 0,
      dailyXp: 0,
      completed: false,
    };
    if (raw) {
      try {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && String(n).trim() === raw.trim()) {
          parsed = { ...parsed, lessonsCompleted: n };
        } else {
          parsed = { ...parsed, ...JSON.parse(raw) };
        }
      } catch {
        /* ignore */
      }
    }
    parsed.completed = true;
    localStorage.setItem(key, JSON.stringify(parsed));
    localStorage.setItem(`fundi-wc-claimed-${wcId}`, "true");
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [freezeCount, setFreezeCount] = useState<number>(0);
  const [weeklyXp, setWeeklyXp] = useState<number>(0);
  const [weekKey, setWeekKey] = useState<string>("");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMigratedGuestRef = useRef(false);
  const suppressNextPersistRef = useRef(false);
  /** Guards against writing empty state to Supabase before the server load has completed. */
  const serverLoadDoneRef = useRef(false);

  const completedLessons = useMemo(() => new Set(state.completedLessons), [state.completedLessons]);

  useEffect(() => {
    const guest = safeParse<ProgressState>(window.localStorage.getItem(LS_KEY));
    if (guest) setState((prev) => ({ ...prev, ...guest }));
    setFreezeCount(getStoredFreezeCount());
    const { weeklyXp: wXp, weekKey: wKey } = getStoredWeeklyXp();
    setWeeklyXp(wXp);
    setWeekKey(wKey);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        const uid = data.session?.user?.id ?? null;
        setUserId(uid);
      })
      .catch(() => {
        if (!mounted) return;
        setUserId(null);
      })
      .finally(() => {
        if (!mounted) return;
        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      // Guest session — allow persisting immediately (localStorage only)
      serverLoadDoneRef.current = true;
      return;
    }

    // New user session — block persist until we've read from Supabase
    serverLoadDoneRef.current = false;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select(
          "xp,streak,last_activity_date,completed_lessons,weekly_completions"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.warn("Failed to load user_progress:", error.message);
      }

      const wcRaw = data?.weekly_completions as WeeklyCompletionsMap | null | undefined;
      if (wcRaw && typeof wcRaw === "object") {
        applyWeeklyCompletionsToLocalStorage(wcRaw);
      }

      const serverState: ProgressState | null = data
        ? {
            xp: data.xp ?? 0,
            streak: data.streak ?? 0,
            lastActivityDate: data.last_activity_date
              ? pgDateToLocalDateString(String(data.last_activity_date))
              : null,
            completedLessons: (data.completed_lessons ?? []) as string[],
          }
        : null;

      const guest = safeParse<ProgressState>(window.localStorage.getItem(LS_KEY));

      if (!serverState) {
        if (guest && !hasMigratedGuestRef.current) {
          hasMigratedGuestRef.current = true;
        }
      } else {
        if (guest && !hasMigratedGuestRef.current) {
          hasMigratedGuestRef.current = true;
          const merged = mergeProgress(serverState, guest);
          suppressNextPersistRef.current = true;
          setState(merged);
          await supabase
            .from("user_progress")
            .upsert(
              {
                user_id: userId,
                xp: merged.xp,
                streak: merged.streak,
                last_activity_date: merged.lastActivityDate
                  ? localActivityToPgDate(merged.lastActivityDate)
                  : null,
                completed_lessons: merged.completedLessons,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
        } else {
          suppressNextPersistRef.current = true;
          setState(serverState);
        }
      }

      // Only allow the persist effect to write AFTER we have loaded (or confirmed absence of)
      // server data. This prevents a race condition where a new-device sign-in with empty
      // localStorage writes DEFAULT_STATE to Supabase before the Supabase read completes,
      // wiping the user's progress.
      serverLoadDoneRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, userId]);

  useEffect(() => {
    if (!ready) return;
    // Don't write until the server load has completed — prevents wiping Supabase data
    // on new devices where localStorage is empty but the user has a server-side record.
    if (userId && !serverLoadDoneRef.current) return;

    if (suppressNextPersistRef.current) {
      suppressNextPersistRef.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (userId) {
        const currentKey = getCurrentWeekKey();
        const { weeklyXp: currentWeeklyXp } = getStoredWeeklyXp();
        const { error } = await supabase
          .from("user_progress")
          .upsert(
            {
              user_id: userId,
              xp: state.xp,
              streak: state.streak,
              last_activity_date: state.lastActivityDate
                ? localActivityToPgDate(state.lastActivityDate)
                : null,
              completed_lessons: state.completedLessons,
              weekly_xp: currentWeeklyXp,
              week_key: currentKey,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (error) console.warn("Failed to upsert user_progress:", error.message);
      } else {
        window.localStorage.setItem(LS_KEY, JSON.stringify(state));
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [ready, userId, state]);

  const addXP = (amount: number) => {
    setState((prev) => ({
      ...prev,
      xp: Math.max(0, prev.xp + amount),
    }));
    // Also track this week's XP
    if (typeof window !== "undefined") {
      const currentKey = getCurrentWeekKey();
      const storedKey = window.localStorage.getItem(WEEK_KEY_LS_KEY) ?? "";
      const base = storedKey === currentKey
        ? Math.max(0, parseInt(window.localStorage.getItem(WEEKLY_XP_LS_KEY) ?? "0", 10))
        : 0;
      const next = base + amount;
      window.localStorage.setItem(WEEKLY_XP_LS_KEY, String(next));
      window.localStorage.setItem(WEEK_KEY_LS_KEY, currentKey);
      setWeeklyXp(next);
      setWeekKey(currentKey);
    }
  };

  /** Deduct XP if balance is enough. Syncs guest localStorage immediately; authed Supabase upsert immediately. */
  const tryDeductXp = (amount: number): boolean => {
    let ok = false;
    let nextXp = 0;
    setState((prev) => {
      if (prev.xp < amount) return prev;
      ok = true;
      nextXp = prev.xp - amount;
      return { ...prev, xp: nextXp };
    });
    if (!ok) return false;
    if (userId) {
      void supabase
        .from("user_progress")
        .upsert(
          {
            user_id: userId,
            xp: nextXp,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        .then(({ error }) => {
          if (error) console.warn("tryDeductXp upsert:", error.message);
        });
    } else {
      const cur =
        safeParse<ProgressState>(window.localStorage.getItem(LS_KEY)) ??
        DEFAULT_STATE;
      window.localStorage.setItem(
        LS_KEY,
        JSON.stringify({ ...cur, xp: nextXp })
      );
    }
    suppressNextPersistRef.current = true;
    return true;
  };

  const completeLesson = (id: string) => {
    setState((prev) => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(id)
        ? prev.completedLessons
        : [...prev.completedLessons, id],
    }));
  };

  /** Returns new streak count if the day was advanced, or null if already counted today. */
  const applyStreakAfterLesson = (): number | null => {
    const todayD = new Date();
    const today = todayD.toDateString();
    const yPrev = new Date(todayD);
    yPrev.setDate(yPrev.getDate() - 1);
    const yesterday = yPrev.toDateString();
    const twoDaysAgo = new Date(todayD);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toDateString();
    let result: number | null = null;
    setState((prev) => {
      if (prev.lastActivityDate === today) return prev;
      // If exactly one day was missed and user has a freeze, auto-consume it
      const missedExactlyOneDay = prev.lastActivityDate === twoDaysAgoStr;
      const currentFreezes = getStoredFreezeCount();
      if (missedExactlyOneDay && currentFreezes > 0) {
        const newCount = currentFreezes - 1;
        window.localStorage.setItem(FREEZE_LS_KEY, String(newCount));
        setFreezeCount(newCount);
        result = prev.streak + 1;
        return { ...prev, streak: prev.streak + 1, lastActivityDate: today };
      }
      const newStreak =
        prev.lastActivityDate === yesterday ? prev.streak + 1 : 1;
      result = newStreak;
      return { ...prev, streak: newStreak, lastActivityDate: today };
    });
    return result;
  };

  /** Buy a streak freeze for `cost` XP (default 200). Returns true if purchase succeeded. */
  const buyStreakFreeze = (cost = 200): boolean => {
    if (!tryDeductXp(cost)) return false;
    const next = getStoredFreezeCount() + 1;
    window.localStorage.setItem(FREEZE_LS_KEY, String(next));
    setFreezeCount(next);
    return true;
  };

  const persistWeeklyChallengeCompletion = async (
    weeklyId: string,
    bonusXP: number
  ) => {
    const entry: WeeklyCompletionEntry = {
      completedAt: new Date().toISOString(),
      bonusXP,
    };
    if (userId) {
      const { data: row, error: readErr } = await supabase
        .from("user_progress")
        .select("weekly_completions")
        .eq("user_id", userId)
        .maybeSingle();
      if (readErr) {
        console.warn("weekly_completions read:", readErr.message);
        return;
      }
      const current = (row?.weekly_completions as WeeklyCompletionsMap | null) ?? {};
      const next = { ...current, [weeklyId]: entry };
      const { error } = await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: userId,
            weekly_completions: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (error) console.warn("weekly_completions upsert:", error.message);
    }
  };

  const resetProgress = async () => {
    setState(DEFAULT_STATE);
    if (userId) {
      await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: userId,
            xp: 0,
            streak: 0,
            last_activity_date: null,
            completed_lessons: [],
            weekly_completions: {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    } else {
      window.localStorage.removeItem(LS_KEY);
    }
  };

  return {
    ready,
    userId,
    xp: state.xp,
    streak: state.streak,
    completedLessons,
    freezeCount,
    weeklyXp,
    weekKey,
    addXP,
    tryDeductXp,
    completeLesson,
    applyStreakAfterLesson,
    buyStreakFreeze,
    persistWeeklyChallengeCompletion,
    resetProgress,
  };
}
