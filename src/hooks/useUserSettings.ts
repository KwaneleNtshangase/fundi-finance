"use client";

/**
 * useUserSettings
 *
 * Syncs user preferences (sound, dark mode, daily XP goal, saved calculator)
 * to the Supabase `user_settings` table so they follow the user across devices.
 *
 * Strategy: localStorage is kept as a write-through cache for instant reads on
 * first render.  Supabase is the source of truth — on login its values win.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ── Types ──────────────────────────────────────────────────────────────────────

export type CalcSaved = Record<string, unknown>;

export type UserSettings = {
  soundEnabled: boolean;
  /** null = follow OS preference */
  darkMode: boolean | null;
  dailyGoal: number;
  calcSaved: CalcSaved | null;
};

const DEFAULT: UserSettings = {
  soundEnabled: true,
  darkMode: null,
  dailyGoal: 50,
  calcSaved: null,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function readLocalSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT;
  const soundRaw = localStorage.getItem("fundi-sound-enabled");
  const darkRaw = localStorage.getItem("fundi-dark-mode");
  const goalRaw = localStorage.getItem("fundi-daily-goal");
  const calcRaw = localStorage.getItem("fundi-calc-saved");

  let darkMode: boolean | null = null;
  if (darkRaw === "true") darkMode = true;
  else if (darkRaw === "false") darkMode = false;

  let calcSaved: CalcSaved | null = null;
  try {
    if (calcRaw) calcSaved = JSON.parse(calcRaw) as CalcSaved;
  } catch { /* ignore */ }

  return {
    soundEnabled: soundRaw !== "false",
    darkMode,
    dailyGoal: goalRaw ? (parseInt(goalRaw, 10) || 50) : 50,
    calcSaved,
  };
}

function writeLocalSettings(s: UserSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("fundi-sound-enabled", String(s.soundEnabled));
  if (s.darkMode !== null) {
    localStorage.setItem("fundi-dark-mode", String(s.darkMode));
  } else {
    localStorage.removeItem("fundi-dark-mode");
  }
  localStorage.setItem("fundi-daily-goal", String(s.dailyGoal));
  if (s.calcSaved !== null) {
    localStorage.setItem("fundi-calc-saved", JSON.stringify(s.calcSaved));
  } else {
    localStorage.removeItem("fundi-calc-saved");
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useUserSettings(userId: string | null) {
  const [settings, setSettings] = useState<UserSettings>(readLocalSettings);
  const [loaded, setLoaded] = useState(false);

  // ── Load from Supabase when userId becomes available ──────────────────────
  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;

    supabase
      .from("user_settings")
      .select("sound_enabled, dark_mode, daily_goal, calc_saved")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          const remote: UserSettings = {
            soundEnabled: data.sound_enabled ?? true,
            darkMode: data.dark_mode ?? null,
            dailyGoal: data.daily_goal ?? 50,
            calcSaved: data.calc_saved ?? null,
          };
          setSettings(remote);
          writeLocalSettings(remote);
        }
        setLoaded(true);
      }, () => {
        if (!cancelled) setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persist = useCallback(
    async (patch: Partial<UserSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        writeLocalSettings(next);
        if (userId) {
          void supabase.from("user_settings").upsert(
            {
              user_id: userId,
              sound_enabled: next.soundEnabled,
              dark_mode: next.darkMode,
              daily_goal: next.dailyGoal,
              calc_saved: next.calcSaved,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        }
        return next;
      });
    },
    [userId]
  );

  // ── Granular setters ───────────────────────────────────────────────────────
  const setSoundEnabled = useCallback((v: boolean) => persist({ soundEnabled: v }), [persist]);
  const setDarkMode = useCallback((v: boolean | null) => persist({ darkMode: v }), [persist]);
  const setDailyGoal = useCallback((v: number) => persist({ dailyGoal: v }), [persist]);
  const setCalcSaved = useCallback((v: CalcSaved | null) => persist({ calcSaved: v }), [persist]);

  return {
    settings,
    loaded,
    setSoundEnabled,
    setDarkMode,
    setDailyGoal,
    setCalcSaved,
  } as const;
}
