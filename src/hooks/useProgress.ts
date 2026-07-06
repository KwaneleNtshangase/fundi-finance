"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { sastOffset, sastWeekKey } from "@/lib/dates";

type ProgressState = {
  xp: number;
  /**
   * Lifetime XP spent (streak freezes, etc.). `xp` above is the spendable
   * balance; lifetime earned = xp + xpSpent. Tracked so cross-device merges
   * keep a purchase authoritative without "highest xp wins" refunding it.
   */
  xpSpent: number;
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
  xpSpent: 0,
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
// Supabase remains the source of truth - cache is overwritten on every
// successful Supabase read; it only fills the gap while waiting for network.
const PROGRESS_CACHE_KEY = "fundi-progress-v1";

function progressCacheKey(userId: string): string {
  return `${PROGRESS_CACHE_KEY}-${userId}`;
}

function readProgressCache(userId: string | null): ProgressState | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(progressCacheKey(userId));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<ProgressState>;
    return {
      xp: Number(p.xp ?? 0),
      xpSpent: Number(p.xpSpent ?? 0),
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

function writeProgressCache(s: ProgressState, userId: string | null): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(progressCacheKey(userId), JSON.stringify(s));
  } catch { /* ignore quota errors - cache is best-effort */ }
}

function getCurrentWeekKey(): string {
  return sastWeekKey();
}

// ── Pending XP delta queue ──────────────────────────────────────────────────────
// XP is now an additive server-side ledger (xp = xp + delta) so every gain
// across every device counts. Deltas are NOT idempotent, so an earn whose
// network write fails must not be silently lost OR blindly retried in a way
// that loses it. We durably queue unsynced deltas in localStorage and flush
// the accumulated total exactly once per successful round-trip.
type PendingXp = { delta: number; weeklyDelta: number; weekKey: string };

function pendingXpKey(userId: string): string {
  return `fundi-pending-xp-${userId}`;
}

function readPendingXp(userId: string | null): PendingXp | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(pendingXpKey(userId));
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PendingXp>;
    const delta = Number(p.delta ?? 0);
    if (!delta) return null;
    return { delta, weeklyDelta: Number(p.weeklyDelta ?? 0), weekKey: p.weekKey ?? getCurrentWeekKey() };
  } catch {
    return null;
  }
}

function enqueuePendingXp(userId: string | null, delta: number, weeklyDelta: number, weekKey: string): void {
  if (typeof window === "undefined" || !userId || !delta) return;
  try {
    const cur = readPendingXp(userId);
    const next: PendingXp = cur && cur.weekKey === weekKey
      ? { delta: cur.delta + delta, weeklyDelta: cur.weeklyDelta + weeklyDelta, weekKey }
      // Week rolled over while a delta was still queued: keep accumulating the
      // lifetime delta, but track weekly against the most recent week.
      : { delta: (cur?.delta ?? 0) + delta, weeklyDelta, weekKey };
    localStorage.setItem(pendingXpKey(userId), JSON.stringify(next));
  } catch { /* best-effort */ }
}

function clearPendingXp(userId: string | null): void {
  if (typeof window === "undefined" || !userId) return;
  try { localStorage.removeItem(pendingXpKey(userId)); } catch { /* ignore */ }
}

type ProgressRow = {
  xp?: number; xp_spent?: number; completed_lessons?: string[];
  weekly_xp?: number; week_key?: string; longest_streak?: number; streak?: number;
};

// Flush the queued XP delta to the server. The queue is CLAIMED (read + cleared
// synchronously) before the network call, so two rapid earns can't both send the
// same accumulated total and double-count. If the write fails, the claimed delta
// is re-queued (merged with anything queued meanwhile) for the next attempt.
// JS is single-threaded, so read-then-clear is atomic with respect to other earns.
async function flushPendingXp(userId: string): Promise<ProgressRow | null> {
  const claimed = readPendingXp(userId);
  if (!claimed) return null;
  clearPendingXp(userId);
  const { data, error } = await supabase.rpc("apply_progress_delta", {
    p_user_id: userId,
    p_xp_delta: claimed.delta,
    p_weekly_delta: claimed.weeklyDelta,
    p_week_key: claimed.weekKey,
    p_completed_lessons: null,
    p_longest_streak: null,
  });
  if (error) {
    enqueuePendingXp(userId, claimed.delta, claimed.weeklyDelta, claimed.weekKey);
    return null;
  }
  return (data as ProgressRow) ?? null;
}

