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

const LS_KEY = "fundiUserProgress_v1";

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

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  // Merge guest progress into existing server progress
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

export function useProgress() {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMigratedGuestRef = useRef(false);
  const suppressNextPersistRef = useRef(false);

  const completedLessons = useMemo(() => new Set(state.completedLessons), [state.completedLessons]);

  // Load initial progress (guest first, then possibly overwrite from server)
  useEffect(() => {
    const guest = safeParse<ProgressState>(window.localStorage.getItem(LS_KEY));
    if (guest) setState((prev) => ({ ...prev, ...guest }));
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

  // Fetch server progress on login, then migrate guest->server once.
  useEffect(() => {
    if (!ready) return;
    if (!userId) return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("xp,streak,last_activity_date,completed_lessons")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.warn("Failed to load user_progress:", error.message);
      }

      const serverState: ProgressState | null = data
        ? {
            xp: data.xp ?? 0,
            streak: data.streak ?? 0,
            lastActivityDate: data.last_activity_date
              ? new Date(data.last_activity_date).toDateString()
              : null,
            completedLessons: (data.completed_lessons ?? []) as string[],
          }
        : null;

      const guest = safeParse<ProgressState>(window.localStorage.getItem(LS_KEY));

      if (!serverState) {
        // No row yet. We'll upsert whatever we have locally.
        if (guest && !hasMigratedGuestRef.current) {
          hasMigratedGuestRef.current = true;
        }
      } else {
        // Prefer server, but merge guest into it once.
        if (guest && !hasMigratedGuestRef.current) {
          hasMigratedGuestRef.current = true;
          const merged = mergeProgress(serverState, guest);
          suppressNextPersistRef.current = true;
          setState(merged);
          // persist immediately (not debounced) to ensure migration is saved
          await supabase
            .from("user_progress")
            .upsert(
              {
                user_id: userId,
                xp: merged.xp,
                streak: merged.streak,
                last_activity_date: merged.lastActivityDate
                  ? new Date(merged.lastActivityDate).toISOString().slice(0, 10)
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
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, userId]);

  // Persist: Supabase if authed, else localStorage. Debounced 500ms.
  useEffect(() => {
    if (!ready) return;

    if (suppressNextPersistRef.current) {
      suppressNextPersistRef.current = false;
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      if (userId) {
        const { error } = await supabase
          .from("user_progress")
          .upsert(
            {
              user_id: userId,
              xp: state.xp,
              streak: state.streak,
              last_activity_date: state.lastActivityDate
                ? new Date(state.lastActivityDate).toISOString().slice(0, 10)
                : null,
              completed_lessons: state.completedLessons,
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
      xp: prev.xp + amount,
    }));
  };

  const completeLesson = (id: string) => {
    setState((prev) => ({
      ...prev,
      completedLessons: prev.completedLessons.includes(id)
        ? prev.completedLessons
        : [...prev.completedLessons, id],
    }));
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    setState((prev) => {
      const lastActive = prev.lastActivityDate;
      let streak = prev.streak;

      if (!lastActive) {
        streak = 0;
      } else if (lastActive !== today) {
        const lastDate = new Date(lastActive);
        const currentDate = new Date(today);
        const diffDays = Math.floor(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) streak += 1;
        else if (diffDays > 1) streak = 0;
      }

      return {
        ...prev,
        streak,
        lastActivityDate: today,
      };
    });
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
    xp: state.xp,
    streak: state.streak,
    completedLessons,
    addXP,
    completeLesson,
    updateStreak,
    resetProgress,
  };
}

