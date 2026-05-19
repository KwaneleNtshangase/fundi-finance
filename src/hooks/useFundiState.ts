"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { analytics } from "@/lib/analytics";
import { sastToday, sastSundayDate, sastWeekKey } from "@/lib/dates";
import { CONTENT_DATA } from "@/data/content";
import { useProgress } from "@/hooks/useProgress";
import { useUserSettings } from "@/hooks/useUserSettings";
import type { LessonStep } from "@/data/content";
import {
  UserData,
  Route,
  WeeklyProgressJSON,
  EMPTY_WEEKLY_PROGRESS,
  parseWeeklyChallengeStorage,
  progressNumberFromWeeklyState,
} from "@/app/pageViews.types";

export function useFundiState() {
  const progress = useProgress();
  // ── User settings (sound, dark mode, daily goal, calc saved) ─────────────
  // Synced to Supabase user_settings for cross-device persistence.
  const userSettings = useUserSettings(progress.userId);

  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    if (typeof window === "undefined") return 50;
    return parseInt(window.localStorage.getItem("fundi-daily-goal") ?? "50", 10);
  });
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" } as Route;
    const onboarded = localStorage.getItem("fundi-onboarded");
    if (!onboarded) return { name: "onboarding" } as Route;
    const saved = localStorage.getItem("fundi-last-route");
    const simpleRoutes = ["learn", "quests", "calculator", "profile", "leaderboard", "settings", "budget"];
    if (saved && simpleRoutes.includes(saved)) return { name: saved } as Route;
    return { name: "learn" } as Route;
  });
  // ── Hearts ────────────────────────────────────────────────────────────
  const MAX_HEARTS = 5;
  const HEART_REGEN_MS = 60 * 60 * 1000; // 1 hour
  const [hearts, setHearts] = useState<number>(() => {
    if (typeof window === "undefined") return MAX_HEARTS;
    const storedRaw = localStorage.getItem("fundi-hearts");
    const lastLostRaw = localStorage.getItem("fundi-last-heart-lost");
    if (storedRaw === null) return MAX_HEARTS;
    let current = parseInt(storedRaw, 10);
    if (Number.isNaN(current)) current = MAX_HEARTS;
    if (lastLostRaw) {
      const lastLost = parseInt(lastLostRaw, 10);
      if (!Number.isNaN(lastLost) && current < MAX_HEARTS) {
        const elapsed = Date.now() - lastLost;
        const regained = Math.floor(elapsed / HEART_REGEN_MS);
        if (regained > 0) {
          current = Math.min(MAX_HEARTS, current + regained);
          localStorage.setItem("fundi-hearts", String(current));
          const newLast = lastLost + regained * HEART_REGEN_MS;
          if (current >= MAX_HEARTS) {
            localStorage.removeItem("fundi-last-heart-lost");
          } else {
            localStorage.setItem("fundi-last-heart-lost", String(newLast));
          }
        }
      }
    }
    return current;
  });
  const [lastHeartLostAt, setLastHeartLostAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("fundi-last-heart-lost");
    return v ? parseInt(v, 10) : null;
  });
  const [showNoHearts, setShowNoHearts] = useState(false);
  const syncHeartsToSupabase = React.useCallback(
    async (nextHearts: number) => {
      if (!progress.userId) return;
      await supabase
        .from("user_progress")
        .update({ hearts: Math.max(0, Math.min(MAX_HEARTS, nextHearts)) })
        .eq("user_id", progress.userId);
    },
    [progress.userId]
  );

  // Persist hearts to localStorage (local cache) + Supabase
  useEffect(() => {
    localStorage.setItem("fundi-hearts", String(hearts));
  }, [hearts]);
  useEffect(() => {
    if (lastHeartLostAt !== null) {
      localStorage.setItem("fundi-last-heart-lost", String(lastHeartLostAt));
      // Sync to Supabase so cross-device heart regen is accurate
      if (progress.userId) {
        void supabase
          .from("user_progress")
          .update({ last_heart_lost_at: lastHeartLostAt })
          .eq("user_id", progress.userId);
      }
    }
  }, [lastHeartLostAt, progress.userId]);

  useEffect(() => {
    if (!progress.userId) return;
    void (async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("hearts, last_heart_lost_at")
        .eq("user_id", progress.userId)
        .maybeSingle();
      const HEARTS_CAP = MAX_HEARTS;
      const heartsWithRegen = (count: number, lastLostMs: number | null): number => {
        const base = Math.max(0, Math.min(HEARTS_CAP, count));
        if (base >= HEARTS_CAP || !lastLostMs) return base;
        const regained = Math.floor((Date.now() - lastLostMs) / HEART_REGEN_MS);
        return Math.min(HEARTS_CAP, base + regained);
      };

      const localHeartsRaw = parseInt(localStorage.getItem("fundi-hearts") ?? String(HEARTS_CAP), 10);
      const localHearts = Number.isNaN(localHeartsRaw) ? HEARTS_CAP : localHeartsRaw;
      const localLastLostRaw = localStorage.getItem("fundi-last-heart-lost");
      const localLastLost = localLastLostRaw ? parseInt(localLastLostRaw, 10) : null;

      const remoteHeartsRaw = Number((data as any)?.hearts);
      const remoteHearts = Number.isFinite(remoteHeartsRaw) ? remoteHeartsRaw : HEARTS_CAP;
      const remoteLastLost = (data as any)?.last_heart_lost_at as number | null | undefined;

      const localEffective = heartsWithRegen(localHearts, localLastLost);
      const remoteEffective = heartsWithRegen(remoteHearts, remoteLastLost ?? null);
      const mergedHearts = Math.max(localEffective, remoteEffective);

      setHearts(mergedHearts);
      localStorage.setItem("fundi-hearts", String(mergedHearts));

      let mergedLastLost: number | null = null;
      if (mergedHearts >= HEARTS_CAP) {
        localStorage.removeItem("fundi-last-heart-lost");
        setLastHeartLostAt(null);
      } else {
        mergedLastLost =
          localLastLost && remoteLastLost
            ? Math.min(localLastLost, remoteLastLost)
            : localLastLost ?? remoteLastLost ?? null;
        if (mergedLastLost) {
          localStorage.setItem("fundi-last-heart-lost", String(mergedLastLost));
          setLastHeartLostAt(mergedLastLost);
        }
      }

      const remoteLastLostNorm = remoteLastLost ?? null;
      if (mergedHearts !== remoteEffective || mergedLastLost !== remoteLastLostNorm) {
        await supabase
          .from("user_progress")
          .update({
            hearts: mergedHearts,
            last_heart_lost_at: mergedLastLost,
          })
          .eq("user_id", progress.userId);
      }
    })().catch(() => {});
  }, [progress.userId]);

  // Auto-regen: 1 heart per hour
  useEffect(() => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastHeartLostAt;
      const toAdd = Math.floor(elapsed / HEART_REGEN_MS);
      if (toAdd > 0) {
        setHearts((h) => {
          const next = Math.min(h + toAdd, MAX_HEARTS);
          if (next !== h) {
            void syncHeartsToSupabase(next);
          }
          if (next >= MAX_HEARTS) {
            localStorage.removeItem("fundi-last-heart-lost");
            setLastHeartLostAt(null);
          } else {
            setLastHeartLostAt(Date.now() - (elapsed % HEART_REGEN_MS));
          }
          return next;
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [hearts, lastHeartLostAt, syncHeartsToSupabase]);

  const loseHeart = () => {
    setHearts((h) => {
      if (h <= 0) return h;
      const next = h - 1;
      localStorage.setItem("fundi-hearts", String(next));
      localStorage.setItem("fundi-last-heart-lost", String(Date.now()));
      void syncHeartsToSupabase(next);
      if (next === 0) {
        queueMicrotask(() => setShowNoHearts(true));
      }
      return next;
    });
    setLastHeartLostAt(Date.now());
  };

  const gainHeart = () => {
    setHearts((h) => {
      const next = Math.min(h + 1, MAX_HEARTS);
      if (next !== h) {
        void syncHeartsToSupabase(next);
      }
      return next;
    });
  };

  const heartsRegenInfo = (): { nextHeartIn: string; minutesLeft: number } | null => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return null;
    const elapsed = Date.now() - lastHeartLostAt;
    const remaining = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
    const minutes = Math.ceil(remaining / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { nextHeartIn: h > 0 ? `${h}h ${m}m` : `${m}m`, minutesLeft: minutes };
  };
  // ── End Hearts ─────────────────────────────────────────────────────────────

  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);

  // ── Weekly challenge ─────────────────────────────────────────────────────
  const WEEKLY_CHALLENGES = [
    { id: "wc-7lessons",         text: "Complete 7 lessons this week",                         target: 7,   unit: "lessons",          xp: 250 },
    { id: "wc-5streak",          text: "Maintain your streak for 5 days",                       target: 5,   unit: "streak_days",       xp: 200 },
    { id: "wc-perfect",          text: "Get a perfect score on 5 lessons",                      target: 5,   unit: "perfect",           xp: 350 },
    { id: "wc-200xp",            text: "Earn 200 XP in a single day",                           target: 200, unit: "daily_xp",          xp: 280 },
    { id: "wc-5lessons-perfect", text: "Complete 5 lessons with at least 80% score",            target: 5,   unit: "lessons",           xp: 300 },
    // Behavior-linked challenges — connect to real money actions, not just lesson counts
    { id: "wc-budget-3days",     text: "Open the Budget Planner 3 days this week",              target: 3,   unit: "budget_days",       xp: 200 },
    { id: "wc-calculator-2",     text: "Use the Investment Calculator twice this week",          target: 2,   unit: "calculator_days",   xp: 175 },
    { id: "wc-advanced-lesson",  text: "Complete a lesson in any Advanced course",              target: 1,   unit: "advanced_lesson",   xp: 300 },
  ];
  // Returns "YYYY-MM-DD" of the most recent Sunday (week anchor) in SAST
  const getSundayKey = () => sastSundayDate();
  const getWeeklyChallenge = () => {
    // Use the Sunday date string as a stable, deterministic seed — resets only on Sunday
    const weekKey = getSundayKey();
    let seed = 0;
    for (let i = 0; i < weekKey.length; i++) seed = ((seed << 5) - seed + weekKey.charCodeAt(i)) | 0;
    seed = Math.abs(seed);
    const idx = seed % WEEKLY_CHALLENGES.length;
    return { ...WEEKLY_CHALLENGES[idx], weekKey };
  };
  const weeklyChallenge = getWeeklyChallenge();
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressJSON>(
    EMPTY_WEEKLY_PROGRESS
  );
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [challengeRewardClaimed, setChallengeRewardClaimed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const wc = weeklyChallenge;
    const raw = localStorage.getItem(`fundi-wc-${wc.weekKey}-${wc.id}`);
    const parsed = parseWeeklyChallengeStorage(raw) ?? EMPTY_WEEKLY_PROGRESS;
    setWeeklyProgress(parsed);
    const n = progressNumberFromWeeklyState(wc, parsed, progress.streak);
    const isClaimed =
      localStorage.getItem(`fundi-wc-claimed-${wc.weekKey}-${wc.id}`) === "true";
    // If the reward was already claimed, always show the full bar (target reached).
    // Without this, a stale dailyXp in localStorage causes the bar to show < target.
    setChallengeProgress(isClaimed ? wc.target : Math.min(n, wc.target));
    setChallengeRewardClaimed(isClaimed);
  }, [weeklyChallenge.id, weeklyChallenge.unit, weeklyChallenge.target, progress.streak, progress.ready, dailyXP]);

  const challengeComplete =
    weeklyProgress.completed || challengeProgress >= weeklyChallenge.target;
  // ── End weekly challenge ──────────────────────────────────────────────────

  // consumeStreakFreeze removed, handled via localStorage directly

  const [reviewAnswers, setReviewAnswers] = useState<{
    question: string; yourAnswer: string; correct: string; wasCorrect: boolean;
  }[] | null>(null);
  const [lessonSummary, setLessonSummary] = useState<{
    xpEarned: number;
    timeSeconds: number;
    accuracy: number;
    streak: number;
    isPerfect: boolean;
    choice: "next" | "course";
    nextLessonId: string | null;
    courseId: string;
    lessonId: string | null;
  } | null>(null);
  const [xpToast, setXpToast] = useState<{ amount: number; id: number } | null>(null);

  const [currentLessonState, setCurrentLessonState] = useState<{
    courseId: string | null;
    lessonId: string | null;
    stepIndex: number;
    steps: LessonStep[];
    answers: Record<number, unknown>;
    correctCount: number;
  }>({
    courseId: null,
    lessonId: null,
    stepIndex: 0,
    steps: [],
    answers: {},
    correctCount: 0,
  });

  // ── Sync daily goal from Supabase when settings load ─────────────────────
  useEffect(() => {
    if (userSettings.loaded) {
      setDailyGoal(userSettings.settings.dailyGoal);
    }
  }, [userSettings.loaded, userSettings.settings.dailyGoal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncDailyXpFromStorage = () => {
      const today = sastToday();
      const key = `fundi-daily-xp-${today}`;
      const val = parseInt(localStorage.getItem(key) ?? "0", 10);
      setDailyXP(Number.isNaN(val) ? 0 : val);
    };
    syncDailyXpFromStorage();
    const onFocus = () => syncDailyXpFromStorage();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("fundi-daily-xp-")) syncDailyXpFromStorage();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const addXP = (amount: number) => {
    progress.addXP(amount);
    if (typeof window !== "undefined") {
      const today = sastToday();
      const key = `fundi-daily-xp-${today}`;
      const prev = parseInt(localStorage.getItem(key) ?? "0", 10);
      const next = (Number.isNaN(prev) ? 0 : prev) + amount;
      localStorage.setItem(key, String(next));
      setDailyXP(next);
    } else {
      setDailyXP((v) => v + amount);
    }
    setXpToast({ amount, id: Date.now() });
    setTimeout(() => setXpToast(null), 2000);
  };

  const completeLesson = async (
    courseId: string,
    lessonId: string,
    xpEarned: number
  ): Promise<number> => {
    const lessonKey = `${courseId}:${lessonId}`;
    const alreadyDone = progress.completedLessons.has(lessonKey);
    if (!alreadyDone) {
      progress.completeLesson(lessonKey);
    }
    const newStreak = alreadyDone
      ? progress.streak
      : await progress.applyStreakAfterLesson();
    if (!alreadyDone) {
      analytics.streakUpdated(newStreak);
      addXP(xpEarned);
      if (progress.userId) {
        void supabase
          .from("user_progress")
          .update({ last_lesson_at: new Date().toISOString() })
          .eq("user_id", progress.userId);
      }
    }
    return newStreak;
  };

  const isLessonCompleted = (courseId: string, lessonId: string) =>
    progress.completedLessons.has(`${courseId}:${lessonId}`);

  const startLesson = (courseId: string, lessonId: string) => {
    const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
    if (!course) return;
    let found: import("@/data/content").Lesson | undefined;
    for (const unit of course.units) {
      const lesson = unit.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        found = lesson;
        break;
      }
    }
    if (!found || !found.steps || found.steps.length === 0) return;
    setCurrentLessonState({
      courseId,
      lessonId,
      stepIndex: 0,
      steps: found.steps,
      answers: {},
      correctCount: 0,
    });
    setRoute({ name: "lesson", courseId, lessonId });
  };

  // Persist route so refresh returns to same section
  useEffect(() => {
    const simpleRoutes = ["learn", "quests", "calculator", "profile", "leaderboard", "settings", "budget"];
    if (simpleRoutes.includes(route.name)) {
      localStorage.setItem("fundi-last-route", route.name);
    }
  }, [route.name]);

  // ── Restore profile settings from Supabase when user logs in ─────────────
  // Prevents returning users from seeing onboarding again if localStorage was
  // cleared (new device, cleared cache, etc.)
  useEffect(() => {
    if (!progress.userId) return;
    if (route.name !== "onboarding") return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("goal, goal_description, age_range, username, full_name")
        .eq("user_id", progress.userId!)
        .maybeSingle();
      const hasIdentityName =
        Boolean(profile?.username && String(profile.username).trim()) ||
        Boolean(profile?.full_name && String(profile.full_name).trim());
      if (profile?.goal || hasIdentityName) {
        localStorage.setItem("fundi-onboarded", "true");
        if (profile?.goal) localStorage.setItem("fundi-user-goal", profile.goal);
        if (profile?.goal_description) localStorage.setItem("fundi-goal-description", profile.goal_description);
        if (profile?.age_range) localStorage.setItem("fundi-age-range", profile.age_range);
        // Sync username so the duplicate-username-prompt check skips the DB round-trip
        if (profile?.username) localStorage.setItem("fundi-username", profile.username);
        setRoute({ name: "learn" });
      }
    })().catch(() => {});
  }, [progress.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    userId: progress.userId,
    progressReady: progress.ready,
    hearts,
    maxHearts: MAX_HEARTS,
    loseHeart,
    gainHeart,
    heartsRegenInfo,
    userData: {
      xp: progress.xp,
      level: Math.floor(progress.xp / 500) + 1,
      streak: progress.streak,
      longestStreak: progress.longestStreak,
      totalCompleted: progress.completedLessons.size,
      dailyXP,
      dailyGoal,
      badges: userBadges,
      lessonsToday: parseInt(
        typeof window !== "undefined"
          ? (localStorage.getItem(`fundi-daily-lessons-${sastToday()}`) ?? "0")
          : "0",
        10
      ),
    } satisfies UserData,
    dailyXP,
    dailyGoal,
    setDailyGoal: (g: number) => {
      setDailyGoal(g);
      // Also persist to Supabase via userSettings
      void userSettings.setDailyGoal(g);
    },
    userSettings,
    resetProgress: progress.resetProgress,
    route,
    setRoute,
    isLessonCompleted,
    completedLessons: progress.completedLessons,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
    newlyEarnedBadges,
    setNewlyEarnedBadges,
    xpToast,
    lessonSummary,
    setLessonSummary,
    reviewAnswers,
    setReviewAnswers,
    weeklyChallenge,
    weeklyProgress,
    setWeeklyProgress,
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    setChallengeRewardClaimed,
    claimChallengeReward: () => {
      if (localStorage.getItem(`fundi-wc-claimed-${weeklyChallenge.weekKey}-${weeklyChallenge.id}`) === "true") {
        return;
      }
      if (challengeComplete && !challengeRewardClaimed) {
        // Use the wrapped addXP so the XP toast fires and daily XP counter updates
        addXP(weeklyChallenge.xp);
        // Force the bar to 100% so it renders complete after manual claim
        setChallengeProgress(weeklyChallenge.target);
        setChallengeRewardClaimed(true);
        localStorage.setItem(`fundi-wc-claimed-${weeklyChallenge.weekKey}-${weeklyChallenge.id}`, "true");
        void progress.persistWeeklyChallengeCompletion(weeklyChallenge.id, weeklyChallenge.xp);
      }
    },
    tryDeductXp: progress.tryDeductXp,
    persistWeeklyChallengeCompletion: progress.persistWeeklyChallengeCompletion,
    freezeCount: progress.freezeCount,
    buyStreakFreeze: progress.buyStreakFreeze,
    useFreeze: progress.useFreeze,
    weeklyXp: progress.weeklyXp,
    addXP,
    setChallengeProgress,
    setDailyXP,
    showNoHearts,
    setShowNoHearts,
    startLesson,
    userBadges,
    setUserBadges,
  };

  return value;
}

export type FundiState = ReturnType<typeof useFundiState>;