async function streakSyncAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function useProgress() {
  // Seed from cache immediately (shows last-known XP/streak before Supabase responds)
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
      // 1. Flush any XP earned offline (durable queue) BEFORE reading, so the
      //    row we read already includes it. Idempotent: cleared on success only.
      await flushPendingXp(userId).catch(() => null);

      // 2. Union any lessons saved locally but not yet in the DB (failed writes,
      //    or completed on this device while offline). apply_progress_delta only
      //    ever adds to the set, so this can heal but never shrink the DB.
      const cachePre = readProgressCache(userId);
      let rpcData: any = null;
      if (cachePre && cachePre.completedLessons.length > 0) {
        const { data, error } = await supabase.rpc("apply_progress_delta", {
          p_user_id: userId,
          p_xp_delta: 0,
          p_weekly_delta: 0,
          p_week_key: null,
          p_completed_lessons: cachePre.completedLessons,
          p_longest_streak: cachePre.longestStreak,
        });
        if (!error && data) {
          rpcData = data;
        }
      }

      // 3. Read the now-reconciled authoritative row. The DB is the source of
      //    truth for XP, weekly XP, and lessons - no client snapshot overwrites.
      //    If the RPC succeeded, it returned the latest row, saving us a SELECT.
      let data = rpcData;
      if (!data) {
        const { data: selectData } = await supabase
          .from("user_progress")
          .select("xp,xp_spent,streak,longest_streak,last_activity_date,completed_lessons,streak_freeze_count,weekly_xp,week_key")
          .eq("user_id", userId)
          .maybeSingle();
        data = selectData;
      }
      
      const wk = getCurrentWeekKey();

      // Defensive merge: never let completedLessons shrink locally to prevent UI regression
      // from read-replica lag or dropped network requests.
      const dbLessons = (data?.completed_lessons ?? []) as string[];
      const localLessons = cachePre?.completedLessons ?? [];
      const mergedLessons = Array.from(new Set([...localLessons, ...dbLessons]));

      const fresh: ProgressState = {
        xp: Math.max(0, Number(data?.xp ?? 0)),
        xpSpent: Math.max(0, Number(data?.xp_spent ?? 0)),
        streak: data?.streak ?? 0,
        longestStreak: Math.max(Number(data?.longest_streak ?? 0), Number(data?.streak ?? 0)),
        lastActivityDate: data?.last_activity_date ? String(data.last_activity_date) : null,
        completedLessons: mergedLessons,
        freezeCount: Math.max(0, Number(data?.streak_freeze_count ?? 0)),
        weeklyXp: data?.week_key === wk ? Math.max(0, Number(data?.weekly_xp ?? 0)) : 0,
        weekKey: wk,
      };
      
      // Strict date-diff evaluate on load. If the user missed >1 days and had freezes,
      // consume them now. If not enough freezes, reset streak locally so the UI updates immediately.
      const { evaluateStreak } = await import("@/lib/dates");
      const effective = evaluateStreak(fresh.streak, fresh.freezeCount, fresh.lastActivityDate);
      
      const finalState: ProgressState = {
        ...fresh,
        streak: effective.streak,
        freezeCount: effective.freezeCount,
        lastActivityDate: effective.lastActivityDate,
      };

      setState(finalState);
      // Update the offline-first cache so next load is instant even without network
      writeProgressCache(finalState, userId);
      
      if (effective.streak !== fresh.streak || effective.freezeCount !== fresh.freezeCount) {
        void supabase.from("user_progress").update({
          streak: effective.streak,
          streak_freeze_count: effective.freezeCount,
          last_activity_date: effective.lastActivityDate
        }).eq("user_id", userId);
      }

      // Retry streak sync after a lesson completed while offline / network failed
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("fundi-pending-streak-sync") === "1"
      ) {
        localStorage.removeItem("fundi-pending-streak-sync");
        try {
          const r = await fetch("/api/progress/sync-streak", {
            method: "POST",
            headers: await streakSyncAuthHeaders(),
            body: JSON.stringify({ userId }),
          });
          const json = await r.json();
          if (json?.ok) {
            setState((prev) => {
              const next = {
                ...prev,
                streak: json.streak,
                longestStreak: Math.max(json.longestStreak ?? json.streak, prev.longestStreak),
                lastActivityDate: json.lastActivityDate,
                freezeCount: json.freezeCount ?? prev.freezeCount,
              };
              writeProgressCache(next, userId);
              return next;
            });
          } else {
            localStorage.setItem("fundi-pending-streak-sync", "1");
          }
        } catch {
          localStorage.setItem("fundi-pending-streak-sync", "1");
        }
      }
    })().catch((e) => console.warn("load progress failed", e));
  }, [userId]);

  // Hydrate from per-user cache immediately when userId is known (before Supabase responds)
  useEffect(() => {
    if (!userId) {
      setState(DEFAULT_STATE);
      return;
    }
    const cached = readProgressCache(userId);
    if (cached) setState(cached);
  }, [userId]);

  const addXP = (amount: number) => {
    if (!amount) return;
    const wk = getCurrentWeekKey();
    // Optimistic local update - pure updater, no side effects (safe if React
    // double-invokes it under StrictMode). The network write is fired ONCE
    // below, outside the updater, so a delta is never double-counted.
    setState((prev) => {
      const newXp = Math.max(0, prev.xp + amount);
      const newWeeklyXp = prev.weekKey === wk ? prev.weeklyXp + amount : amount;
      const next = { ...prev, xp: newXp, weeklyXp: newWeeklyXp, weekKey: wk };
      writeProgressCache(next, userId);
      return next;
    });
    if (!userId) return;
    // Additive ledger on the server (xp = xp + delta): every gain across every
    // device accumulates, including repeating a lesson on several devices. The
    // durable queue means a gain whose write fails is retried, not lost. Other
    // devices' gains are picked up on the next load (which reads the DB total).
    enqueuePendingXp(userId, amount, amount, wk);
    void flushPendingXp(userId);
  };

  const tryDeductXp = (amount: number): boolean => {
    if (state.xp < amount) return false;
    const nextXp = Math.max(0, state.xp - amount);
    // Optimistic local update so the UI is instant. Also bump xpSpent so
    // earned (= xp + xpSpent) stays constant - this is what stops a later
    // cross-device merge from refunding the spend.
    setState((prev) => {
      const next = { ...prev, xp: nextXp, xpSpent: prev.xpSpent + amount };
      writeProgressCache(next, userId);
      return next;
    });
    // Authoritative atomic spend on the server. Reconcile from the result;
    // roll back the optimistic change if the server rejects it (e.g. another
    // device already spent the balance, or the row doesn't exist yet).
    if (userId) {
      void (async () => {
        const { data, error } = await supabase.rpc("spend_xp", {
          p_user_id: userId,
          p_amount: amount,
        });
        const res = data as { ok?: boolean; balance?: number; spent?: number } | null;
        if (error || !res?.ok) {
          setState((prev) => {
            const next = {
              ...prev,
              xp: prev.xp + amount,
              xpSpent: Math.max(0, prev.xpSpent - amount),
            };
            writeProgressCache(next, userId);
            return next;
          });
          return;
        }
        setState((prev) => {
          const next = {
            ...prev,
            xp: typeof res.balance === "number" ? res.balance : prev.xp,
            xpSpent: typeof res.spent === "number" ? res.spent : prev.xpSpent,
          };
          writeProgressCache(next, userId);
          return next;
        });
      })();
    }
    return true;
  };

  const completeLesson = (id: string) => {
    setState((prev) => {
      const nextLessons = prev.completedLessons.includes(id) ? prev.completedLessons : [...prev.completedLessons, id];
      const next = { ...prev, completedLessons: nextLessons };
      writeProgressCache(next, userId);
      // Server-side UNION via apply_progress_delta. This is the core cross-device
      // fix: instead of overwriting completed_lessons with this device's array
      // (which dropped lessons completed on another device), the DB unions them
      // so the set only ever grows. xp_delta 0 leaves XP untouched. Union is
      // idempotent, so this is safe even if the updater is re-invoked. Creates
      // the row if it doesn't exist yet.
      if (userId) {
        void supabase.rpc("apply_progress_delta", {
          p_user_id: userId,
          p_xp_delta: 0,
          p_weekly_delta: 0,
          p_week_key: null,
          p_completed_lessons: nextLessons,
          p_longest_streak: null,
        });
      }
      return next;
    });
  };

  const applyStreakAfterLesson = async (): Promise<number> => {
    if (!userId) return state.streak;
    try {
      const r = await fetch("/api/progress/sync-streak", {
        method: "POST",
        headers: await streakSyncAuthHeaders(),
        body: JSON.stringify({ userId }),
      });
      const json = await r.json();
      if (!json?.ok) {
        console.warn("[applyStreakAfterLesson] sync-streak failed:", json?.error);
        if (typeof window !== "undefined") {
          localStorage.setItem("fundi-pending-streak-sync", "1");
        }
        return state.streak;
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("fundi-pending-streak-sync");
      }
      setState((prev) => {
        const next = {
          ...prev,
          streak: json.streak,
          longestStreak: Math.max(json.longestStreak ?? json.streak, prev.longestStreak),
          lastActivityDate: json.lastActivityDate,
        };
        writeProgressCache(next, userId);
        return next;
      });
      return json.streak as number;
    } catch (e) {
      console.warn("[applyStreakAfterLesson] fetch failed:", e);
      if (typeof window !== "undefined") {
        localStorage.setItem("fundi-pending-streak-sync", "1");
      }
      return state.streak;
    }
  };

  const MAX_FREEZE_COUNT = 2;

  const buyStreakFreeze = (cost = 200): boolean => {
    if (state.freezeCount >= MAX_FREEZE_COUNT) return false;
    if (!tryDeductXp(cost)) return false;
    let nextFreeze = 0;
    setState((prev) => {
      if (prev.freezeCount >= MAX_FREEZE_COUNT) return prev;
      nextFreeze = prev.freezeCount + 1;
      const next = { ...prev, freezeCount: nextFreeze };
      writeProgressCache(next, userId);
      return next;
    });
    if (nextFreeze === 0) return false;
    if (userId) {
      void supabase
        .from("user_progress")
        .update({ streak_freeze_count: nextFreeze, updated_at: new Date().toISOString() })
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
      const yDate = sastOffset(-1);
      setState((prev) => {
        const next = {
          ...prev,
          freezeCount: result.freezes_left ?? Math.max(0, prev.freezeCount - 1),
          lastActivityDate: yDate,
        };
        writeProgressCache(next, userId);
        return next;
      });
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
        xp_spent: 0,
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
