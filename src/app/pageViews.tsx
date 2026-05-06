/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { analytics } from "@/lib/analytics";
import { trackBehaviorEvent, BUDGET_RELATED_COURSE_IDS } from "@/lib/behaviorTracking";
import { CONTENT_DATA } from "@/data/content";
import { DAILY_FACTS_365 } from "@/data/content-extra";
import {
  COURSE_BADGES,
  getInvestorProfile,
  INVESTOR_PROFILE_STYLES,
  INVESTOR_QUIZ_QUESTIONS,
} from "@/data/gamificationExtras";
import { CONCEPTS, getConceptIdsForCourse } from "@/data/concepts";
import {
  applyReview,
  getDueCards,
  saveMastery,
  scheduleConceptsForCourse,
} from "@/lib/spaced-repetition";
import type { MasteryRecord } from "@/lib/spaced-repetition";
import { useProgress } from "@/hooks/useProgress";
import { useUserSettings } from "@/hooks/useUserSettings";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart2,
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  Car,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  Flame,
  GraduationCap,
  Hash,
  Heart,
  HeartOff,
  HelpCircle,
  MessageSquare,
  Home as HomeIcon,
  Info,
  KeyRound,
  Landmark,
  Lightbulb,
  Link2,
  Lock,
  LogOut,
  Mail,
  ChevronLeft,
  ChevronRight,
  Moon,
  MoreHorizontal,
  PenLine,
  PiggyBank,
  Play,
  Plus,
  RefreshCcw,
  ShoppingCart,
  Smartphone,
  Trash2,
  TrendingDown,
  Search,
  Settings as SettingsIcon,
  Share2,
  Shield,
  Siren,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Tv,
  Umbrella,
  User as UserIcon,
  Wallet,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";

import type { Course, Unit, Lesson, LessonStep } from "@/data/content";
import { ProfileView } from "@/components/ProfileView";
import { BudgetView } from "@/components/BudgetPlanner";
import { CalculatorView, CalcInputs, calcGrowth } from "@/components/CalculatorView";
import { LeaderboardView, getLeaderboardWeekKey } from "@/components/LeaderboardView";
import { StatsPanel } from "@/components/StatsPanel";
import { AuthGate } from "@/components/AuthGate";
import { ShareButton, ShareResultButton } from "@/components/ShareCard";
import { FundiCharacter } from "@/components/FundiCharacter";
import { FundiTopBar } from "@/components/FundiTopBar";
import {
  UserData,
  Route,
  WeeklyProgressJSON,
  EMPTY_WEEKLY_PROGRESS,
  parseWeeklyChallengeStorage,
  progressNumberFromWeeklyState,
  normalizeUsername,
  validateUsername,
  isUsernameAvailable,
  getLessonTitle,
  generateShareText,
  ONBOARDING_GOAL_OPTIONS,
  ONBOARDING_AGE_RANGES,
  GOAL_OPTIONS,
  GOAL_COURSE_MAP,
  BUDGET_LESSON_BRIDGE,
  playSound,
  persistUserGoalToStorageAndSupabase,
} from "@/app/pageViews.types";
import { formatWithSpaces, formatRand, formatZAR } from "@/lib/formatters";

function getDailyFact(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_FACTS_365[dayOfYear % DAILY_FACTS_365.length];
}

function OnboardingView({
  onComplete,
}: {
  onComplete: (payload: { goal?: string; ageRange?: string; goalDescription?: string; username: string }) => void;
}) {
  const [screen, setScreen] = React.useState(0);
  const [selectedGoal, setSelectedGoal] = React.useState("");
  const [selectedAgeRange, setSelectedAgeRange] = React.useState("");
  const [goalDescription, setGoalDescription] = React.useState("");
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [usernameError, setUsernameError] = React.useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = React.useState(false);
  const [usernameAvailable, setUsernameAvailable] = React.useState(false);

  React.useEffect(() => {
    if (screen !== 3) return;
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setUsernameError("Username is required.");
      setUsernameAvailable(false);
      return;
    }
    const formatError = validateUsername(normalized);
    if (formatError) {
      setUsernameError(formatError);
      setUsernameAvailable(false);
      return;
    }
    let active = true;
    setUsernameChecking(true);
    const timer = setTimeout(() => {
      isUsernameAvailable(normalized)
        .then((available) => {
          if (!active) return;
          setUsernameAvailable(available);
          setUsernameError(available ? null : "That username is already taken.");
        })
        .finally(() => {
          if (!active) return;
          setUsernameChecking(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [screen, username]);

  const screenCount = 5;
  const screensMeta = [
    {
      title: "Welcome to Fundi Finance",
      body: "Master your money in minutes a day. Short, SA-specific lessons that actually make sense, from budgeting to investing to what the Bible says about money.",
      cta: "Let's go",
      action: () => { if (ageConfirmed) setScreen(1); },
    },
    {
      title: "What's your money goal?",
      body: "We'll personalise tips based on what matters most to you. Optional - skip if you prefer.",
      cta: "Next",
      action: () => {
        if (selectedGoal) setScreen(2);
      },
    },
    {
      title: "Your age range",
      body: "Helps us keep examples relevant. Optional - skip if you prefer.",
      cta: "Next",
      action: () => {
        setScreen(3);
      },
    },
    {
      title: "Choose your leaderboard username",
      body: "This is your public name on the leaderboard. It must be unique.",
      cta: "Next",
      action: () => {
        if (usernameAvailable) setScreen(4);
      },
    },
    {
      title: "How it works",
      body: "Earn XP for every lesson. Build streaks. Unlock badges. Compete on the leaderboard. Every lesson takes less than 3 minutes.",
      cta: "Start learning",
      action: () =>
        onComplete({
          goal: selectedGoal || undefined,
          ageRange: selectedAgeRange || undefined,
          goalDescription: goalDescription.trim() || undefined,
          username: normalizeUsername(username),
        }),
    },
  ];

  const current = screensMeta[screen];

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg)",
        padding: "32px 24px",
      }}
    >
      <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
        {Array.from({ length: screenCount }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === screen ? 20 : 8,
              height: 8,
              borderRadius: 4,
              background: i === screen ? "var(--color-primary)" : "var(--color-border)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>

      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        {screen === 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Flag size={64} strokeWidth={1.5} style={{ color: "var(--color-primary)" }} aria-hidden />
          </div>
        )}
        {screen === 4 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            {[Target, Zap, Trophy].map((IconComp, i) => (
              <div
                key={i}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconComp size={24} style={{ color: "var(--color-primary)" }} />
              </div>
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, color: "var(--color-text-primary)" }}>
          {current.title}
        </h1>
        <p style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 28 }}>
          {current.body}
        </p>

        {/* Age confirmation - screen 0 only */}
        {screen === 0 && (
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24,
            textAlign: "left", cursor: "pointer",
            padding: "14px 16px", borderRadius: 12,
            background: ageConfirmed ? "rgba(0,122,77,0.06)" : "var(--color-surface)",
            border: `1.5px solid ${ageConfirmed ? "var(--color-primary)" : "var(--color-border)"}`,
          }}>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: "var(--color-primary)", width: 18, height: 18, flexShrink: 0, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5, fontWeight: 500 }}>
              I confirm that I am <strong>18 years of age or older</strong>. Fundi Finance is a financial education platform intended for adults.
            </span>
          </label>
        )}

        {screen === 1 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12, textAlign: "left" }}>
              {ONBOARDING_GOAL_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGoal(g.id);
                    if (g.id !== "other") setGoalDescription("");
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    border: `2px solid ${selectedGoal === g.id ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: selectedGoal === g.id ? "rgba(0,122,77,0.08)" : "var(--color-surface)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    color: "var(--color-text-primary)",
                    transition: "all 0.15s",
                  }}
                >
                  <g.Icon size={18} className="shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden />
                  {g.label}
                </button>
              ))}
            </div>
            {selectedGoal === "other" && (
              <textarea
                placeholder="Describe your goal - e.g. save for my child's education"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "2px solid var(--color-primary)",
                  fontSize: 13,
                  resize: "vertical",
                  marginBottom: 12,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
            )}
            {selectedGoal && selectedGoal !== "other" && (
              <textarea
                placeholder="Anything more to say about this goal? (optional)"
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  fontSize: 13,
                  resize: "vertical",
                  marginBottom: 12,
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                }}
              />
            )}
          </>
        )}

        {screen === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, textAlign: "left" }}>
            {ONBOARDING_AGE_RANGES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAgeRange(a.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `2px solid ${selectedAgeRange === a.id ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: selectedAgeRange === a.id ? "rgba(0,122,77,0.08)" : "var(--color-surface)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  color: "var(--color-text-primary)",
                  transition: "all 0.15s",
                }}
              >
                <a.Icon size={18} className="shrink-0" style={{ color: "var(--color-primary)" }} aria-hidden />
                {a.label}
              </button>
            ))}
          </div>
        )}

        {screen === 3 && (
          <div style={{ marginBottom: 16, textAlign: "left" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="e.g. fundi_learner"
              value={username}
              onChange={(e) => setUsername(normalizeUsername(e.target.value))}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `2px solid ${usernameError ? "var(--color-danger)" : usernameAvailable ? "var(--color-primary)" : "var(--color-border)"}`,
                fontSize: 14,
                boxSizing: "border-box",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            />
            <div style={{ minHeight: 20, marginTop: 6, fontSize: 12, color: usernameError ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
              {usernameChecking
                ? "Checking availability..."
                : usernameError
                  ? usernameError
                  : usernameAvailable
                    ? "Username is available."
                    : "3-20 chars: lowercase letters, numbers, underscores."}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700 }}
          onClick={current.action}
          disabled={
            (screen === 0 && !ageConfirmed) ||
            (screen === 1 && (!selectedGoal || (selectedGoal === "other" && !goalDescription.trim()))) ||
            (screen === 3 && (!usernameAvailable || usernameChecking))
          }
        >
          {current.cta}
        </button>

        {screen === 1 && (
          <button
            type="button"
            onClick={() => setScreen(2)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              width: "100%",
            }}
          >
            Skip
          </button>
        )}

        {screen === 2 && (
          <button
            type="button"
            onClick={() => setScreen(3)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 14,
              width: "100%",
            }}
          >
            Skip
          </button>
        )}

        {screen > 0 && (
          <button
            type="button"
            onClick={() => setScreen((s) => s - 1)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

function useFundiState() {
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
      const HEARTS_CAP = 5;
      const localHearts = Math.max(0, Math.min(HEARTS_CAP, parseInt(localStorage.getItem("fundi-hearts") ?? String(HEARTS_CAP), 10) || HEARTS_CAP));
      const remoteHeartsRaw = Number((data as any)?.hearts);
      const remoteHearts = Number.isFinite(remoteHeartsRaw)
        ? Math.max(0, Math.min(HEARTS_CAP, remoteHeartsRaw))
        : HEARTS_CAP;
      const mergedHearts = Math.min(localHearts, remoteHearts);
      setHearts(mergedHearts);
      localStorage.setItem("fundi-hearts", String(mergedHearts));
      // Restore last_heart_lost_at from Supabase if localStorage was wiped (new device)
      const remoteLastLost = (data as any)?.last_heart_lost_at as number | null | undefined;
      if (remoteLastLost && !localStorage.getItem("fundi-last-heart-lost")) {
        localStorage.setItem("fundi-last-heart-lost", String(remoteLastLost));
        setLastHeartLostAt(remoteLastLost);
      }
      if (mergedHearts !== remoteHearts) {
        await supabase
          .from("user_progress")
          .update({ hearts: mergedHearts })
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
          return next;
        });
        setLastHeartLostAt(Date.now() - (elapsed % HEART_REGEN_MS));
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
    { id: "wc-7lessons", text: "Complete 7 lessons this week", target: 7, unit: "lessons", xp: 250 },
    { id: "wc-5streak", text: "Maintain your streak for 5 days", target: 5, unit: "streak_days", xp: 200 },
    { id: "wc-perfect", text: "Get a perfect score on 5 lessons", target: 5, unit: "perfect", xp: 350 },
    { id: "wc-200xp", text: "Earn 200 XP in a single day", target: 200, unit: "daily_xp", xp: 280 },
    { id: "wc-5lessons-perfect", text: "Complete 5 lessons with at least 80% score", target: 5, unit: "lessons", xp: 300 },
  ];
  const getWeeklyChallenge = () => {
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
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
    const raw = localStorage.getItem(`fundi-wc-${wc.id}`);
    const parsed = parseWeeklyChallengeStorage(raw) ?? EMPTY_WEEKLY_PROGRESS;
    setWeeklyProgress(parsed);
    const n = progressNumberFromWeeklyState(wc, parsed, progress.streak);
    setChallengeProgress(Math.min(n, wc.target));
    setChallengeRewardClaimed(
      localStorage.getItem(`fundi-wc-claimed-${wc.id}`) === "true"
    );
  }, [weeklyChallenge.id, weeklyChallenge.unit, weeklyChallenge.target, progress.streak, progress.ready]);

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
      const today = new Date().toISOString().slice(0, 10);
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
      const today = new Date().toISOString().slice(0, 10);
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
    progress.completeLesson(`${courseId}:${lessonId}`);
    const newStreak = await progress.applyStreakAfterLesson();
    analytics.streakUpdated(newStreak);
    addXP(xpEarned);
    // Stamp last_lesson_at so the D+1 retention email cron knows when to fire.
    if (progress.userId) {
      void supabase
        .from("user_progress")
        .update({ last_lesson_at: new Date().toISOString() })
        .eq("user_id", progress.userId);
    }
    return newStreak;
  };

  const isLessonCompleted = (courseId: string, lessonId: string) =>
    progress.completedLessons.has(`${courseId}:${lessonId}`);

  const startLesson = (courseId: string, lessonId: string) => {
    const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
    if (!course) return;
    let found: Lesson | undefined;
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
          ? (localStorage.getItem(`fundi-daily-lessons-${new Date().toISOString().slice(0, 10)}`) ?? "0")
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
    // Add these missing exports below:
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
      if (localStorage.getItem(`fundi-wc-claimed-${weeklyChallenge.id}`) === "true") {
        return;
      }
      if (challengeComplete && !challengeRewardClaimed) {
        progress.addXP(weeklyChallenge.xp);
        setDailyXP((v) => v + weeklyChallenge.xp);
        setChallengeRewardClaimed(true);
        localStorage.setItem(`fundi-wc-claimed-${weeklyChallenge.id}`, "true");
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
  };

  return value;
}

function CourseIcon({ name, size = 48 }: { name: string; size?: number }) {
  const props = { size, className: "text-current" };
  switch (name) {
    case "wallet":
      return <Wallet {...props} />;
    case "briefcase":
      return <Briefcase {...props} />;
    case "building-2":
      return <Building2 {...props} />;
    case "credit-card":
      return <CreditCard {...props} />;
    case "shield":
      return <Shield {...props} />;
    case "umbrella":
      return <Umbrella {...props} />;
    case "trending-up":
      return <TrendingUp {...props} />;
    case "flag":
      return <Flag {...props} />;
    case "home":
      return <HomeIcon {...props} />;
    case "file-text":
      return <FileText {...props} />;
    case "siren":
      return <Siren {...props} />;
    case "brain":
      return <Brain {...props} />;
    case "book-open":
      return <BookOpen {...props} />;
    default:
      return <Wallet {...props} />;
  }
}

// Course accent colours, cycles through SA-themed palette
const COURSE_COLOURS = [
  { bg: "#E8F5EE", accent: "#007A4D", light: "#C8EAD9" }, // green
  { bg: "#FFF8E7", accent: "#FFB612", light: "#FFE9A0" }, // gold
  { bg: "#FFF0EF", accent: "#E03C31", light: "#FCCFCC" }, // red
  { bg: "#EEF4FF", accent: "#3B7DD8", light: "#C5D9F7" }, // blue
  { bg: "#F3EEFF", accent: "#7C4DFF", light: "#D9C8FF" }, // purple
  { bg: "#E8FAF0", accent: "#00BFA5", light: "#B2EFE3" }, // teal
  { bg: "#FFF3E0", accent: "#F57C00", light: "#FFD9A8" }, // orange
  { bg: "#FCE4EC", accent: "#C2185B", light: "#F5B8CE" }, // pink
];

const CourseCardSkeleton = () => (
  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
  </div>
);

type SavedLessonProgress = {
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  stepIndex: number;
  savedAt: number;
};

// ─── Daily Challenges ────────────────────────────────────────────────────────

const DAILY_CHALLENGE_POOL = [
  { id: "complete-lesson", text: "Complete a lesson", icon: <BookOpen size={16} />, xp: 15 },
  { id: "log-expense",     text: "Log an expense",   icon: <CreditCard size={16} />, xp: 10 },
  { id: "check-budget",    text: "Check your budget", icon: <Wallet size={16} />, xp: 10 },
  { id: "earn-50xp",       text: "Earn 50 XP today",  icon: <Zap size={16} />, xp: 20 },
  { id: "perfect-quiz",    text: "Get a perfect quiz score", icon: <Trophy size={16} />, xp: 25 },
  { id: "complete-2-lessons", text: "Complete 2 lessons today", icon: <BookOpen size={16} />, xp: 15 },
];

function getDailyChallenges(): typeof DAILY_CHALLENGE_POOL {
  // Deterministic daily selection using date as seed
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed = ((seed << 5) - seed + today.charCodeAt(i)) | 0;
  const shuffled = [...DAILY_CHALLENGE_POOL].sort((a, b) => {
    const ha = ((seed * 31 + a.id.charCodeAt(0)) & 0x7fffffff) % 1000;
    const hb = ((seed * 31 + b.id.charCodeAt(0)) & 0x7fffffff) % 1000;
    return ha - hb;
  });
  return shuffled.slice(0, 3);
}

function DailyChallenges({ streak = 0, onXpClaimed }: { streak?: number; onXpClaimed?: (amount: number) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = `fundi-daily-challenges-${today}`;
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [conditions, setConditions] = useState<Record<string, boolean>>({});
  const challenges = React.useMemo(() => getDailyChallenges(), []);

  // Reload conditions every 5 seconds so UI updates as user completes actions
  const refreshConditions = React.useCallback(() => {
    if (typeof window === "undefined") return;
    setConditions({
      "complete-lesson": parseInt(localStorage.getItem(`fundi-lessons-today-${today}`) ?? "0") >= 1,
      "log-expense":     parseInt(localStorage.getItem(`fundi-expense-today-${today}`) ?? "0") >= 1,
      "check-budget":    localStorage.getItem(`fundi-budget-visited-${today}`) === "1",
      "earn-50xp":       parseInt(localStorage.getItem(`fundi-daily-xp-${today}`) ?? "0") >= 50,
      "perfect-quiz":    parseInt(localStorage.getItem(`fundi-perfect-today-${today}`) ?? "0") >= 1,
      "complete-2-lessons": (parseInt(localStorage.getItem(`fundi-daily-lessons-${today}`) ?? "0") >= 2),
    });
  }, [today, streak]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      setClaimed(saved);
    } catch { /* ignore */ }
    refreshConditions();

    // Also load from Supabase to sync across devices
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("user_progress").select("daily_challenges_date, daily_challenges_claimed").eq("user_id", user.id).single();
          if (data && data.daily_challenges_date === today && data.daily_challenges_claimed) {
            try {
              const claimedFromDb = JSON.parse(typeof data.daily_challenges_claimed === 'string' ? data.daily_challenges_claimed : JSON.stringify(data.daily_challenges_claimed));
              setClaimed(c => ({ ...c, ...claimedFromDb }));
              localStorage.setItem(storageKey, JSON.stringify({ ...JSON.parse(localStorage.getItem(storageKey) ?? "{}"), ...claimedFromDb }));
            } catch { /* ignore parse error */ }
          }
        }
      } catch { /* ignore Supabase error */ }
    })();
  }, [storageKey, refreshConditions]);

  useEffect(() => {
    const timer = setInterval(refreshConditions, 5000);
    return () => clearInterval(timer);
  }, [refreshConditions]);

  const claimChallenge = async (challengeId: string, xp: number) => {
    if (!conditions[challengeId]) return; // Guard: only claim if actually achieved
    const next = { ...claimed, [challengeId]: true };
    setClaimed(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    analytics.dailyChallengeClaimed(challengeId, xp);

    // Update local weekly XP state so leaderboard reflects this immediately
    onXpClaimed?.(xp);

    // Award XP via Supabase — update BOTH total xp AND weekly_xp + week_key
    // so the leaderboard correctly ranks this user.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_progress")
        .select("xp, weekly_xp, week_key")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const currentWeekKey = getLeaderboardWeekKey();
        const existingWeeklyXp = data.week_key === currentWeekKey ? (data.weekly_xp ?? 0) : 0;
        await supabase.from("user_progress").update({
          xp: (data.xp ?? 0) + xp,
          weekly_xp: existingWeeklyXp + xp,
          week_key: currentWeekKey,
          daily_challenges_date: today,
          daily_challenges_claimed: JSON.stringify(next),
        }).eq("user_id", user.id);
      }
    }
  };

  const allClaimed = challenges.every((c) => claimed[c.id]);

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkles size={18} style={{ color: "#FFB612" }} />
        <div style={{ fontWeight: 800, fontSize: 14 }}>Daily Challenges</div>
        {allClaimed && <span style={{ fontSize: 11, fontWeight: 700, color: "#007A4D", marginLeft: "auto" }}>All done!</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {challenges.map((ch) => {
          const done = !!claimed[ch.id];
          const achieved = !!conditions[ch.id];
          return (
            <div key={ch.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              borderRadius: 10,
              background: done ? "rgba(0,122,77,0.06)" : achieved ? "rgba(255,182,18,0.04)" : "var(--color-bg)",
              border: `1px solid ${done ? "rgba(0,122,77,0.2)" : achieved ? "rgba(255,182,18,0.3)" : "var(--color-border)"}`,
              opacity: done ? 1 : achieved ? 1 : 0.65,
            }}>
              <div style={{ color: done ? "#007A4D" : achieved ? "#FFB612" : "var(--color-text-secondary)", display: "flex", flexShrink: 0 }}>
                {done ? <CheckCircle2 size={16} /> : ch.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: done ? "#007A4D" : "var(--color-text-primary)", textDecoration: done ? "line-through" : "none" }}>
                  {ch.text}
                </div>
                {!done && !achieved && (
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 1 }}>
                    Complete the task first
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: done ? "#007A4D" : achieved ? "#FFB612" : "var(--color-text-secondary)", flexShrink: 0 }}>
                {done ? "Done" : `+${ch.xp} XP`}
              </div>
              {!done && achieved && (
                <button type="button" onClick={() => claimChallenge(ch.id, ch.xp)}
                  style={{ background: "var(--color-primary)", color: "white", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  Claim
                </button>
              )}
              {!done && !achieved && (
                <Lock size={13} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 10, textAlign: "center" }}>
        Resets at midnight · Complete each task to unlock its reward
      </div>
    </div>
  );
}

// ── Spaced Repetition Review Session ─────────────────────────────────────────

function ReviewSession({ onClose }: { onClose: () => void }) {
  const [queue, setQueue] = useState<MasteryRecord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const REVIEW_SESSION_KEY = "fundi-review-session";

  useEffect(() => {
    void (async () => {
      setLoading(true);
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(REVIEW_SESSION_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as {
              queue: MasteryRecord[];
              currentIdx: number;
              selected: number | null;
              showExplanation: boolean;
              correctCount: number;
            };
            if (parsed.queue?.length > 0 && parsed.currentIdx < parsed.queue.length) {
              setQueue(parsed.queue);
              setCurrentIdx(parsed.currentIdx);
              setSelected(parsed.selected);
              setShowExplanation(parsed.showExplanation);
              setCorrectCount(parsed.correctCount);
              setHasLoaded(true);
              setLoading(false);
              return;
            }
          } catch {
            // Ignore corrupted local state and continue with fresh due cards.
          }
        }
      }
      const dueCards = await getDueCards();
      setQueue(dueCards);
      setHasLoaded(true);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasLoaded || queue.length === 0 || currentIdx >= queue.length) return;
    localStorage.setItem(
      REVIEW_SESSION_KEY,
      JSON.stringify({ queue, currentIdx, selected, showExplanation, correctCount })
    );
  }, [queue, currentIdx, selected, showExplanation, correctCount, hasLoaded]);

  const current = queue[currentIdx];
  const concept = current ? CONCEPTS.find((c) => c.id === current.concept_id) : null;

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
    const isCorrect = concept && idx === concept.reviewCard.correct;
    if (isCorrect) {
      setCorrectCount((n) => n + 1);
      playSound("correct");
    } else {
      playSound("incorrect");
    }
  };

  const handleNext = () => {
    if (!current || !concept) return;
    const isCorrect = selected === concept.reviewCard.correct;
    const updated = applyReview(current, isCorrect ? 4 : 1);
    saveMastery(updated);
    if (currentIdx + 1 >= queue.length) {
      // All done - go to summary by setting currentIdx beyond queue
      setCurrentIdx(queue.length);
    } else {
      setSelected(null);
      setShowExplanation(false);
      setCurrentIdx((i) => i + 1);
    }
  };

  const isDone = !loading && hasLoaded && queue.length > 0 && currentIdx >= queue.length;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-2xl">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Loading review...</p>
        </div>
      </div>
    );
  }

  if (hasLoaded && queue.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Review</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Nothing due for review. Come back tomorrow to keep your streak strong.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white"
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(REVIEW_SESSION_KEY);
    }
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-2xl">
          <Brain size={52} className="mx-auto mb-3" style={{ color: "#3B7DD8" }} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Review complete!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {correctCount} of {queue.length} correct
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${Math.round((correctCount / queue.length) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Cards are rescheduled. Keep it up daily to master your finances!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!concept) {
    onClose();
    return null;
  }

  const card = concept.reviewCard;
  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top pb-3 pt-4 border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close review"
        >
          <X size={20} />
        </button>
        <div className="flex-1 mx-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.round(((currentIdx) / queue.length) * 100)}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* Card content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-1 flex items-center gap-1.5">
          <Brain size={13} className="text-purple-500" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-500">
            {concept.category}
          </span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 leading-snug">
          {card.question}
        </h2>

        <div className="space-y-3">
          {card.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === card.correct;
            let bg = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white";
            if (selected !== null) {
              if (isCorrect) bg = "bg-green-50 dark:bg-green-900/30 border-green-400 text-green-900 dark:text-green-200";
              else if (isSelected) bg = "bg-red-50 dark:bg-red-900/30 border-red-400 text-red-900 dark:text-red-200";
              else bg = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={selected !== null}
                onClick={() => handleAnswer(i)}
                className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${bg}`}
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-bold text-gray-500">
                  {optionLetters[i]}
                </span>
                <span className="text-sm font-medium">{opt}</span>
                {selected !== null && isCorrect && (
                  <CheckCircle2 size={16} className="ml-auto text-green-500 shrink-0" aria-hidden />
                )}
                {isSelected && !isCorrect && (
                  <X size={16} className="ml-auto text-red-500 shrink-0" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className={`mt-5 rounded-xl p-4 ${selected === card.correct ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"}`}>
            <p className={`text-xs font-bold mb-1 ${selected === card.correct ? "text-green-700 dark:text-green-400" : "text-orange-700 dark:text-orange-400"}`}>
              {selected === card.correct ? "✓ Correct!" : "Not quite"}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {card.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {selected !== null && (
        <div className="px-4 pb-safe-bottom pb-6 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white"
          >
            {currentIdx + 1 >= queue.length ? "See Results" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

export function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
  weeklyChallenge,
  weeklyProgress,
  challengeProgress,
  challengeComplete,
  challengeRewardClaimed,
  claimChallengeReward,
  contentLoaded = true,
  savedProgress,
  onResumeLesson,
  streak = 0,
  showQuestSections = false,
  addXP,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
  weeklyChallenge?: { text: string; target: number; xp: number; id: string; unit: string };
  weeklyProgress?: WeeklyProgressJSON;
  challengeProgress?: number;
  challengeComplete?: boolean;
  challengeRewardClaimed?: boolean;
  claimChallengeReward?: () => void;
  contentLoaded?: boolean;
  savedProgress?: SavedLessonProgress | null;
  onResumeLesson?: (p: SavedLessonProgress) => void;
  streak?: number;
  showQuestSections?: boolean;
  addXP?: (amount: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [goalDescription, setGoalDescription] = useState<string>("");
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [pickerGoalId, setPickerGoalId] = useState<string>("");
  const [pickerGoalDescription, setPickerGoalDescription] = useState<string>("");
  const [showReview, setShowReview] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  // Refresh due count on mount and when returning from a review
  useEffect(() => {
    void getDueCards().then((cards) => setDueCount(cards.length));
  }, [showReview]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUserGoal(localStorage.getItem("fundi-user-goal"));
    setGoalDescription(localStorage.getItem("fundi-goal-description") ?? "");
    // Listen for cross-device goal sync updates (dispatched by syncFromSupabase)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fundi-user-goal" && e.newValue) setUserGoal(e.newValue);
      if (e.key === "fundi-goal-description") setGoalDescription(e.newValue ?? "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const recommendedCourseIds =
    userGoal && GOAL_COURSE_MAP[userGoal] ? GOAL_COURSE_MAP[userGoal] : [];

  // Simple fuzzy match: returns true if query is a substring OR within 1 char edit distance
  const fuzzyMatch = (text: string, query: string): boolean => {
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (t.includes(q)) return true;
    // Check if any word in t starts with q (prefix match)
    if (t.split(/s+/).some(w => w.startsWith(q))) return true;
    // Levenshtein distance <= 1 for short queries (<=5 chars)
    if (q.length <= 5) {
      const levenshtein = (a: string, b: string): number => {
        const dp = Array.from({ length: a.length + 1 }, (_, i) =>
          Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
        );
        for (let i = 1; i <= a.length; i++)
          for (let j = 1; j <= b.length; j++)
            dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
        return dp[a.length][b.length];
      };
      // Check each word in the text
      const words = t.split(/s+/);
      if (words.some(w => levenshtein(w.slice(0, q.length + 1), q) <= 1)) return true;
    }
    return false;
  };
  const filteredCourses = search.trim()
    ? courses.filter(c =>
        fuzzyMatch(c.title, search) ||
        fuzzyMatch(c.description ?? "", search)
      )
    : courses;

  return (
    <main className="main-content main-with-stats" id="mainContent">
      {savedProgress && onResumeLesson && (
        <button
          type="button"
          onClick={() => onResumeLesson(savedProgress)}
          className="w-full flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-4 text-left"
        >
          <Play size={28} className="shrink-0 text-blue-600 dark:text-blue-400" fill="currentColor" aria-hidden />
          <div>
            <p className="text-blue-800 dark:text-blue-300 font-bold text-sm">
              Continue where you left off
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-xs">
              {savedProgress.lessonTitle || "Resume lesson"}
            </p>
          </div>
          <span className="ml-auto text-blue-400" aria-hidden>
            →
          </span>
        </button>
      )}

      {/* Spaced Repetition Review Banner */}
      {dueCount > 0 && (
        <button
          type="button"
          onClick={() => setShowReview(true)}
          className="w-full flex items-center gap-3 rounded-xl border-2 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 mb-4 text-left"
        >
          <div className="shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
            <Brain size={20} className="text-purple-600 dark:text-purple-300" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-purple-900 dark:text-purple-200 font-bold text-sm">
              {dueCount} concept{dueCount > 1 ? "s" : ""} to review
            </p>
            <p className="text-purple-600 dark:text-purple-400 text-xs">
              Quick quiz to keep your memory sharp
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-white bg-purple-600 rounded-full px-2.5 py-1">
            Start
          </span>
        </button>
      )}

      {showReview && (
        <ReviewSession
          onClose={() => {
            setShowReview(false);
            void getDueCards().then((cards) => setDueCount(cards.length));
          }}
        />
      )}

      {userGoal && (
        <div className="mb-4 rounded-xl border-2 border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-9 h-9 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                <Target size={18} className="text-green-600 dark:text-green-400" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 dark:text-green-500">Your goal</p>
                <p className="text-sm font-bold text-green-900 dark:text-green-200 leading-tight">
                  {GOAL_OPTIONS.find((g) => g.id === userGoal)?.label ?? userGoal}
                </p>
                {goalDescription && (
                  <p className="mt-0.5 text-xs text-green-700 dark:text-green-400 opacity-80 break-words">
                    {goalDescription}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerGoalId(userGoal);
                setPickerGoalDescription(goalDescription);
                setShowGoalPicker(true);
              }}
              className="shrink-0 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-transparent dark:text-green-400 dark:hover:bg-green-900/40"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
        Your Learning Path
      </h2>

      {!search.trim() && recommendedCourseIds.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Recommended for You</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Based on your goal</span>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {recommendedCourseIds.map((courseId) => {
              const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
              if (!course) return null;
              return (
                <button
                  key={courseId}
                  type="button"
                  onClick={() => goToCourse(course.id)}
                  className="w-44 flex-shrink-0 rounded-2xl border-2 border-green-200 bg-white p-4 text-left shadow-sm transition-all hover:border-green-400 hover:shadow-md dark:border-green-800 dark:bg-gray-800"
                >
                  <div className="mb-2 flex justify-center text-[var(--color-primary)]" aria-hidden>
                    <CourseIcon name={course.icon} size={40} />
                  </div>
                  <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">{course.title}</p>
                  <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">Start here →</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 40px 12px 16px", borderRadius: 12,
            border: "1.5px solid var(--color-border)", fontSize: 14,
            background: "var(--color-surface)", color: "var(--color-text-primary)",
            boxSizing: "border-box" as const,
          }}
        />
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }}>
          <Search size={18} aria-hidden />
        </span>
      </div>

      {search.trim() && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-3 flex justify-center text-gray-400 dark:text-gray-500" aria-hidden>
            <Search size={40} strokeWidth={1.5} />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            No results for &quot;{search.trim()}&quot;
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
            Try searching for a topic like &quot;budget&quot;, &quot;TFSA&quot;, or &quot;debt&quot;
          </p>
        </div>
      )}

      {/* Weekly challenge card */}
      {showQuestSections && weeklyChallenge && (
        <div style={{
          background: challengeComplete ? "rgba(0,122,77,0.08)" : "var(--color-surface)",
          border: `1.5px solid ${challengeComplete ? "var(--color-primary)" : "var(--color-border)"}`,
          borderRadius: 14, padding: "14px 16px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ flexShrink: 0, color: "var(--color-primary)", display: "flex" }}>
            {challengeComplete ? <Trophy size={28} /> : <Zap size={28} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 2 }}>
              Weekly Challenge
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {weeklyChallenge?.text}
            </div>
            <div style={{ background: "var(--color-border)", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 4, background: "var(--color-primary)",
                width: `${Math.min(((challengeProgress || 0) / weeklyChallenge.target) * 100, 100)}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
              {challengeProgress || 0}/{weeklyChallenge.target} · Reward: +{weeklyChallenge.xp} XP
            </div>
            {weeklyProgress && weeklyChallenge && (
              <div
                className="text-gray-500 dark:text-gray-400"
                style={{ fontSize: 10, marginTop: 6, lineHeight: 1.4 }}
              >
                {weeklyChallenge.unit === "lessons" &&
                  `${weeklyProgress.lessonsCompleted} lesson${weeklyProgress.lessonsCompleted === 1 ? "" : "s"} this week`}
                {weeklyChallenge.unit === "perfect" &&
                  `${weeklyProgress.perfectLessons} perfect lesson${weeklyProgress.perfectLessons === 1 ? "" : "s"}`}
                {weeklyChallenge.unit === "daily_xp" &&
                  `${weeklyProgress.dailyXp} XP earned today (goal ${weeklyChallenge.target})`}
                {weeklyChallenge.unit === "streak_days" &&
                  `${weeklyProgress.streakDaysThisWeek} day${weeklyProgress.streakDaysThisWeek === 1 ? "" : "s"} with lessons this week (goal: ${weeklyChallenge.target})`}
              </div>
            )}
          </div>
          {challengeComplete && !challengeRewardClaimed && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }}
              onClick={claimChallengeReward}>
              Claim
            </button>
          )}
          {challengeRewardClaimed && (
            <div style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={14} /> Claimed
            </div>
          )}
        </div>
      )}

      {/* Daily Challenges */}
      {showQuestSections && <DailyChallenges streak={streak} onXpClaimed={addXP} />}

      {!contentLoaded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      )}

      <div className={`courses-grid ${!contentLoaded ? "hidden" : ""}`}>
        {filteredCourses.map((course, courseIndex) => {
          const originalIndex = courses.indexOf(course);
          const courseIndex2 = originalIndex;
          const colour = COURSE_COLOURS[(originalIndex ?? courseIndex2) % COURSE_COLOURS.length];
          const totalLessons = course.units.reduce(
            (sum, unit) => sum + unit.lessons.length, 0
          );
          const completedLessons = course.units.reduce((sum, unit) => {
            return sum + unit.lessons.filter((lesson) =>
              isLessonCompleted(course.id, lesson.id)
            ).length;
          }, 0);
          const percentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100) : 0;
          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => goToCourse(course.id)}
              style={{ background: colour.bg, borderColor: colour.light, borderWidth: 1.5 }}
            >
              <div className="course-header">
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12, color: colour.accent }}>
                    <CourseIcon name={course.icon} size={48} />
                  </div>
                  <div className="course-title" style={{ color: colour.accent }}>{course.title}</div>
                  {recommendedCourseIds.includes(course.id) && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      background: "rgba(0,122,77,0.12)", borderRadius: 20,
                      padding: "2px 8px", fontSize: 10, fontWeight: 700,
                      color: "#007A4D", marginBottom: 4,
                    }}>
                      <Target size={9} aria-hidden /> Recommended for your goal
                    </div>
                  )}
                  <div className="course-description">{course.description}</div>
                </div>
                <div className="course-progress">
                  <div className="course-percentage" style={{ color: colour.accent }}>{percentage}%</div>
                  <div className="course-percentage-label">Complete</div>
                </div>
              </div>
              {/* Coloured progress bar */}
              <div style={{ height: 6, background: colour.light, borderRadius: 3, margin: "8px 0", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${percentage}%`, background: colour.accent, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <div className="course-stats">
                <div className="course-stat">
                  <strong>{completedLessons}</strong> / {totalLessons} lessons
                </div>
                <div className="course-stat">
                  <strong>{course.units.length}</strong> units
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showGoalPicker && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-picker-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 dark:bg-gray-800">
            <h2 id="goal-picker-title" className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              Your money goal
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              We&apos;ll prioritise courses that match what you want to achieve.
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setPickerGoalId(g.id);
                    if (g.id !== "other") setPickerGoalDescription("");
                  }}
                  className={`rounded-xl border-2 p-3 text-left text-sm font-semibold transition-colors ${
                    pickerGoalId === g.id
                      ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                      : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/40"
                  }`}
                >
                  <g.Icon size={16} className="mr-1 inline align-text-bottom text-green-600 dark:text-green-400" aria-hidden />
                  {g.label}
                </button>
              ))}
            </div>
            {pickerGoalId === "other" && (
              <textarea
                placeholder="Describe your goal - e.g. save for my child's education"
                value={pickerGoalDescription}
                onChange={(e) => setPickerGoalDescription(e.target.value)}
                rows={3}
                className="mb-3 w-full resize-y rounded-xl border-2 border-green-600 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none dark:bg-gray-900/40 dark:text-white"
              />
            )}
            {pickerGoalId && pickerGoalId !== "other" && (
              <textarea
                placeholder="Anything more to say about this goal? (optional)"
                value={pickerGoalDescription}
                onChange={(e) => setPickerGoalDescription(e.target.value)}
                rows={2}
                className="mb-3 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-900/40 dark:text-white"
              />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"
                onClick={() => setShowGoalPicker(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
                disabled={!pickerGoalId || (pickerGoalId === "other" && !pickerGoalDescription.trim())}
                onClick={async () => {
                  if (!pickerGoalId) return;
                  const desc = pickerGoalDescription.trim() || undefined;
                  await persistUserGoalToStorageAndSupabase(pickerGoalId, desc);
                  setUserGoal(pickerGoalId);
                  setGoalDescription(desc ?? "");
                  setShowGoalPicker(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function QuestsView({
  dailyXP,
  dailyGoal,
  weeklyChallenge,
  weeklyProgress,
  challengeProgress,
  challengeComplete,
  challengeRewardClaimed,
  claimChallengeReward,
  streak,
  addXP,
}: {
  dailyXP: number;
  dailyGoal: number;
  weeklyChallenge?: { text: string; target: number; xp: number; id: string; unit: string };
  weeklyProgress?: WeeklyProgressJSON;
  challengeProgress?: number;
  challengeComplete?: boolean;
  challengeRewardClaimed?: boolean;
  claimChallengeReward?: () => void;
  streak: number;
  addXP?: (amount: number) => void;
}) {
  const goalPct = Math.min(100, Math.round((dailyXP / Math.max(1, dailyGoal)) * 100));
  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Quests</h2>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Target size={16} className="text-[var(--color-primary)]" aria-hidden />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Daily Goal</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>
          {dailyXP} / {dailyGoal} XP today
        </p>
        <div style={{ height: 8, background: "var(--color-border)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${goalPct}%`, height: "100%", background: "var(--color-primary)", transition: "width 0.4s ease" }} />
        </div>
      </div>
      {weeklyChallenge && (
        <div style={{
          background: challengeComplete ? "rgba(0,122,77,0.08)" : "var(--color-surface)",
          border: `1.5px solid ${challengeComplete ? "var(--color-primary)" : "var(--color-border)"}`,
          borderRadius: 14, padding: "14px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ flexShrink: 0, color: "var(--color-primary)", display: "flex" }}>
            {challengeComplete ? <Trophy size={28} /> : <Zap size={28} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 2 }}>
              Weekly Challenge
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{weeklyChallenge.text}</div>
            <div style={{ background: "var(--color-border)", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, background: "var(--color-primary)", width: `${Math.min(((challengeProgress || 0) / weeklyChallenge.target) * 100, 100)}%` }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
              {challengeProgress || 0}/{weeklyChallenge.target} · Reward: +{weeklyChallenge.xp} XP
            </div>
            {weeklyProgress && (
              <div className="text-gray-500 dark:text-gray-400" style={{ fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
                {weeklyChallenge.unit === "lessons" && `${weeklyProgress.lessonsCompleted} lesson${weeklyProgress.lessonsCompleted === 1 ? "" : "s"} this week`}
                {weeklyChallenge.unit === "perfect" && `${weeklyProgress.perfectLessons} perfect lesson${weeklyProgress.perfectLessons === 1 ? "" : "s"}`}
                {weeklyChallenge.unit === "daily_xp" && `${weeklyProgress.dailyXp} XP earned today (goal ${weeklyChallenge.target})`}
                {weeklyChallenge.unit === "streak_days" && `${weeklyProgress.streakDaysThisWeek} day${weeklyProgress.streakDaysThisWeek === 1 ? "" : "s"} with lessons this week (goal: ${weeklyChallenge.target})`}
              </div>
            )}
          </div>
          {challengeComplete && !challengeRewardClaimed && (
            <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px", flexShrink: 0 }} onClick={claimChallengeReward}>
              Claim
            </button>
          )}
          {challengeRewardClaimed && (
            <div style={{ fontSize: 11, color: "var(--color-primary)", fontWeight: 700, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={14} /> Claimed
            </div>
          )}
        </div>
      )}
      <DailyChallenges streak={streak} onXpClaimed={addXP} />
    </main>
  );
}

export function CourseView({
  course,
  isLessonCompleted,
  goBack,
  goToLesson,
  courseIndex = 0,
  nextCourse,
  onGoToNextCourse,
}: {
  course: Course;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goBack: () => void;
  goToLesson: (lessonId: string) => void;
  courseIndex?: number;
  nextCourse?: Course | null;
  onGoToNextCourse?: () => void;
}) {
  // Scroll to top when course is loaded
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const mainContent = document.querySelector(".main-content");
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: "instant" });
  }, [course.id]);

  const colour = COURSE_COLOURS[courseIndex % COURSE_COLOURS.length];
  const [lockedModal, setLockedModal] = useState<{
    lessonTitle: string;
    reason: string;
  } | null>(null);

  // ── Progression logic ──────────────────────────────────────────────────────
  // A lesson state is determined by LIVE PROGRESS, not the static comingSoon flag.
  //   completed   → isLessonCompleted() is true
  //   playable    → has steps AND (first in unit OR prev lesson completed)
  //   locked      → has steps BUT prerequisite not yet done
  //   coming_soon → no steps array at all (content not written yet)
  type LessonState = "completed" | "playable" | "locked" | "coming_soon";

  function getLessonState(
    unitLessons: Course["units"][0]["lessons"],
    lessonIndex: number
  ): LessonState {
    const lesson = unitLessons[lessonIndex];
    const hasContent = Array.isArray(lesson.steps) && lesson.steps.length > 0;

    if (!hasContent) return "coming_soon";
    if (isLessonCompleted(course.id, lesson.id)) return "completed";
    if (lessonIndex === 0) return "playable";
    const prevDone = isLessonCompleted(course.id, unitLessons[lessonIndex - 1].id);
    const state = prevDone ? "playable" : "locked";
    return state;
  }

  return (
    <main className="main-content main-with-stats">
      <div className="course-map">
        <button className="back-button" onClick={goBack}>
          <span className="inline-flex items-center gap-2">
            <ArrowLeft size={20} className="text-current" />
            Back to Courses
          </span>
        </button>

        <div className="course-map-header" style={{ background: colour.bg, borderRadius: 16, padding: "20px 16px", marginBottom: 8 }}>
          <div style={{ marginBottom: 12, color: colour.accent }}>
            <CourseIcon name={course.icon} size={56} />
          </div>
          <h2 className="course-map-title" style={{ color: colour.accent }}>{course.title}</h2>
          <p className="course-map-description">{course.description}</p>
        </div>

        {course.units.map((unit) => (
          <div className="unit" key={unit.id}>
            <div className="unit-header">
              <div className="unit-title">{unit.title}</div>
              <div className="unit-description">{unit.description}</div>
            </div>

            <div className="lessons-path">
              {unit.lessons.map((lesson, lessonIndex) => {
                const state = getLessonState(unit.lessons, lessonIndex);

                let nodeClass = "lesson-node";
                let icon: ReactNode = (
                  <BookOpen size={28} className="text-current" />
                );

                if (state === "completed") {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                } else if (state === "locked" || state === "coming_soon") {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                } else if (state === "playable") {
                  nodeClass += " playable";
                }

                const handleClick = () => {
                  if (state === "coming_soon") {
                    setLockedModal({
                      lessonTitle: lesson.title,
                      reason: "This lesson is coming soon. Check back soon!",
                    });
                  } else if (state === "locked") {
                    const prev = unit.lessons[lessonIndex - 1];
                    setLockedModal({
                      lessonTitle: lesson.title,
                      reason:
                        'Complete "' +
                        prev.title +
                        '" first to unlock this lesson.',
                    });
                  } else {
                    // "completed" or "playable", open the lesson
                    goToLesson(lesson.id);
                  }
                };

                return (
                  <div key={lesson.id}>
                    <div
                      className={nodeClass}
                      onClick={handleClick}
                      style={{
                        cursor: state === "playable" || state === "completed" ? "pointer" : "default",
                        background: state === "completed" ? "#007A4D" :
                                    state === "playable" ? colour.bg : undefined,
                        borderColor: state === "completed" ? "#007A4D" :
                                     state === "playable" ? colour.accent : undefined,
                        color: state === "completed" ? "white" :
                               state === "playable" ? colour.accent : undefined,
                        borderWidth: state === "playable" ? 2.5 : undefined,
                        boxShadow: state === "playable" ? `0 0 0 0 ${colour.accent}55` : undefined,
                        animation: state === "playable" ? "node-pulse 2s ease-in-out infinite" : undefined,
                      }}
                    >
                      {icon}
                    </div>
                    <div className="lesson-label">
                      {lesson.title}
                      {state === "coming_soon" && (
                        <span
                          style={{
                            display: "block",
                            fontSize: 10,
                            color: "var(--color-text-secondary)",
                            marginTop: 2,
                          }}
                        >
                          Coming soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {nextCourse ? (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 24 }}
            onClick={onGoToNextCourse}
          >
            Next Course: {nextCourse.title}
          </button>
        ) : (
          <p style={{ textAlign: "center", marginTop: 24, color: "var(--color-text-secondary)", fontSize: 15, fontWeight: 600 }}>
            You&apos;ve completed all courses!
          </p>
        )}

        {/* Lock / coming-soon modal */}
        {lockedModal && (
          <div
            onClick={() => setLockedModal(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              zIndex: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-surface)",
                borderRadius: 20,
                padding: "28px 24px",
                width: "100%",
                maxWidth: 340,
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <Lock
                  size={40}
                  style={{
                    color: "var(--color-text-secondary)",
                    margin: "0 auto",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 8,
                }}
              >
                {lockedModal.lessonTitle}
              </div>
              <p
                style={{
                  color: "var(--color-text-secondary)",
                  marginBottom: 20,
                  lineHeight: 1.6,
                  fontSize: 14,
                }}
              >
                {lockedModal.reason}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setLockedModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
function FillBlankStep({ step, isAnswered, isCorrect, submittedAnswer, onSubmit, onNext, isLast, correctCount, finalizeLesson, nextLessonTitle, lessonTitle }: {
  step: any; isAnswered: boolean; isCorrect: boolean; submittedAnswer: string | undefined;
  onSubmit: (v: string) => void; onNext: () => void; isLast: boolean; correctCount: number;
  finalizeLesson?: (choice: "next" | "course") => void;
  nextLessonTitle?: string;
  lessonTitle?: string;
}) {
  const [val, setVal] = React.useState("");
  React.useEffect(() => {
    (window as any).__fillBlankSubmit = (v: string, correct: boolean) => {
      // handled inline
    };
  }, []);

  const handleSubmit = () => {
    if (!val.trim()) return;
    onSubmit(val.trim());
  };

  const parts = (step.prompt as string).split("___");

  return (
    <>
      <h2 className="step-title">{step.title || "Fill in the blank"}</h2>
      <div className="step-content" style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>
        {parts[0]}
        {!isAnswered ? (
          <input
            type="text"
            inputMode="decimal"
            value={val}
            onChange={e => setVal(e.target.value.replace(/[^0-9.,]/g, ""))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            style={{
              display: "inline-block", width: 100, margin: "0 8px",
              padding: "4px 10px", borderRadius: 8, fontWeight: 700, fontSize: 16,
              border: "2px solid var(--color-primary)", textAlign: "center",
              background: "var(--color-surface)", color: "var(--color-text-primary)",
            }}
            placeholder="?"
            autoFocus
          />
        ) : (
          <span style={{
            display: "inline-block", margin: "0 8px", padding: "2px 12px",
            borderRadius: 8, fontWeight: 800, fontSize: 16,
            background: isCorrect ? "#007A4D" : "#E03C31", color: "white",
          }}>
            {submittedAnswer}
          </span>
        )}
        {parts[1]}
      </div>

      {!isAnswered && (
        <div className="lesson-actions">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!val.trim()}>
            Check
          </button>
        </div>
      )}

      {isAnswered && (
        <>
          <div className={"feedback " + (isCorrect ? "correct" : "incorrect")}>
            {isCorrect
              ? (step.feedback?.correct || "Correct! Well done.")
              : (step.feedback?.incorrect || `The correct answer is ${formatWithSpaces(step.correct)}. ${step.explanation || ""}`)}
          </div>
          <div className="lesson-actions">
            {isLast ? (
              <div style={{ textAlign: "center", width: "100%" }}>
                <Trophy size={48} style={{ color: "#FFB612", margin: "0 auto 8px" }} />
                <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lesson Complete!</div>
                {finalizeLesson ? (
                  <div className="flex flex-col gap-3 mt-2" style={{ width: "100%" }}>
                    {nextLessonTitle ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                        onClick={() => finalizeLesson("next")}
                      >
                        Next Lesson: {nextLessonTitle} →
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                        <Sparkles size={22} className="text-[#FFB612]" aria-hidden />
                        Course Complete!
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        fontSize: 15,
                        fontWeight: 700,
                        background: "var(--color-bg)",
                        color: "var(--color-text-primary)",
                        border: "1.5px solid var(--color-border)",
                      }}
                      onClick={() => finalizeLesson("course")}
                    >
                      ✓ Done - Back to Course
                    </button>
                    {lessonTitle ? (
                      <ShareResultButton
                        data={{ type: "lesson", lessonTitle, xpEarned: 50 + correctCount * 10, isPerfect: false, courseName: "Fundi Finance" }}
                        label="Share your result"
                      />
                    ) : null}
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={onNext}>Continue</button>
                )}
              </div>
            ) : (
              <button className="btn btn-primary" onClick={onNext}>Continue</button>
            )}
          </div>
        </>
      )}
    </>
  );
}

export function LessonView({
  lessonState,
  completeLessonFlow,
  nextStep,
  finalizeLesson,
  answerQuestion,
  answerTrueFalse,
  correctCount,
  hearts = 5,
  maxHearts = 5,
  goBack,
  courseId,
  courseAccent,
  nextLessonTitle,
  lessonTitle,
  lessonStartTimeRef,
  totalQuestions = 0,
}: {
  lessonState: {
    steps: LessonStep[];
    stepIndex: number;
    answers: Record<number, unknown>;
  };
  completeLessonFlow: () => void;
  nextStep: () => void;
  finalizeLesson?: (choice: "next" | "course") => void;
  answerQuestion: (index: number) => void;
  answerTrueFalse: (value: boolean) => void;
  correctCount: number;
  hearts?: number;
  maxHearts?: number;
  goBack?: () => void;
  courseId?: string;
  courseAccent?: string;
  nextLessonTitle?: string;
  lessonTitle?: string;
  lessonStartTimeRef?: React.MutableRefObject<number>;
  totalQuestions?: number;
}) {
  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);

  const isOnLastStep = lessonState.stepIndex === lessonState.steps.length - 1;
  const isCompleted = lessonState.stepIndex >= lessonState.steps.length;

  // ── Exit confirm modal ────────────────────────────────────────────────────
  function ExitConfirmModal() {
    if (!showExitConfirm) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: 20,
            padding: "24px 22px",
            width: "100%",
            maxWidth: 340,
            textAlign: "center",
            border: "1px solid var(--color-border)",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Leave?</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 18, lineHeight: 1.5 }}>
            If you leave now, you may lose your progress for this lesson.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>
              Keep Going
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, background: "#E03C31", border: "none" }}
              onClick={() => {
                setShowExitConfirm(false);
                goBack?.();
              }}
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ── End exit modal ────────────────────────────────────────────────────────

  const renderStep = () => {
    if (!step) return null;
    if (step.type === "info") {
      return (
        <>
          <h2 className="step-title">{step.title}</h2>
          <div
            className="step-content"
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
          <div className="lesson-actions">
            {isOnLastStep ? (
              finalizeLesson ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  {nextLessonTitle ? (
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => finalizeLesson("next")}>Next Lesson: {nextLessonTitle} →</button>
                  ) : null}
                  <button className="btn btn-secondary" style={{ width: "100%", background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }} onClick={() => finalizeLesson("course")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={18} /> Done - Back to Course</span>
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={nextStep}>Finish</button>
              )
            ) : (
              <button className="btn btn-primary" onClick={nextStep}>Continue</button>
            )}
          </div>
        </>
      );
    }

    if (step.type === "action") {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-green-600 px-5 py-4">
            <Zap className="h-8 w-8 shrink-0 text-white" strokeWidth={2} aria-hidden />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-100">Do This Now</p>
              <p className="text-lg font-bold leading-tight text-white">{step.title}</p>
            </div>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-base leading-relaxed text-gray-800 dark:text-gray-100">{step.instruction}</p>
          </div>
          {step.tip ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                <Lightbulb size={16} className="mt-0.5 shrink-0" aria-hidden />
                <span><span className="font-semibold">Tip:</span> {step.tip}</span>
              </p>
            </div>
          ) : null}
          <div className="lesson-actions">
            {isOnLastStep ? (
              finalizeLesson ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  {nextLessonTitle ? (
                    <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => finalizeLesson("next")}>Next Lesson: {nextLessonTitle} →</button>
                  ) : null}
                  <button type="button" className="btn btn-secondary" style={{ width: "100%", background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }} onClick={() => finalizeLesson("course")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={18} /> Done - Back to Course</span>
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-primary" onClick={nextStep}>Finish</button>
              )
            ) : (
              <button type="button" className="btn btn-primary" onClick={nextStep}>Continue</button>
            )}
          </div>
        </div>
      );
    }

    // ── Action Check step (behaviour change) ──────────────────────────────
    if ((step as any).type === "action-check") {
      const s = step as any;
      const didAction = lessonState.answers[lessonState.stepIndex] as string | undefined;
      return (
        <div className="flex flex-col gap-4">
          <div style={{
            background: "linear-gradient(135deg, #007A4D 0%, #00A86B 100%)",
            borderRadius: 16, padding: "20px 20px 16px", color: "white",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Target size={24} className="shrink-0" />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.9 }}>
                Take Action
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 0 }}>{s.title}</h3>
          </div>
          <div style={{
            background: "var(--color-surface)", border: "2px solid var(--color-primary)",
            borderRadius: 14, padding: "18px 16px",
          }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-primary)", fontWeight: 500 }}>{s.challenge}</p>
          </div>
          {!didAction ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 2, padding: "14px 16px", fontSize: 15, fontWeight: 800 }}
                onClick={() => {
                  // Track action completed
                  const key = "fundi-actions-completed";
                  const count = parseInt(localStorage.getItem(key) ?? "0", 10);
                  localStorage.setItem(key, String(count + 1));
                  // Store answer as "done"
                  (window as any).__actionCheckAnswer?.("done");
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={18} aria-hidden />
                  Done - I did it!
                </span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, padding: "14px 12px", fontSize: 13, fontWeight: 600 }}
                onClick={() => {
                  (window as any).__actionCheckAnswer?.("skipped");
                }}
              >
                Skip for now
              </button>
            </div>
          ) : (
            <div style={{
              borderRadius: 14, padding: "16px",
              background: didAction === "done" ? "rgba(0,122,77,0.08)" : "rgba(255,182,18,0.08)",
              border: `1.5px solid ${didAction === "done" ? "var(--color-primary)" : "#FFB612"}`,
            }}>
              <p style={{
                fontSize: 14, lineHeight: 1.6, fontWeight: 600,
                color: didAction === "done" ? "var(--color-primary)" : "#8B6914",
              }}>
                {didAction === "done" ? s.successMessage : s.skipMessage}
              </p>
            </div>
          )}
          {didAction && (
            <div className="lesson-actions">
              {lessonState.stepIndex === lessonState.steps.length - 1 ? (
                <div style={{ textAlign: "center", width: "100%" }}>
                  <Trophy size={48} style={{ color: "#FFB612", margin: "0 auto 8px" }} />
                  <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lesson Complete!</div>
                  {finalizeLesson ? (
                    <div className="flex flex-col gap-3 mt-2" style={{ width: "100%" }}>
                      {nextLessonTitle ? (
                        <button type="button" className="btn btn-primary"
                          style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                          onClick={() => finalizeLesson("next")}
                        >Next Lesson: {nextLessonTitle} →</button>
                      ) : (
                        <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                          <Sparkles size={22} className="text-[#FFB612]" aria-hidden /> Course Complete!
                        </div>
                      )}
                      <button type="button" className="btn btn-secondary"
                        style={{ width: "100%", padding: "12px 16px", fontSize: 15, fontWeight: 700,
                          background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}
                        onClick={() => finalizeLesson("course")}>
                        <span className="inline-flex items-center justify-center gap-2">
                          <CheckCircle2 size={18} aria-hidden /> Done - Back to Course
                        </span>
                      </button>
                      {lessonTitle && (
                        <ShareResultButton
                          data={{ type: "lesson", lessonTitle, xpEarned: 50 + correctCount * 10, isPerfect: false, courseName: "Fundi Finance" }}
                          label="Share your result"
                        />
                      )}
                    </div>
                  ) : (
                    <button className="btn btn-primary" onClick={nextStep}>Continue</button>
                  )}
                </div>
              ) : (
                <button className="btn btn-primary" onClick={nextStep}>Continue</button>
              )}
            </div>
          )}
        </div>
      );
    }

    // ── Calculator Embed step ─────────────────────────────────────────────
    if ((step as any).type === "calculator-embed") {
      const s = step as any;
      const [embedCalcDone, setEmbedCalcDone] = React.useState(false);
      const preset = s.preset ?? {};
      const embedInputs: CalcInputs = {
        principal: preset.principal ?? 0,
        monthly: preset.monthly ?? 500,
        rate: preset.rate ?? 10,
        years: preset.years ?? 10,
        escalation: preset.escalation ?? 5,
        frequency: preset.frequency ?? "monthly",
      };
      const embedData = React.useMemo(() => calcGrowth(embedInputs), []);
      const embedFinal = embedData.length > 0 ? embedData[embedData.length - 1] : { value: 0, contributions: 0, interest: 0 };
      const embedChart = embedData.map((d) => ({
        year: d.year,
        "Portfolio Value": d.value,
        "Total Contributions": d.contributions,
      }));

      return (
        <div className="flex flex-col gap-4">
          <div style={{
            background: "linear-gradient(135deg, #3B7DD8 0%, #2563EB 100%)",
            borderRadius: 16, padding: "20px", color: "white",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Calculator size={22} className="shrink-0" />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.9 }}>
                Interactive Calculator
              </span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>{s.title}</h3>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>{s.description}</p>
          </div>

          {!embedCalcDone ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={() => setEmbedCalcDone(true)}
            >
              <BarChart2 size={20} aria-hidden /> Calculate
            </button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{
                  flex: 1, minWidth: 120, background: "var(--color-primary)", borderRadius: 12,
                  padding: "14px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 0.5 }}>Final Value</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{formatRand(embedFinal.value)}</div>
                </div>
                <div style={{
                  flex: 1, minWidth: 120, background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: 12, padding: "14px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>You Put In</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "var(--color-text-primary)" }}>{formatRand(embedFinal.contributions)}</div>
                </div>
                <div style={{
                  flex: 1, minWidth: 120, background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: 12, padding: "14px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Interest Earned</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#007A4D" }}>{formatRand(embedFinal.interest)}</div>
                </div>
              </div>

              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={embedChart} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
                    <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} width={45} />
                    <Tooltip
                      formatter={(v) => formatRand(typeof v === "number" ? v : Number(v ?? 0))}
                      labelFormatter={(l) => `Year ${l}`}
                      contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Total Contributions" stroke="#FFB612" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                background: "rgba(0,122,77,0.06)", border: "1.5px solid rgba(0,122,77,0.2)",
                borderRadius: 12, padding: "14px 16px", borderLeft: "4px solid var(--color-primary)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Lightbulb size={14} style={{ color: "var(--color-primary)" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)" }}>Key Insight</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-text-primary)" }}>{s.insight}</p>
              </div>
            </>
          )}

          <div className="lesson-actions">
            <button className="btn btn-primary" onClick={nextStep}>Continue</button>
          </div>
        </div>
      );
    }

    if (step.type === "mcq" || step.type === "scenario") {
      const selectedAnswer = lessonState.answers[lessonState.stepIndex] as
        | number
        | undefined;
      const isCorrect = selectedAnswer === step.correct;
      return (
        <>
          <h2 className="step-title">{step.question}</h2>
          {step.content ? (
            <div
              className="step-content"
              dangerouslySetInnerHTML={{ __html: step.content }}
            />
          ) : null}
          <div className="question-options">
            {step.options.map((option, index) => {
              let optionClass = "option-button";
              if (answered) {
                if (index === selectedAnswer) {
                  optionClass += isCorrect ? " correct" : " incorrect";
                }
                if (index === step.correct && selectedAnswer !== step.correct) {
                  optionClass += " correct";
                }
              }
              return (
                <button
                  key={option}
                  className={optionClass}
                  onClick={() => answerQuestion(index)}
                  disabled={answered}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div
                className={`feedback ${isCorrect ? "correct" : "incorrect"}`}
              >
                {isCorrect ? step.feedback.correct : step.feedback.incorrect}
              </div>
              <div className="lesson-actions">
                {lessonState.stepIndex === lessonState.steps.length - 1 ? (
                  <div
                    style={{
                      textAlign: "center",
                      animation: "fade-in 0.4s ease-out",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 48,
                        marginBottom: 8,
                      }}
                    >
                      <Trophy
                        size={48}
                        style={{ color: "#FFB612", margin: "0 auto" }}
                      />
                    </div>
                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Lesson Complete!
                    </div>
                    {finalizeLesson ? (
                      <div className="flex flex-col gap-3 mt-2" style={{ width: "100%" }}>
                        {nextLessonTitle ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                            onClick={() => finalizeLesson("next")}
                          >
                            Next Lesson: {nextLessonTitle} →
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                            <Sparkles size={22} className="text-[#FFB612]" aria-hidden />
                            Course Complete!
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            fontSize: 15,
                            fontWeight: 700,
                            background: "var(--color-bg)",
                            color: "var(--color-text-primary)",
                            border: "1.5px solid var(--color-border)",
                          }}
                          onClick={() => finalizeLesson("course")}
                        >
                          <span className="inline-flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} aria-hidden />
                            Done - Back to Course
                          </span>
                        </button>
                        {lessonTitle ? (
                          <ShareButton
                            text={generateShareText("lesson", { lessonTitle })}
                            label="Share your progress"
                            shareType="lesson"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <>
                        {nextLessonTitle && (
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 14, opacity: 0.8 }}>
                            Up next: <strong>{nextLessonTitle}</strong>
                          </div>
                        )}
                        <button className="btn btn-primary" onClick={nextStep}>
                          {nextLessonTitle ? "Next Lesson →" : "Back to Course"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={nextStep}>
                    Continue
                  </button>
                )}
              </div>
            </>
          )}
        </>
      );
    }

    if (step.type === "true-false") {
      const selectedAnswer = lessonState.answers[lessonState.stepIndex] as
        | boolean
        | undefined;
      const isCorrect = selectedAnswer === step.correct;
      return (
        <>
          <h2 className="step-title">True or False?</h2>
          <div className="step-content">
            <p>{step.statement}</p>
          </div>
          <div className="question-options">
            {[true, false].map((value) => {
              let optionClass = "option-button";
              if (answered) {
                if (value === selectedAnswer) {
                  optionClass += isCorrect ? " correct" : " incorrect";
                }
                if (value === step.correct && selectedAnswer !== step.correct) {
                  optionClass += " correct";
                }
              }
              return (
                <button
                  key={String(value)}
                  className={optionClass}
                  onClick={() => answerTrueFalse(value)}
                  disabled={answered}
                >
                  {value ? "True" : "False"}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div
                className={`feedback ${isCorrect ? "correct" : "incorrect"}`}
              >
                {isCorrect ? step.feedback.correct : step.feedback.incorrect}
              </div>
              <div className="lesson-actions">
                {lessonState.stepIndex === lessonState.steps.length - 1 ? (
                  <div
                    style={{
                      textAlign: "center",
                      animation: "fade-in 0.4s ease-out",
                      width: "100%",
                    }}
                  >
                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      Lesson Complete!
                    </div>
                    {finalizeLesson ? (
                      <div className="flex flex-col gap-3 mt-2" style={{ width: "100%" }}>
                        {nextLessonTitle ? (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                            onClick={() => finalizeLesson("next")}
                          >
                            Next Lesson: {nextLessonTitle} →
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                            <Sparkles size={22} className="text-[#FFB612]" aria-hidden />
                            Course Complete!
                          </div>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            fontSize: 15,
                            fontWeight: 700,
                            background: "var(--color-bg)",
                            color: "var(--color-text-primary)",
                            border: "1.5px solid var(--color-border)",
                          }}
                          onClick={() => finalizeLesson("course")}
                        >
                          <span className="inline-flex items-center justify-center gap-2">
                            <CheckCircle2 size={18} aria-hidden />
                            Done - Back to Course
                          </span>
                        </button>
                        {lessonTitle ? (
                          <ShareButton
                            text={generateShareText("lesson", { lessonTitle })}
                            label="Share your progress"
                            shareType="lesson"
                          />
                        ) : null}
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={nextStep}>
                        Continue
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={nextStep}>
                    Continue
                  </button>
                )}
              </div>
            </>
          )}
        </>
      );
    }
    // ── Fill in the blank ────────────────────────────────────────────────────
    if ((step as any).type === "fill-blank") {
      const s = step as any;
      const submittedAnswer = lessonState.answers[lessonState.stepIndex];
      const isAnswered = submittedAnswer !== undefined;
      const isCorrect = isAnswered && Math.abs(Number(submittedAnswer) - s.correct) <= (s.correct * 0.1);

      return (
        <FillBlankStep
          step={s}
          isAnswered={isAnswered}
          isCorrect={isCorrect}
          submittedAnswer={submittedAnswer as string | undefined}
          onSubmit={(val) => {
            if (isAnswered) return;
            const correct = Math.abs(Number(val) - s.correct) <= (s.correct * 0.1);
            // inject into answers via parent's answerQuestion passing special index
            (window as any).__fillBlankSubmit?.(val, correct);
          }}
          onNext={nextStep}
          isLast={lessonState.stepIndex === lessonState.steps.length - 1}
          correctCount={correctCount}
          finalizeLesson={finalizeLesson}
          nextLessonTitle={nextLessonTitle}
          lessonTitle={lessonTitle}
        />
      );
    }

    return null;
  };

  return (
    <>
      <ExitConfirmModal />
      <main className="main-content main-with-stats">
        <div className="lesson-player">
          {/* Back button + progress bar + exit (hearts only in FundiTopBar) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, position: "sticky", top: 0, zIndex: 50, background: "var(--color-bg)", paddingTop: 8, paddingBottom: 8, marginTop: -8 }}>
            {goBack && (
              <button
                onClick={() => setShowExitConfirm(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 2px",
                  color: "var(--color-text-secondary)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Back to course"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
              <div
                className="lesson-progress-fill"
                style={{
                  width: `${progress}%`,
                  background: courseAccent ? `linear-gradient(90deg, ${courseAccent}99 0%, ${courseAccent} 100%)` : undefined,
                }}
              />
            </div>
            <button
              onClick={() => setShowExitConfirm(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 2px",
                color: "var(--color-text-secondary)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
              }}
              aria-label="Exit lesson"
              title="Exit lesson"
            >
              <X size={22} />
            </button>
          </div>
          <div className="lesson-step">{renderStep()}</div>
          {/* Financial education disclaimer */}
          <div style={{
            textAlign: "center",
            padding: "8px 16px 12px",
            color: "var(--color-text-secondary)",
            fontSize: 11,
            opacity: 0.75,
            borderTop: "1px solid var(--color-border)",
            marginTop: 4,
          }}>
            📚 For educational purposes only - not financial advice. Consult a licensed financial advisor before making financial decisions.
          </div>
        </div>
      </main>
    </>
  );
}

/** Returns the week key for the most recent Sunday: "fundi-week-YYYY-MM-DD" */
function SettingsAccountSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setName(data.user.user_metadata?.full_name ?? "");
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg(null);
    const updates: Record<string, unknown> = {};
    if (name.trim()) updates.data = { full_name: name.trim() };
    if (newPassword.trim().length >= 6) updates.password = newPassword.trim();
    if (Object.keys(updates).length === 0) { setSaving(false); setMsg("Nothing to update."); return; }
    const { error } = await supabase.auth.updateUser(updates as any);
    if (error) { setMsg(error.message); } else {
      setMsg("Saved!");
      if (name.trim()) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase.from("profiles").upsert({ user_id: data.user.id, full_name: name.trim() }, { onConflict: "user_id" });
        }
      }
      setNewPassword("");
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
    fontSize: 14, width: "100%", boxSizing: "border-box",
    background: "var(--color-bg)", color: "var(--color-text-primary)",
  };

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: "var(--color-text-primary)" }}>Edit Details</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" placeholder="Full name" value={name}
          onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <input type="email" placeholder="Email (cannot be changed here)" value={email}
          disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
        <div style={{ position: "relative" }}>
          <input type={showPw ? "text" : "password"} placeholder="New password (min 6 chars)"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: 52 }} />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 12 }}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        {msg && <p style={{ fontSize: 13, color: msg === "Saved!" ? "var(--color-primary)" : "var(--error-red)", margin: 0 }}>{msg}</p>}
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

const VAPID_PUBLIC_KEY = "BFfb98U0f0zXJaGdF9Tx7Sm7WkgGztyMxM701qNeJyMbOKJiKfGiPYov0CLCiihusSIOtbSTs-h_Z5JdOrBXiF0";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function SettingsView({
  userData,
  setDailyGoal,
  resetProgress,
  userSettings,
}: {
  userData: UserData;
  setDailyGoal: (goal: number) => void;
  resetProgress: () => void;
  userSettings: ReturnType<typeof useUserSettings>;
}) {
  // Read initial values from Supabase-backed settings (with localStorage fallback)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(userSettings.settings.soundEnabled);
  const [selectedGoal, setSelectedGoal] = useState<number>(userSettings.settings.dailyGoal);

  // Sync when remote settings load
  useEffect(() => {
    if (userSettings.loaded) {
      setSoundEnabled(userSettings.settings.soundEnabled);
      setSelectedGoal(userSettings.settings.dailyGoal);
    }
  }, [userSettings.loaded, userSettings.settings.soundEnabled, userSettings.settings.dailyGoal]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Check current push subscription status on mount
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          setPushEnabled(!!sub);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (pushEnabled) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", sub.endpoint);
            }
            await sub.unsubscribe();
          }
        }
        setPushEnabled(false);
      } else {
        // Subscribe
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setPushLoading(false); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const key = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        if (key && auth) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from("push_subscriptions").upsert({
              user_id: user.id,
              endpoint: sub.endpoint,
              p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
              auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
            }, { onConflict: "user_id,endpoint" });
          }
        }
        setPushEnabled(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    }
    setPushLoading(false);
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    // Persist to Supabase + localStorage via hook
    void userSettings.setSoundEnabled(next);
  };

  const handleGoal = (g: number) => {
    setSelectedGoal(g);
    setDailyGoal(g);
    // Persist to Supabase + localStorage via hook
    void userSettings.setDailyGoal(g);
  };

  const Row = ({ icon, label, sub, children }: { icon: React.ReactNode; label: string; sub?: string; children?: React.ReactNode }) => (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "var(--color-primary)" }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <main className="main-content main-with-stats">
      <h2 className="text-gray-900 dark:text-gray-100" style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Settings</h2>

      {/* ── Learning ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 8 }}>Learning</div>

      {/* Sound toggle */}
      <Row icon={<Zap size={18} />} label="Sound effects" sub="Plays on correct / incorrect answers">
        <button
          role="switch"
          aria-checked={soundEnabled}
          onClick={handleSoundToggle}
          style={{
            width: 48, height: 28, borderRadius: 14,
            background: soundEnabled ? "var(--color-primary)" : "var(--color-border)",
            border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: 3, left: soundEnabled ? 23 : 3, width: 22, height: 22,
            borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            transition: "left 0.2s",
          }} />
        </button>
      </Row>

      {/* Push notifications toggle */}
      {"serviceWorker" in (typeof navigator !== "undefined" ? navigator : {}) && (
        <Row icon={<Bell size={18} />} label="Push notifications" sub="Daily lesson reminders & budget alerts">
          <button
            role="switch"
            aria-checked={pushEnabled}
            onClick={handlePushToggle}
            disabled={pushLoading}
            style={{
              width: 48, height: 28, borderRadius: 14,
              background: pushEnabled ? "var(--color-primary)" : "var(--color-border)",
              border: "none", cursor: pushLoading ? "wait" : "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
              opacity: pushLoading ? 0.6 : 1,
            }}
          >
            <span style={{
              position: "absolute", top: 3, left: pushEnabled ? 23 : 3, width: 22, height: 22,
              borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              transition: "left 0.2s",
            }} />
          </button>
        </Row>
      )}

      {/* Dark mode toggle */}
      {/* dark mode now follows system preference automatically */}

      {/* Daily goal */}
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ color: "var(--color-primary)" }}><Target size={18} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>Daily XP Goal</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>How much XP you aim to earn per day</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[25, 50, 100, 200].map((g) => (
            <button
              key={g}
              onClick={() => handleGoal(g)}
              style={{
                padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1.5px solid",
                borderColor: selectedGoal === g ? "var(--color-primary)" : "var(--color-border)",
                background: selectedGoal === g ? "var(--color-primary)" : "transparent",
                color: selectedGoal === g ? "white" : "var(--color-text-secondary)",
                transition: "all 0.15s",
              }}
            >{g} XP</button>
          ))}
        </div>
      </div>

      {/* ── Account ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Account</div>
      <SettingsAccountSection />

      {/* ── Support ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Support</div>
      <a href="https://wealthwithkwanele.co.za" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <Row icon={<Shield size={18} />} label="Help and consultations" sub="Book or enquire via the official site">
          <ArrowLeft size={16} style={{ transform: "rotate(180deg)", color: "var(--color-text-secondary)" }} />
        </Row>
      </a>

      {/* ── About ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>About</div>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "20px 16px", textAlign: "center", marginBottom: 8,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
          <span style={{ color: "var(--color-primary)" }}>Fundi </span>
          <span style={{ color: "var(--color-secondary)" }}>Finance</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55, marginBottom: 8 }}>
          A Duolingo-style financial literacy app for South Africans.
        </p>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Version 1.0.0</div>
      </div>

      {/* ── Data management ── */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", margin: "20px 0 8px" }}>Data</div>
      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      }}>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 12, fontSize: 13 }}>
          Warning: This will permanently delete all your progress.
        </p>
        <button
          className="btn btn-secondary"
          style={{ background: "var(--error-red)", color: "white", border: "none" }}
          onClick={resetProgress}
        >
          Reset All Progress
        </button>
      </div>
    </main>
  );
}

function DarkModeToggle({ userSettings }: { userSettings: ReturnType<typeof useUserSettings> }) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("fundi-dark-mode");
    if (stored === "true") return true;
    if (stored === "false") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Sync from Supabase when settings load
  useEffect(() => {
    if (!userSettings.loaded) return;
    const remote = userSettings.settings.darkMode;
    if (remote !== null) setDark(remote);
  }, [userSettings.loaded, userSettings.settings.darkMode]);

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("fundi-dark-mode", String(dark));
  }, [dark]);

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <Moon size={18} style={{ color: "var(--color-primary)" }} aria-hidden />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Easier on your eyes at night</div>
      </div>
      <button
        role="switch"
        aria-checked={dark}
        onClick={() => {
          const next = !dark;
          setDark(next);
          // Persist to Supabase + localStorage via hook
          void userSettings.setDarkMode(next);
        }}
        style={{
          width: 48, height: 28, borderRadius: 14,
          background: dark ? "var(--color-primary)" : "var(--color-border)",
          border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: dark ? 23 : 3, width: 22, height: 22,
          borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }} />
      </button>
    </div>
  );
}

function routePageLabel(route: Route): string {
  switch (route.name) {
    case "learn":
      return "learn";
    case "quests":
      return "quests";
    case "course":
      return `course:${route.courseId}`;
    case "lesson":
      return `lesson:${route.courseId}/${route.lessonId}`;
    case "profile":
      return "profile";
    case "leaderboard":
      return "leaderboard";
    case "settings":
      return "settings";
    case "calculator":
      return "calculator";
    case "onboarding":
      return "onboarding";
    default:
      return "unknown";
  }
}

export default function Home() {
  const {
    userId,
    progressReady,
    userData,
    dailyXP,
    dailyGoal,
    setDailyGoal,
    resetProgress: resetProgressState,
    route,
    setRoute,
    isLessonCompleted,
    completedLessons,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
    hearts,
    maxHearts,
    loseHeart,
    gainHeart,
    heartsRegenInfo,
    newlyEarnedBadges,
    setNewlyEarnedBadges,
    xpToast,
    // Add these lines
    reviewAnswers,
    setReviewAnswers,
    weeklyChallenge,
    weeklyProgress,
    setWeeklyProgress,
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    setChallengeRewardClaimed,
    claimChallengeReward,
    addXP,
    setChallengeProgress,
    setDailyXP,
    showNoHearts,
    setShowNoHearts,
    tryDeductXp,
    persistWeeklyChallengeCompletion,
    freezeCount,
    buyStreakFreeze,
    useFreeze,
    weeklyXp,
    lessonSummary,
    setLessonSummary,
    userSettings,
  } = useFundiState();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1200);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Streak freeze - count-based, powered by useProgress hook
  const [freezeUsedToday, setFreezeUsedToday] = useState(false);

  // ── Register service worker for offline support ───────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {/* silent - no SW support or HTTPS required */});
  }, []);

  // ── Offline detection ─────────────────────────────────────────────────────
  const [isOffline, setIsOffline] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ── PWA Add to Home Screen prompt ─────────────────────────────────────
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Don't show if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if dismissed before
    if (localStorage.getItem("fundi-a2hs-dismissed") === "true") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setDeferredInstallPrompt(null);
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  const [showMilestoneCta, setShowMilestoneCta] = useState(false);
  const [milestoneCtaContent, setMilestoneCtaContent] = useState<{
    headline: string;
    body: string;
    button: string;
  }>({
    headline: "5 Lessons Completed",
    body: "You now know more about your money than most South Africans. Want a personalised plan to reach your first R10k emergency fund or start investing?",
    button: "Get Your Free R10k Savings Plan",
  });
  const [savedProgress, setSavedProgress] = useState<SavedLessonProgress | null>(null);
  const lessonStartTimeRef = useRef(0);
  const lessonHeartLostRef = useRef(false);
  const lessonStateRef = useRef(currentLessonState);
  const isFinalizingRef = useRef(false);
  lessonStateRef.current = currentLessonState;

  const beginLessonSession = React.useCallback(
    (courseId: string, lessonId: string, lessonTitle: string) => {
      lessonStartTimeRef.current = Date.now();
      lessonHeartLostRef.current = false;
      isFinalizingRef.current = false; // reset for fresh lesson
      analytics.lessonStarted(courseId, lessonId, lessonTitle);
    },
    []
  );

  const resumeLesson = React.useCallback(
    (progress: SavedLessonProgress) => {
      const course = CONTENT_DATA.courses.find((c) => c.id === progress.courseId);
      if (!course) return;
      let found: Lesson | undefined;
      for (const unit of course.units) {
        const lesson = unit.lessons.find((l) => l.id === progress.lessonId);
        if (lesson) {
          found = lesson;
          break;
        }
      }
      if (!found?.steps?.length) return;
      if (hearts <= 0) {
        setShowNoHearts(true);
        return;
      }
      const stepIdx = Math.min(
        Math.max(0, progress.stepIndex),
        found.steps.length - 1
      );
      lessonStartTimeRef.current = Date.now();
      lessonHeartLostRef.current = false;
      setCurrentLessonState({
        courseId: progress.courseId,
        lessonId: progress.lessonId,
        stepIndex: stepIdx,
        steps: found.steps,
        answers: {},
        correctCount: 0,
      });
      setRoute({ name: "lesson", courseId: progress.courseId, lessonId: progress.lessonId });
      setSavedProgress(null);
      localStorage.removeItem("fundi-lesson-progress");
    },
    [hearts, setCurrentLessonState, setRoute, setShowNoHearts]
  );

  const [weeklyChallengeCelebration, setWeeklyChallengeCelebration] = useState<{
    bonusXP: number;
    description: string;
  } | null>(null);
  const [courseCompleteModal, setCourseCompleteModal] = useState<
    (typeof COURSE_BADGES)[string] | null
  >(null);
  const [modalQueue, setModalQueue] = useState<string[]>([]);

  const enqueueModal = React.useCallback((modalId: string) => {
    setModalQueue((prev) => (prev.includes(modalId) ? prev : [...prev, modalId]));
  }, []);

  const removeModalFromQueue = React.useCallback((modalId: string) => {
    setModalQueue((prev) => prev.filter((id) => id !== modalId));
  }, []);

  const activeModal = modalQueue[0] ?? null;

  const [courseBadgeIds, setCourseBadgeIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "fundi-earned-badges" && e.newValue) {
        try {
          setCourseBadgeIds(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (showNoHearts) enqueueModal("no-hearts");
    else removeModalFromQueue("no-hearts");
  }, [showNoHearts, enqueueModal, removeModalFromQueue]);

  useEffect(() => {
    if (showMilestoneCta) enqueueModal("milestone-cta");
    else removeModalFromQueue("milestone-cta");
  }, [showMilestoneCta, enqueueModal, removeModalFromQueue]);

  useEffect(() => {
    if (reviewAnswers) enqueueModal("review-answers");
    else removeModalFromQueue("review-answers");
  }, [reviewAnswers, enqueueModal, removeModalFromQueue]);

  useEffect(() => {
    if (weeklyChallengeCelebration) enqueueModal("weekly-celebration");
    else removeModalFromQueue("weekly-celebration");
  }, [weeklyChallengeCelebration, enqueueModal, removeModalFromQueue]);

  useEffect(() => {
    if (courseCompleteModal) enqueueModal("course-complete");
    else removeModalFromQueue("course-complete");
  }, [courseCompleteModal, enqueueModal, removeModalFromQueue]);

  useEffect(() => {
    if (newlyEarnedBadges.length > 0) enqueueModal("badge-earned");
    else removeModalFromQueue("badge-earned");
  }, [newlyEarnedBadges, enqueueModal, removeModalFromQueue]);

  useEffect(() => {
    analytics.pageViewed(routePageLabel(route));
  }, [route]);

  // Retention ping: fire once per cohort day after signup
  // Uses Supabase profiles for cross-device deduplication, falls back to localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const runRetentionPing = async () => {
      let signupTs: number;
      let firedStr: string;

      // Try to get/set from Supabase first for cross-device accuracy
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("signup_ts, retention_fired")
          .eq("user_id", user.id)
          .maybeSingle()
          .then((r) => r, () => ({ data: null }));

        if (prof?.signup_ts) {
          signupTs = Number(prof.signup_ts);
          localStorage.setItem("fundi-signup-ts", String(signupTs));
        } else {
          // First time: record signup in both places
          signupTs = parseInt(localStorage.getItem("fundi-signup-ts") ?? "0", 10) || Date.now();
          localStorage.setItem("fundi-signup-ts", String(signupTs));
          await supabase.from("profiles")
            .update({ signup_ts: signupTs, retention_fired: "" } as any)
            .eq("user_id", user.id)
            .then(() => {}, () => {});
        }
        firedStr = prof?.retention_fired ?? localStorage.getItem("fundi-retention-fired") ?? "";
      } else {
        const raw = localStorage.getItem("fundi-signup-ts");
        if (!raw) {
          localStorage.setItem("fundi-signup-ts", String(Date.now()));
          return;
        }
        signupTs = parseInt(raw, 10);
        firedStr = localStorage.getItem("fundi-retention-fired") ?? "";
      }

      const hoursSince = (Date.now() - signupTs) / 3_600_000;
      const fired = new Set(firedStr.split(",").filter(Boolean));
      let changed = false;
      if (hoursSince >= 1 && !fired.has("day1")) {
        analytics.retentionPing(Math.floor(hoursSince / 24), "day1");
        fired.add("day1"); changed = true;
      }
      if (hoursSince >= 168 && !fired.has("day7")) {
        analytics.retentionPing(Math.floor(hoursSince / 24), "day7");
        fired.add("day7"); changed = true;
      }
      if (hoursSince >= 720 && !fired.has("day30")) {
        analytics.retentionPing(Math.floor(hoursSince / 24), "day30");
        fired.add("day30"); changed = true;
      }
      if (changed) {
        const newFiredStr = Array.from(fired).join(",");
        localStorage.setItem("fundi-retention-fired", newFiredStr);
        if (user) {
          await supabase.from("profiles")
            .update({ retention_fired: newFiredStr } as any)
            .eq("user_id", user.id)
            .then(() => {}, () => {});
        }
      }
    };
    runRetentionPing().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("fundi-lesson-progress");
    if (!raw) return;
    try {
      const progress = JSON.parse(raw) as SavedLessonProgress;
      const age = Date.now() - progress.savedAt;
      if (age < 24 * 60 * 60 * 1000) {
        const title = getLessonTitle(progress.courseId, progress.lessonId);
        setSavedProgress({ ...progress, lessonTitle: title ?? progress.lessonTitle });
      } else {
        localStorage.removeItem("fundi-lesson-progress");
      }
    } catch {
      localStorage.removeItem("fundi-lesson-progress");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (
      route.name !== "lesson" ||
      !currentLessonState.courseId ||
      !currentLessonState.lessonId
    ) {
      return;
    }
    const title = getLessonTitle(
      currentLessonState.courseId,
      currentLessonState.lessonId
    );
    localStorage.setItem(
      "fundi-lesson-progress",
      JSON.stringify({
        courseId: currentLessonState.courseId,
        lessonId: currentLessonState.lessonId,
        lessonTitle: title,
        stepIndex: currentLessonState.stepIndex,
        savedAt: Date.now(),
      })
    );
  }, [
    route.name,
    currentLessonState.courseId,
    currentLessonState.lessonId,
    currentLessonState.stepIndex,
  ]);

  // Weekly XP tracking is now handled entirely by useProgress hook (fundi-week-key / fundi-weekly-xp)

  // Cross-device sync, fetch latest progress from Supabase and hydrate localStorage
  useEffect(() => {
    const syncFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Sync personal goal + description from profiles table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("goal, goal_description, age_range, username")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData?.goal) {
        localStorage.setItem("fundi-user-goal", profileData.goal);
        if (profileData.goal_description) localStorage.setItem("fundi-goal-description", profileData.goal_description);
        if (profileData.age_range) localStorage.setItem("fundi-age-range", profileData.age_range);
        // Dispatch storage event so userGoal state in Home component re-reads localStorage
        window.dispatchEvent(new StorageEvent("storage", { key: "fundi-user-goal", newValue: profileData.goal }));
      }
      if (profileData?.username) {
        localStorage.setItem("fundi-username", profileData.username);
      }

      const { data } = await supabase
        .from("user_progress")
        .select("xp, streak, completed_lessons, last_activity_date, weekly_xp, week_key, hearts, earned_badges, badges, daily_xp_today, daily_xp_date, daily_lessons_today, daily_lessons_date, perfect_today, perfect_today_date, perfect_lessons_total, first_lesson_fired, milestone_cta_shown, weekly_challenge_progress, expense_today, expense_today_date, budget_visited_date")
        .eq("user_id", user.id)
        .single();
      if (!data) return;
      // Only overwrite localStorage if Supabase has more progress
      const localXP = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
      if (data.xp > localXP) {
        localStorage.setItem("fundi-xp", String(data.xp));
      }
      const localStreak = parseInt(localStorage.getItem("fundi-streak") ?? "0", 10);
      if (data.streak > localStreak) {
        localStorage.setItem("fundi-streak", String(data.streak));
      }
      // Restore today's XP from Supabase if localStorage was wiped
      const todayIso = new Date().toISOString().slice(0, 10);
      const localDailyXp = parseInt(localStorage.getItem(`fundi-daily-xp-${todayIso}`) ?? "0", 10);
      if (localDailyXp === 0 && ((data as any).daily_xp_today ?? 0) > 0 && (data as any).daily_xp_date === todayIso) {
        localStorage.setItem(`fundi-daily-xp-${todayIso}`, String((data as any).daily_xp_today));
        setDailyXP((data as any).daily_xp_today);
      } else {
        setDailyXP(Number.isNaN(localDailyXp) ? 0 : localDailyXp);
      }
      if (data.completed_lessons && Array.isArray(data.completed_lessons)) {
        const localRaw = localStorage.getItem("fundi-completed-lessons");
        const localSet: string[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = Array.from(new Set([...localSet, ...data.completed_lessons]));
        localStorage.setItem("fundi-completed-lessons", JSON.stringify(merged));
      }
      const remoteEarnedBadges = [
        ...(((data as any).earned_badges as string[] | null) ?? []),
        ...(((data as any).badges as string[] | null) ?? []),
      ];
      if (remoteEarnedBadges.length > 0) {
        const localBadgeIds = JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]") as string[];
        const mergedBadges = Array.from(new Set([...localBadgeIds, ...remoteEarnedBadges]));
        localStorage.setItem("fundi-earned-badges", JSON.stringify(mergedBadges));
        setCourseBadgeIds(mergedBadges);
      }

      // Restore daily counters from Supabase if localStorage was wiped (new device)
      const todayDate = new Date().toISOString().slice(0, 10);
      if ((data as any).daily_lessons_date === todayDate) {
        const remDailyLessons = Number((data as any).daily_lessons_today ?? 0);
        const locDailyLessons = parseInt(localStorage.getItem(`fundi-lessons-today-${todayDate}`) ?? "0", 10);
        if (remDailyLessons > locDailyLessons) {
          localStorage.setItem(`fundi-lessons-today-${todayDate}`, String(remDailyLessons));
          localStorage.setItem(`fundi-daily-lessons-${todayDate}`, String(remDailyLessons));
        }
      }
      if ((data as any).perfect_today_date === todayDate) {
        const remPerfectToday = Number((data as any).perfect_today ?? 0);
        const locPerfectToday = parseInt(localStorage.getItem(`fundi-perfect-today-${todayDate}`) ?? "0", 10);
        if (remPerfectToday > locPerfectToday) {
          localStorage.setItem(`fundi-perfect-today-${todayDate}`, String(remPerfectToday));
        }
      }
      if ((data as any).expense_today_date === todayDate) {
        const remExpenseToday = Number((data as any).expense_today ?? 0);
        const locExpenseToday = parseInt(localStorage.getItem(`fundi-expense-today-${todayDate}`) ?? "0", 10);
        if (remExpenseToday > locExpenseToday) {
          localStorage.setItem(`fundi-expense-today-${todayDate}`, String(remExpenseToday));
        }
      }
      if ((data as any).budget_visited_date === todayDate) {
        localStorage.setItem(`fundi-budget-visited-${todayDate}`, "1");
      }
      const remPerfectTotal = Number((data as any).perfect_lessons_total ?? 0);
      const locPerfectTotal = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
      if (remPerfectTotal > locPerfectTotal) {
        localStorage.setItem("fundi-perfect-lessons", String(remPerfectTotal));
      }

      // Restore analytics flags (prevent re-firing on new device)
      if ((data as any).first_lesson_fired) {
        localStorage.setItem("fundi-first-lesson-fired", "1");
      }
      if ((data as any).milestone_cta_shown) {
        localStorage.setItem("fundi-cta-milestone-shown", "1");
      }

      // Restore weekly challenge progress from Supabase
      const remoteChallengeProgress = (data as any).weekly_challenge_progress as Record<string, unknown> | null;
      if (remoteChallengeProgress) {
        const wc = weeklyChallenge;
        const remoteWcState = remoteChallengeProgress[wc.id] as {
          lessonsCompleted?: number; xpEarned?: number; perfectLessons?: number;
          dailyXp?: number; completed?: boolean;
        } | undefined;
        if (remoteWcState) {
          const localRaw = localStorage.getItem(`fundi-wc-${wc.id}`);
          let localWcState = { lessonsCompleted: 0, completed: false };
          try { if (localRaw) localWcState = JSON.parse(localRaw); } catch { /* ignore */ }
          // Take whichever has more progress
          if ((remoteWcState.lessonsCompleted ?? 0) > localWcState.lessonsCompleted || remoteWcState.completed) {
            localStorage.setItem(`fundi-wc-${wc.id}`, JSON.stringify(remoteWcState));
            if (remoteWcState.completed) {
              localStorage.setItem(`fundi-wc-claimed-${wc.id}`, "true");
            }
          }
        }
      }

      // Weekly XP is fully managed by useProgress hook - no cross-device sync needed here
    };
    syncFromSupabase().catch(() => {}); // silent fail, offline is fine
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;

  const currentCourseIndex = currentCourse
    ? CONTENT_DATA.courses.findIndex((c) => c.id === currentCourse.id)
    : -1;
  const nextCourseInList =
    currentCourseIndex >= 0 && currentCourseIndex < CONTENT_DATA.courses.length - 1
      ? CONTENT_DATA.courses[currentCourseIndex + 1]
      : null;

  // Ref to hold next lesson across async badge modal
  const nextLessonRef = React.useRef<Lesson | null>(null);

  // Ref tracking the last completed lesson — used to detect budget-opens post-lesson
  const lastCompletedLessonRef = React.useRef<{ courseId: string; lessonId: string } | null>(null);

  const handleNav = (name: Route["name"]) => {
    if (name === "learn") setRoute({ name: "learn" });
    if (name === "quests") setRoute({ name: "quests" });
    if (name === "calculator") setRoute({ name: "calculator" });
    if (name === "profile") setRoute({ name: "profile" });
    if (name === "leaderboard") setRoute({ name: "leaderboard" });
    if (name === "settings") setRoute({ name: "settings" });
    if (name === "budget") {
      setRoute({ name: "budget" });
      // Behavioral outcome: detect if user opens budget planner after a budget-related lesson
      const last = lastCompletedLessonRef.current;
      if (last && BUDGET_RELATED_COURSE_IDS.has(last.courseId)) {
        analytics.budgetOpenedPostLesson(last.courseId, last.lessonId);
        void trackBehaviorEvent("budget_opened_post_lesson");
        // Clear so we don't double-fire on subsequent budget visits
        lastCompletedLessonRef.current = null;
      }
    }
  };

  // ── Find the next playable lesson after the current one ──────────────────
  const getNextLesson = (courseId: string, lessonId: string): Lesson | null => {
    const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
    if (!course) return null;
    const allLessons: Lesson[] = course.units.flatMap((u) =>
      u.lessons.filter((l) => !l.comingSoon)
    );
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return null;
    for (let i = currentIndex + 1; i < allLessons.length; i++) {
      const candidate = allLessons[i];
      if (candidate.steps && candidate.steps.length > 0) return candidate;
    }
    return null;
  };

  // ── Start a specific lesson (used for auto-advance) ──────────────────────
  const startLesson = (courseId: string, lesson: Lesson) => {
    if (!lesson.steps || lesson.steps.length === 0) return;
    if (hearts <= 0) {
      setShowNoHearts(true);
      return;
    }
    beginLessonSession(courseId, lesson.id, lesson.title);
    setCurrentLessonState({
      courseId,
      lessonId: lesson.id,
      stepIndex: 0,
      steps: lesson.steps,
      answers: {},
      correctCount: 0,
    });
    setRoute({ name: "lesson", courseId, lessonId: lesson.id });
  };

  const bumpWeeklyChallengeProgress = (
    wc: { id: string; unit: string; target: number; xp: number; text: string },
    payload: { xpEarned: number; isPerfect: boolean }
  ) => {
    if (typeof window === "undefined") return;
    const key = `fundi-wc-${wc.id}`;
    const raw = localStorage.getItem(key);
    type WCState = {
      lessonsCompleted: number;
      xpEarned: number;
      perfectLessons: number;
      dailyXp: number;
      completed: boolean;
      streakDaysThisWeek: number;
      lastLessonDay: string;
    };
    let state: WCState = {
      lessonsCompleted: 0,
      xpEarned: 0,
      perfectLessons: 0,
      dailyXp: 0,
      completed: false,
      streakDaysThisWeek: 0,
      lastLessonDay: "",
    };
    if (raw) {
      try {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && String(n).trim() === raw.trim()) {
          state.lessonsCompleted = n;
        } else {
          state = { ...state, ...JSON.parse(raw) };
        }
      } catch {
        /* ignore */
      }
    }
    const today = new Date().toISOString().slice(0, 10); // ISO format: YYYY-MM-DD
    const dailyKey = `fundi-daily-xp-${today}`;
    const dailyXpSoFar =
      parseInt(localStorage.getItem(dailyKey) ?? "0", 10) + payload.xpEarned;
    localStorage.setItem(dailyKey, String(dailyXpSoFar));

    const dailyLessonsKey = `fundi-daily-lessons-${today}`;
    const prevLessons = parseInt(localStorage.getItem(dailyLessonsKey) ?? "0", 10);
    localStorage.setItem(dailyLessonsKey, String(prevLessons + 1));

    state.lessonsCompleted += 1;
    state.xpEarned += payload.xpEarned;
    state.perfectLessons += payload.isPerfect ? 1 : 0;
    state.dailyXp = dailyXpSoFar;

    // Track distinct lesson-days this week for streak_days challenge
    if (state.lastLessonDay !== today) {
      state.streakDaysThisWeek += 1;
      state.lastLessonDay = today;
    }

    let progressVal = 0;
    if (wc.unit === "lessons") progressVal = state.lessonsCompleted;
    else if (wc.unit === "perfect") progressVal = state.perfectLessons;
    else if (wc.unit === "daily_xp") progressVal = state.dailyXp;
    else if (wc.unit === "streak_days") progressVal = state.streakDaysThisWeek;

    const meets =
      wc.unit === "lessons"
        ? state.lessonsCompleted >= wc.target
        : wc.unit === "perfect"
          ? state.perfectLessons >= wc.target
          : wc.unit === "daily_xp"
            ? state.dailyXp >= wc.target
            : state.streakDaysThisWeek >= wc.target;

    // Persist weekly challenge progress to Supabase for cross-device sync
    const syncWeeklyProgressToSupabase = (s: typeof state) => {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        const { data: row } = await supabase
          .from("user_progress")
          .select("weekly_challenge_progress")
          .eq("user_id", user.id)
          .maybeSingle();
        const current = (row?.weekly_challenge_progress as Record<string, unknown> | null) ?? {};
        await supabase.from("user_progress").upsert({
          user_id: user.id,
          weekly_challenge_progress: { ...current, [wc.id]: s },
        }, { onConflict: "user_id" });
      }).catch(() => {});
    };

    if (meets && !state.completed) {
      analytics.challengeCompleted(wc.text, wc.xp);
      state.completed = true;
      localStorage.setItem(key, JSON.stringify(state));
      syncWeeklyProgressToSupabase(state);
      setChallengeProgress(wc.target);
      void persistWeeklyChallengeCompletion(wc.id, wc.xp);
      const claimed = localStorage.getItem(`fundi-wc-claimed-${wc.id}`) === "true";
      if (!claimed) {
        localStorage.setItem(`fundi-wc-claimed-${wc.id}`, "true");
        setChallengeRewardClaimed(true);
        setWeeklyChallengeCelebration({ bonusXP: wc.xp, description: wc.text });
        addXP(wc.xp);
        setDailyXP((v) => v + wc.xp);
      }
    } else {
      localStorage.setItem(key, JSON.stringify(state));
      syncWeeklyProgressToSupabase(state);
      setChallengeProgress(Math.min(progressVal, wc.target));
    }
    setWeeklyProgress({
      lessonsCompleted: state.lessonsCompleted,
      xpEarned: state.xpEarned,
      perfectLessons: state.perfectLessons,
      dailyXp: state.dailyXp,
      completed: state.completed,
      streakDaysThisWeek: state.streakDaysThisWeek,
      lastLessonDay: state.lastLessonDay,
    });
  };

  const getAwardedBadgeIds = async (): Promise<Set<string>> => {
    const localBadges = JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]") as string[];
    const awarded = new Set(localBadges);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return awarded;
      const { data } = await supabase
        .from("user_progress")
        .select("earned_badges,badges")
        .eq("user_id", user.id)
        .maybeSingle();
      const dbBadges = [
        ...(((data as any)?.earned_badges as string[] | null) ?? []),
        ...(((data as any)?.badges as string[] | null) ?? []),
      ];
      dbBadges.forEach((badgeId) => awarded.add(badgeId));
      if (dbBadges.length > localBadges.length) {
        localStorage.setItem("fundi-earned-badges", JSON.stringify(Array.from(awarded)));
      }
    } catch {
      // Ignore network/auth issues and rely on local cache.
    }
    return awarded;
  };

  const persistEarnedBadges = async (badges: string[]) => {
    const uniqueBadges = Array.from(new Set(badges));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_progress")
      .upsert(
        { user_id: user.id, earned_badges: uniqueBadges as unknown as string[], badges: uniqueBadges as unknown as string[] },
        { onConflict: "user_id" }
      );
  };

  const checkCourseBadgeEarned = async (courseId: string, lessonId: string) => {
    const course = CONTENT_DATA.courses.find((x) => x.id === courseId);
    if (!course) return;
    const lessonIds = course.units.flatMap((u) =>
      u.lessons.filter((l) => !l.comingSoon).map((l) => l.id)
    );
    const allDone = lessonIds.every((lid) =>
      lid === lessonId ? true : isLessonCompleted(courseId, lid)
    );
    if (!allDone) return;
    const badge = COURSE_BADGES[courseId];
    if (!badge) return;
    const awardedBadges = await getAwardedBadgeIds();
    if (awardedBadges.has(badge.id)) return;
    analytics.courseCompleted(courseId, course.title, badge.name);
    analytics.badgeEarned(badge.id, badge.name);
    const next = [...awardedBadges, badge.id];
    localStorage.setItem("fundi-earned-badges", JSON.stringify(next));
    setCourseBadgeIds(next);
    await persistEarnedBadges(next);
    const refreshed = await getAwardedBadgeIds();
    if (!refreshed.has(badge.id)) return;
    setCourseCompleteModal(badge);
  };

  const finalizeCurrentLesson = async (choice: "next" | "course") => {
    // Prevent double-tap on Done from awarding XP multiple times
    if (isFinalizingRef.current) return;
    isFinalizingRef.current = true;

    const baseXP = 50;
    const totalXP = baseXP + currentLessonState.correctCount * 10;
    if (!currentLessonState.courseId || !currentLessonState.lessonId) {
      isFinalizingRef.current = false;
      return;
    }

    const totalQuestions = currentLessonState.steps.filter(
      (s) =>
        s.type === "mcq" ||
        s.type === "true-false" ||
        s.type === "scenario" ||
        s.type === "fill-blank"
    ).length;
    const isPerfect =
      totalQuestions > 0 && currentLessonState.correctCount === totalQuestions;

    const lessonTitleDone =
      getLessonTitle(currentLessonState.courseId, currentLessonState.lessonId) ?? "";
    analytics.lessonCompleted(
      currentLessonState.courseId,
      currentLessonState.lessonId,
      lessonTitleDone,
      {
        xpEarned: totalXP,
        isPerfect,
        timeSeconds: Math.round((Date.now() - lessonStartTimeRef.current) / 1000),
        heartLost: lessonHeartLostRef.current,
      }
    );

    const streakAfterLesson = await completeLesson(
      currentLessonState.courseId,
      currentLessonState.lessonId,
      totalXP
    );

    if (typeof window !== "undefined") {
      localStorage.removeItem("fundi-lesson-progress");
    }
    setSavedProgress(null);
    if (isPerfect) {
      const prev = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
      const newPerfectTotal = prev + 1;
      localStorage.setItem("fundi-perfect-lessons", String(newPerfectTotal));
      if (hearts < maxHearts) gainHeart();
    }
    // Track daily challenge progress + first-lesson analytics
    if (typeof window !== "undefined") {
      const isoDay = new Date().toISOString().slice(0, 10);

      // Daily lesson counter
      const lessonsKey = `fundi-lessons-today-${isoDay}`;
      const newLessonCount = (parseInt(localStorage.getItem(lessonsKey) ?? "0", 10)) + 1;
      localStorage.setItem(lessonsKey, String(newLessonCount));

      // Daily perfect counter
      const perfTodayKey = `fundi-perfect-today-${isoDay}`;
      const newPerfectToday = isPerfect
        ? (parseInt(localStorage.getItem(perfTodayKey) ?? "0", 10)) + 1
        : parseInt(localStorage.getItem(perfTodayKey) ?? "0", 10);
      if (isPerfect) localStorage.setItem(perfTodayKey, String(newPerfectToday));

      // Daily XP
      const xpIsoKey = `fundi-daily-xp-${isoDay}`;
      const prev = parseInt(localStorage.getItem(xpIsoKey) ?? "0", 10);
      const newDailyXp = prev + totalXP;
      localStorage.setItem(xpIsoKey, String(newDailyXp));

      // Perfect lessons lifetime total
      const newPerfectTotal = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);

      // Persist all daily counters to Supabase for cross-device sync
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        const supabasePatch: Record<string, unknown> = {
          user_id: user.id,
          daily_xp_today: newDailyXp,
          daily_xp_date: isoDay,
          daily_lessons_today: newLessonCount,
          daily_lessons_date: isoDay,
          perfect_today: newPerfectToday,
          perfect_today_date: isoDay,
          perfect_lessons_total: newPerfectTotal,
        };

        // First lesson analytics flag
        if (!localStorage.getItem("fundi-first-lesson-fired")) {
          supabasePatch.first_lesson_fired = true;
        }

        // Milestone CTA flag
        const alreadyShownCta = localStorage.getItem("fundi-cta-milestone-shown");
        if (alreadyShownCta) supabasePatch.milestone_cta_shown = true;

        await supabase.from("user_progress").upsert(supabasePatch as any, { onConflict: "user_id" });

        // Fire first-lesson-completed analytics event once (inside getUser callback so user.id is available)
        if (!localStorage.getItem("fundi-first-lesson-fired")) {
          const courseIdForAnalytics = currentLessonState.courseId ?? "";
          void supabase.from("profiles").select("signup_ts").eq("user_id", user.id).maybeSingle().then(
            ({ data }) => {
              const signupTs = data?.signup_ts
                ? Number(data.signup_ts)
                : parseInt(localStorage.getItem("fundi-signup-ts") ?? String(Date.now()), 10);
              const hoursSince = (Date.now() - signupTs) / 3_600_000;
              analytics.firstLessonCompleted(Math.round(hoursSince * 10) / 10, courseIdForAnalytics);
            },
            () => {
              const signupTs = parseInt(localStorage.getItem("fundi-signup-ts") ?? String(Date.now()), 10);
              const hoursSince = (Date.now() - signupTs) / 3_600_000;
              analytics.firstLessonCompleted(Math.round(hoursSince * 10) / 10, courseIdForAnalytics);
            }
          );
          localStorage.setItem("fundi-first-lesson-fired", "1");
        }
      });
    }
    bumpWeeklyChallengeProgress(weeklyChallenge, { xpEarned: totalXP, isPerfect });

    playSound("complete");

    const reviewList: {
      question: string;
      yourAnswer: string;
      correct: string;
      wasCorrect: boolean;
    }[] = [];
    currentLessonState.steps.forEach((s: any, i: number) => {
      const ans = currentLessonState.answers[i];
      if (ans === undefined) return;
      if (s.type === "mcq" || s.type === "scenario") {
        const wasCorrect = ans === s.correct;
        if (!wasCorrect) {
          reviewList.push({
            question: s.question,
            yourAnswer: s.options?.[ans as number] ?? String(ans),
            correct: s.options?.[s.correct] ?? String(s.correct),
            wasCorrect,
          });
        }
      } else if (s.type === "true-false") {
        const wasCorrect = ans === s.correct;
        if (!wasCorrect) {
          reviewList.push({
            question: s.statement,
            yourAnswer: ans ? "True" : "False",
            correct: s.correct ? "True" : "False",
            wasCorrect,
          });
        }
      }
    });
    if (reviewList.length > 0) {
      setReviewAnswers(reviewList);
    }

    const tc = userData.totalCompleted + 1;
    if (typeof window !== "undefined") {
      const alreadyShown = localStorage.getItem("fundi-cta-milestone-shown");
      if (tc >= 5 && !alreadyShown) {
        localStorage.setItem("fundi-cta-milestone-shown", "1");
        // Build goal-specific CTA content
        const goal = localStorage.getItem("fundi-user-goal") ?? "";
        const courseId = currentLessonState.courseId ?? "";
        const ctaMap: Record<string, { headline: string; body: string; button: string }> = {
          "debt-free": {
            headline: "You're Serious About Getting Debt-Free",
            body: "You've built real knowledge. Let's turn it into a step-by-step debt-freedom plan tailored to your situation.",
            button: "Get Your Free Debt Plan",
          },
          emergency: {
            headline: "5 Lessons Down - Emergency Fund Next",
            body: "You understand why an emergency fund matters. Want a plan to actually build yours - how much, where to keep it, how fast?",
            button: "Get Your Free Emergency Fund Plan",
          },
          invest: {
            headline: "You're Ready to Start Investing",
            body: "You've learned the foundations. Get a personalised investment plan built around your income and timeline.",
            button: "Get Your Free Investment Plan",
          },
          home: {
            headline: "Saving for a Home? Let's Build the Plan",
            body: "You know how money works. Now let's map out exactly how to get to that deposit.",
            button: "Get Your Free Home Savings Plan",
          },
          retire: {
            headline: "Retirement Planning Starts Now",
            body: "The earlier you start, the bigger the difference. Get a retirement roadmap built around your age and income.",
            button: "Get Your Free Retirement Plan",
          },
          business: {
            headline: "Growing Your Business With Better Money Skills",
            body: "You've got the knowledge. Let's turn it into a practical business finance plan.",
            button: "Get Your Free Business Finance Plan",
          },
        };
        // Fall back to course-based CTA if no goal, or use goal CTA
        const debtCourses = ["credit-debt", "money-basics"];
        const investCourses = ["investing-basics", "sa-investing", "retirement"];
        let ctaContent = ctaMap[goal];
        if (!ctaContent) {
          if (debtCourses.includes(courseId)) ctaContent = ctaMap["debt-free"];
          else if (investCourses.includes(courseId)) ctaContent = ctaMap["invest"];
          else ctaContent = {
            headline: "5 Lessons Completed",
            body: "You now know more about your money than most South Africans. Want a personalised plan to reach your first R10k emergency fund or start investing?",
            button: "Get Your Free R10k Savings Plan",
          };
        }
        setMilestoneCtaContent(ctaContent);
        setTimeout(() => setShowMilestoneCta(true), 1500);
        analytics.advisorCtaShown("lesson_milestone_5");
      }
    }
    const str = streakAfterLesson ?? userData.streak;
    const xpv = userData.xp + totalXP;
    const perf = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
    const THRESHOLDS = [
      { id: "lesson-1-badge", test: tc >= 1, name: "First Step" },
      { id: "lesson-5-badge", test: tc >= 5, name: "Getting Going" },
      { id: "lesson-10-badge", test: tc >= 10, name: "On a Roll" },
      { id: "lesson-25-badge", test: tc >= 25, name: "Dedicated" },
      { id: "streak-3-badge", test: str >= 3, name: "3 Day Streak" },
      { id: "streak-7-badge", test: str >= 7, name: "Week Warrior" },
      { id: "xp-100-badge", test: xpv >= 100, name: "First 100" },
      { id: "xp-500-badge", test: xpv >= 500, name: "XP Builder" },
      { id: "perfect-1-badge", test: perf >= 1, name: "Flawless" },
    ];
    const awardedBadges = await getAwardedBadgeIds();
    const justEarned = THRESHOLDS.filter((b) => b.test && !awardedBadges.has(b.id)).map((b) => b.id);
    const nextLesson = getNextLesson(
      currentLessonState.courseId,
      currentLessonState.lessonId
    );

    await checkCourseBadgeEarned(
      currentLessonState.courseId,
      currentLessonState.lessonId
    );

    // Schedule spaced-repetition reviews for concepts in this course
    const conceptIds = getConceptIdsForCourse(currentLessonState.courseId ?? "");
    if (conceptIds.length > 0) {
      scheduleConceptsForCourse(conceptIds);
    }

    if (justEarned.length > 0) {
      const merged = Array.from(new Set([...awardedBadges, ...justEarned]));
      localStorage.setItem("fundi-earned-badges", JSON.stringify(merged));
      setCourseBadgeIds(merged);
      await persistEarnedBadges(merged);
      setNewlyEarnedBadges(justEarned);
      nextLessonRef.current = nextLesson;
      return;
    }

    // Show Duolingo-style lesson summary before navigating
    const elapsedSeconds = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
    const accuracy = totalQuestions > 0 ? Math.min(100, Math.round((currentLessonState.correctCount / totalQuestions) * 100)) : 0;
    // Record last completed lesson so budget-open post-lesson can be detected
    if (currentLessonState.courseId && currentLessonState.lessonId) {
      lastCompletedLessonRef.current = {
        courseId: currentLessonState.courseId,
        lessonId: currentLessonState.lessonId,
      };
    }
    setLessonSummary({
      xpEarned: totalXP,
      timeSeconds: elapsedSeconds,
      accuracy,
      streak: str,
      isPerfect,
      choice,
      nextLessonId: nextLesson?.id ?? null,
      courseId: currentLessonState.courseId,
      lessonId: currentLessonState.lessonId,
    });
  };

  const nextStep = () => {
    if (currentLessonState.stepIndex < currentLessonState.steps.length - 1) {
      const nextIdx = currentLessonState.stepIndex + 1;
      const nextStepData = currentLessonState.steps[nextIdx];
      // Track step view for abandonment analytics
      analytics.lessonStepViewed(
        currentLessonState.courseId ?? "",
        currentLessonState.lessonId ?? "",
        nextIdx,
        nextStepData?.type ?? "unknown",
        currentLessonState.steps.length
      );
      setCurrentLessonState((prev) => ({
        ...prev,
        stepIndex: nextIdx,
      }));
    }
  };

  // ── Action check handler ─────────────────────────────────────────────────
  React.useEffect(() => {
    (window as any).__actionCheckAnswer = (result: string) => {
      setCurrentLessonState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [prev.stepIndex]: result },
      }));
    };
  }, []);

  React.useEffect(() => {
    (window as any).__fillBlankSubmit = (val: string, correct: boolean) => {
      setCurrentLessonState((prev) => ({
        ...prev,
        answers: { ...prev.answers, [prev.stepIndex]: val },
        correctCount: correct ? prev.correctCount + 1 : prev.correctCount,
      }));
      playSound(correct ? "correct" : "incorrect");
      if (!correct) {
        const ls = lessonStateRef.current;
        lessonHeartLostRef.current = true;
        const st = ls.steps[ls.stepIndex];
        if (ls.courseId && ls.lessonId) {
          analytics.wrongAnswer(
            ls.courseId,
            ls.lessonId,
            ls.stepIndex,
            st?.type ?? "fill-blank"
          );
        }
        loseHeart();
      }
    };
  }, [loseHeart]);

  const answerQuestion = (index: number) => {
    const step = currentLessonState.steps[currentLessonState.stepIndex];
    if (step.type !== "mcq" && step.type !== "scenario") return;
    const isCorrect = index === step.correct;
    setCurrentLessonState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.stepIndex]: index },
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
    }));
    playSound(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) {
      lessonHeartLostRef.current = true;
      if (currentLessonState.courseId && currentLessonState.lessonId) {
        analytics.wrongAnswer(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          currentLessonState.stepIndex,
          step.type
        );
      }
      loseHeart();
    }
  };

  const answerTrueFalse = (value: boolean) => {
    const step = currentLessonState.steps[currentLessonState.stepIndex];
    if (step.type !== "true-false") return;
    const isCorrect = value === step.correct;
    setCurrentLessonState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [prev.stepIndex]: value },
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
    }));
    playSound(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) {
      lessonHeartLostRef.current = true;
      if (currentLessonState.courseId && currentLessonState.lessonId) {
        analytics.wrongAnswer(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          currentLessonState.stepIndex,
          "true-false"
        );
      }
      loseHeart();
    }
  };

  const handleResetProgress = () => {
    if (typeof window !== "undefined" && window.confirm("Reset all progress?")) {
      void resetProgressState();
      window.location.reload();
    }
  };

  const handleLessonExit = () => {
    if (
      currentLessonState.courseId &&
      currentLessonState.lessonId &&
      currentLessonState.steps.length > 0
    ) {
      analytics.lessonAbandoned(
        currentLessonState.courseId,
        currentLessonState.lessonId,
        currentLessonState.stepIndex,
        currentLessonState.steps.length
      );
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("fundi-lesson-progress");
    }
    setSavedProgress(null);
    if (currentLessonState.courseId) {
      setRoute({ name: "course", courseId: currentLessonState.courseId });
    } else {
      setRoute({ name: "learn" });
    }
  };

  const handleProfileSignOut = async () => {
    await supabase.auth.signOut();
    // Wipe all fundi- localStorage keys so a second user on this device
    // doesn't inherit the previous user's cached state
    if (typeof window !== "undefined") {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("fundi-")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      window.location.href = "/";
    }
  };

  const handleDownloadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // Collect localStorage data
    const lsData: Record<string, string> = {};
    if (typeof window !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("fundi-")) lsData[k] = localStorage.getItem(k) ?? "";
      }
    }
    // Collect Supabase data
    let profileData: Record<string, unknown> = {};
    let progressData: Record<string, unknown> = {};
    if (user) {
      const [{ data: p }, { data: pr }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      if (p) profileData = p as Record<string, unknown>;
      if (pr) progressData = pr as Record<string, unknown>;
    }
    const exportPayload = {
      exportDate: new Date().toISOString(),
      exportNote: "Your Fundi Finance data export - requested under POPIA Section 23 (Right of Access)",
      account: { email: user?.email ?? "guest" },
      profile: profileData,
      progress: progressData,
      localStorageSnapshot: lsData,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fundi-finance-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    // Delete Supabase records
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("user_progress").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("user_id", user.id);
      // Delete auth user via admin API if available, otherwise sign out
      await supabase.auth.signOut();
    }
    // Clear all localStorage
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
    window.location.href = "/";
  };

  // Handle onboarding complete
  const handleOnboardingComplete = async (payload: { goal?: string; ageRange?: string; goalDescription?: string; username: string }) => {
    localStorage.setItem("fundi-onboarded", "true");
    if (payload.goal) localStorage.setItem("fundi-user-goal", payload.goal);
    if (payload.goalDescription) localStorage.setItem("fundi-goal-description", payload.goalDescription);
    if (payload.ageRange) localStorage.setItem("fundi-age-range", payload.ageRange);
    localStorage.setItem("fundi-username", payload.username);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const username = normalizeUsername(payload.username);
      const available = await isUsernameAvailable(username, user.id);
      if (!available) return;
      const row: Record<string, unknown> = { user_id: user.id };
      if (payload.goal) row.goal = payload.goal;
      if (payload.goalDescription) row.goal_description = payload.goalDescription;
      if (payload.ageRange) row.age_range = payload.ageRange;
      row.username = username;
      if (row.goal ?? row.age_range ?? row.goal_description ?? row.username) {
        await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
      }
      await supabase.from("user_progress").upsert({ user_id: user.id, display_name: username }, { onConflict: "user_id" });
    }
    // Fire welcome email (non-blocking — user shouldn't wait for this).
    void supabase.functions.invoke("send-email", { body: { type: "welcome" } });
    // Auto-launch the first lesson of the user's goal course instead of
    // showing the course list. This removes the extra friction step.
    const firstCourseId = payload.goal ? (GOAL_COURSE_MAP[payload.goal]?.[0] ?? null) : null;
    if (firstCourseId) {
      const goalCourse = CONTENT_DATA.courses.find((c) => c.id === firstCourseId);
      const firstLesson = goalCourse?.units?.[0]?.lessons?.[0];
      if (firstLesson?.steps?.length) {
        startLesson(firstCourseId, firstLesson);
        return;
      }
    }
    setRoute({ name: "learn" } as Route);
  };

  const [needsUsernamePrompt, setNeedsUsernamePrompt] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernamePromptError, setUsernamePromptError] = useState<string | null>(null);
  const [usernamePromptChecking, setUsernamePromptChecking] = useState(false);
  const [usernamePromptSaving, setUsernamePromptSaving] = useState(false);

  useEffect(() => {
    if (!progressReady || !userId || route.name === "onboarding") return;
    // Check localStorage first — it's set synchronously during onboarding,
    // so there's no race condition. Only hit Supabase for users who somehow
    // arrived without going through onboarding (e.g. magic-link sign-in).
    const localUsername = localStorage.getItem("fundi-username");
    if (localUsername && localUsername.trim()) {
      setNeedsUsernamePrompt(false);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();
      const username = data?.username ? String(data.username).trim() : "";
      if (username) {
        // Sync to localStorage so future checks don't need a DB round-trip
        localStorage.setItem("fundi-username", username);
        setNeedsUsernamePrompt(false);
      } else {
        setNeedsUsernamePrompt(true);
      }
    })().catch(() => {});
  }, [progressReady, userId, route.name]);

  const saveUsernameFromPrompt = async () => {
    if (!userId) return;
    const normalized = normalizeUsername(usernameDraft);
    const formatError = validateUsername(normalized);
    if (formatError) {
      setUsernamePromptError(formatError);
      return;
    }
    setUsernamePromptError(null);
    setUsernamePromptChecking(true);
    const available = await isUsernameAvailable(normalized, userId);
    setUsernamePromptChecking(false);
    if (!available) {
      setUsernamePromptError("That username is already taken.");
      return;
    }
    setUsernamePromptSaving(true);
    await supabase
      .from("profiles")
      .upsert({ user_id: userId, username: normalized }, { onConflict: "user_id" });
    await supabase
      .from("user_progress")
      .upsert({ user_id: userId, display_name: normalized }, { onConflict: "user_id" });
    localStorage.setItem("fundi-username", normalized);
    setNeedsUsernamePrompt(false);
    setUsernamePromptSaving(false);
  };

  if (route.name === "onboarding") {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  return (
    <AuthGate>
      {/* ── Sticky mobile TopBar, outside scroll area ── */}
      <div className="md:hidden" style={{ position: "sticky", top: 0, zIndex: 200 }}>
        <FundiTopBar
          streak={userData.streak}
          xp={userData.xp}
          hearts={hearts}
          maxHearts={maxHearts}
          heartsRegenInfo={heartsRegenInfo}
        />
      </div>
      <div className="app-container">
        <nav className="sidebar hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-64 md:flex-shrink-0 border-r-2 shadow-lg" style={{ background: "var(--sidebar-bg)", borderRightColor: "var(--color-border)" }}>
          <div className="h-1 w-full bg-gradient-to-r from-green-600 to-yellow-400 flex-shrink-0" aria-hidden />
          <div className="logo" style={{ paddingTop: 16 }}>
            <h1 className="inline-flex items-center gap-2" style={{ color: "var(--color-primary)" }}>
              <Wallet size={22} style={{ color: "var(--color-primary)" }} />
              Fundi Finance
            </h1>
            <p style={{ color: "var(--color-text-secondary)" }}>Master Your Money</p>
          </div>
          <ul className="nav-menu">
            <li className="nav-item">
              <button
                className={`nav-link ${route.name === "learn" ? "active" : ""}`}
                style={route.name !== "learn" ? { color: "var(--nav-link-color)" } : {}}
                onClick={() => handleNav("learn")}
              >
                <span className="nav-icon">
                  <BookOpen size={20} className="text-current" />
                </span>
                Learn
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${route.name === "profile" ? "active" : ""}`}
                style={route.name !== "profile" ? { color: "var(--nav-link-color)" } : {}}
                onClick={() => handleNav("profile")}
              >
                <span className="nav-icon">
                  <UserIcon size={20} className="text-current" />
                </span>
                Profile
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${route.name === "leaderboard" ? "active" : ""}`}
                style={route.name !== "leaderboard" ? { color: "var(--nav-link-color)" } : {}}
                onClick={() => handleNav("leaderboard")}
              >
                <span className="nav-icon">
                  <Trophy size={20} className="text-current" />
                </span>
                Leaderboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${route.name === "budget" ? "active" : ""}`}
                style={route.name !== "budget" ? { color: "var(--nav-link-color)" } : {}}
                onClick={() => handleNav("budget")}
              >
                <span className="nav-icon">
                  <Wallet size={20} className="text-current" />
                </span>
                Budget
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${route.name === "quests" ? "active" : ""}`}
                style={route.name !== "quests" ? { color: "var(--nav-link-color)" } : {}}
                onClick={() => handleNav("quests")}
              >
                <span className="nav-icon">
                  <Target size={20} className="text-current" />
                </span>
                Quests
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${route.name === "settings" ? "active" : ""}`}
                style={route.name !== "settings" ? { color: "var(--nav-link-color)" } : {}}
                onClick={() => handleNav("settings")}
              >
                <span className="nav-icon">
                  <SettingsIcon size={20} className="text-current" />
                </span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        {/* keep content above bottom nav on mobile */}
        <div className="pb-24 md:pb-8">
        {/* TopBar moved outside scroll area, see below */}
        {route.name === "learn" && (
          <LearnView
            courses={CONTENT_DATA.courses}
            isLessonCompleted={isLessonCompleted}
            goToCourse={(courseId) => {
              const c = CONTENT_DATA.courses.find((x) => x.id === courseId);
              analytics.courseOpened(courseId, c?.title ?? courseId);
              setRoute({ name: "course", courseId });
            }}
            contentLoaded={progressReady}
            savedProgress={savedProgress}
            onResumeLesson={resumeLesson}
            weeklyChallenge={weeklyChallenge}
            weeklyProgress={weeklyProgress}
            challengeProgress={challengeProgress}
            challengeComplete={challengeComplete}
            challengeRewardClaimed={challengeRewardClaimed}
            claimChallengeReward={claimChallengeReward}
            streak={userData.streak}
            showQuestSections={false}
            addXP={addXP}
          />
        )}

        {route.name === "quests" && (
          <QuestsView
            dailyXP={dailyXP}
            dailyGoal={dailyGoal}
            weeklyChallenge={weeklyChallenge}
            weeklyProgress={weeklyProgress}
            challengeProgress={challengeProgress}
            challengeComplete={challengeComplete}
            challengeRewardClaimed={challengeRewardClaimed}
            claimChallengeReward={claimChallengeReward}
            streak={userData.streak}
            addXP={addXP}
          />
        )}

        {route.name === "course" && currentCourse && (
          <CourseView
            course={currentCourse}
            isLessonCompleted={isLessonCompleted}
            courseIndex={CONTENT_DATA.courses.findIndex(c => c.id === currentCourse.id)}
            nextCourse={nextCourseInList}
            onGoToNextCourse={() => {
              if (nextCourseInList) setRoute({ name: "course", courseId: nextCourseInList.id });
            }}
            goBack={() => setRoute({ name: "learn" })}
            goToLesson={(lessonId) => {
              const courseId = currentCourse.id;
              const course = CONTENT_DATA.courses.find(
                (c) => c.id === courseId
              );
              if (!course) return;
              let found: Lesson | undefined;
              for (const unit of course.units) {
                const lesson = unit.lessons.find((l) => l.id === lessonId);
                if (lesson) {
                  found = lesson;
                  break;
                }
              }
              // Only block if there are genuinely no steps (content not written yet)
              if (!found || !found.steps || found.steps.length === 0) return;
              if (hearts <= 0) {
                setShowNoHearts(true);
                return;
              }
              beginLessonSession(courseId, lessonId, found.title);
              setCurrentLessonState({
                courseId,
                lessonId,
                stepIndex: 0,
                steps: found.steps,
                answers: {},
                correctCount: 0,
              });
              setRoute({ name: "lesson", courseId, lessonId });
            }}
          />
        )}

        {route.name === "lesson" && currentLessonState.steps.length > 0 && (
          <LessonView
            lessonState={{
              steps: currentLessonState.steps,
              stepIndex: currentLessonState.stepIndex,
              answers: currentLessonState.answers,
            }}
            completeLessonFlow={() => undefined}
            nextStep={nextStep}
            finalizeLesson={finalizeCurrentLesson}
            answerQuestion={answerQuestion}
            answerTrueFalse={answerTrueFalse}
            correctCount={currentLessonState.correctCount}
            hearts={hearts}
            maxHearts={maxHearts}
            goBack={handleLessonExit}
            courseId={currentLessonState.courseId ?? undefined}
            courseAccent={(() => {
              const ACCENTS: Record<string, string> = {
                "money-basics": "#007A4D",
                "salary-payslip": "#FFB612",
                "banking-debit": "#E03C31",
                "credit-debt": "#3B7DD8",
                "emergency-fund": "#7C4DFF",
                "insurance": "#00BFA5",
                "investing-basics": "#F57C00",
                "sa-investing": "#C2185B",
                "property": "#007A4D",
                "taxes": "#FFB612",
                "scams-fraud": "#E03C31",
                "bible-money": "#3B7DD8",
                "money-psychology": "#7C4DFF",
                "retirement": "#00BFA5",
                "rand-economy": "#FFB612",
                "crypto-basics": "#7C4DFF",
                "business-finance": "#3B7DD8",
              };
              return ACCENTS[currentLessonState.courseId ?? ""] ?? "#007A4D";
            })()}
            nextLessonTitle={(() => {
              if (!currentLessonState.courseId || !currentLessonState.lessonId) return undefined;
              const next = getNextLesson(currentLessonState.courseId, currentLessonState.lessonId);
              return next?.title ?? undefined;
            })()}
            lessonTitle={getLessonTitle(currentLessonState.courseId, currentLessonState.lessonId)}
            lessonStartTimeRef={lessonStartTimeRef}
            totalQuestions={currentLessonState.steps.filter((s: any) => s.type === "question" || s.type === "true-false" || s.type === "action-check").length}
          />
        )}

        {route.name === "profile" && (
          <ProfileView
            userData={userData}
            onSignOut={handleProfileSignOut}
            onDeleteAccount={handleDeleteAccount}
            onDownloadData={handleDownloadData}
            currentUser={null}
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            courseBadgeIds={courseBadgeIds}
            courses={CONTENT_DATA.courses}
            completedLessons={completedLessons}
            calcSaved={userSettings.settings.calcSaved as any}
            onClearCalcSaved={() => { localStorage.removeItem("fundi-calc-saved"); void userSettings.setCalcSaved(null); }}
          />
        )}

        {route.name === "leaderboard" && (
          <LeaderboardView xp={userData.xp} weeklyXp={weeklyXp} currentUserId={undefined} />
        )}

        {route.name === "settings" && (
          <SettingsView
            userData={userData}
            setDailyGoal={setDailyGoal}
            resetProgress={handleResetProgress}
            userSettings={userSettings}
          />
        )}

        {route.name === "calculator" && <CalculatorView />}

        {route.name === "budget" && <BudgetView />}

        {/* ── Duolingo-style lesson summary overlay ───────────────────────── */}
        {lessonSummary && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 600,
            background: "#ffffff",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 20px",
          }}>
            {/* Celebration header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ marginBottom: 8, display: "flex", justifyContent: "center" }}>
                {lessonSummary.isPerfect
                  ? <Trophy size={64} style={{ color: "#FFB612" }} />
                  : <Sparkles size={64} style={{ color: "#7C3AED" }} />}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#1A7C4E", marginBottom: 4 }}>
                {lessonSummary.isPerfect ? "Perfect Lesson!" : "Lesson Complete!"}
              </div>
              <div style={{ fontSize: 15, color: "#6b7280", fontWeight: 500 }}>
                {lessonSummary.isPerfect ? "You got every question right!" : "Keep up the great work!"}
              </div>
            </div>

            {/* Stats cards */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 12, width: "100%", maxWidth: 360, marginBottom: 32,
            }}>
              {/* XP Earned */}
              <div style={{
                background: "#FFF8E7", border: "2px solid #FFB612",
                borderRadius: 16, padding: "18px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 30, marginBottom: 4 }}>⭐</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#B8870F" }}>+{lessonSummary.xpEarned}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#B8870F", textTransform: "uppercase", letterSpacing: 1 }}>XP Earned</div>
              </div>
              {/* Time */}
              <div style={{
                background: "#E8F5FF", border: "2px solid #3B7DD8",
                borderRadius: 16, padding: "18px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 30, marginBottom: 4 }}>⏱️</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#2563EB" }}>
                  {String(Math.floor(lessonSummary.timeSeconds / 60)).padStart(2, "0")}:{String(lessonSummary.timeSeconds % 60).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: 1 }}>Time</div>
              </div>
              {/* Accuracy */}
              <div style={{
                background: "#F0FDF4", border: "2px solid #1A7C4E",
                borderRadius: 16, padding: "18px 12px", textAlign: "center",
              }}>
                <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}><Target size={30} style={{ color: "#1A7C4E" }} /></div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#1A7C4E" }}>{lessonSummary.accuracy}%</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1A7C4E", textTransform: "uppercase", letterSpacing: 1 }}>Accuracy</div>
              </div>
              {/* Streak */}
              <div style={{
                background: "#FFF3EE", border: "2px solid #F97316",
                borderRadius: 16, padding: "18px 12px", textAlign: "center",
              }}>
                <div style={{ marginBottom: 4, display: "flex", justifyContent: "center" }}><Flame size={30} style={{ color: "#F97316" }} /></div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#EA580C" }}>{lessonSummary.streak}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: 1 }}>Day Streak</div>
              </div>
            </div>

            {/* Budget bridge card — shown for budget-relevant lessons */}
            {(() => {
              const bridgeKey = `${lessonSummary.courseId}:${lessonSummary.lessonId}`;
              const bridge = BUDGET_LESSON_BRIDGE[bridgeKey];
              if (!bridge) return null;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setLessonSummary(null);
                    setRoute({ name: "budget" });
                  }}
                  style={{
                    width: "100%", maxWidth: 360, marginBottom: 12,
                    padding: "14px 16px", borderRadius: 16,
                    background: "linear-gradient(135deg, #E8F5EE 0%, #D4EDDF 100%)",
                    border: "2px solid #1A7C4E", cursor: "pointer",
                    textAlign: "left", display: "flex", alignItems: "center", gap: 12,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "#1A7C4E", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 22 }}>💰</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A7C4E", marginBottom: 2, lineHeight: 1.3 }}>
                      {bridge.prompt}
                    </div>
                    <div style={{ fontSize: 12, color: "#2E7D5C", lineHeight: 1.4, fontWeight: 500 }}>
                      {bridge.detail}
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: "#1A7C4E", flexShrink: 0 }}>›</div>
                </button>
              );
            })()}

            {/* Continue button */}
            <button
              type="button"
              onClick={() => {
                const summary = lessonSummary;
                setLessonSummary(null);
                if (summary.choice === "next" && summary.nextLessonId) {
                  const nextCourse = CONTENT_DATA.courses.find((c) => c.id === summary.courseId);
                  const nextLessonObj = nextCourse?.units.flatMap((u) => u.lessons).find((l) => l.id === summary.nextLessonId);
                  if (nextLessonObj) startLesson(summary.courseId, nextLessonObj);
                  else setRoute({ name: "course", courseId: summary.courseId });
                } else {
                  setRoute({ name: "course", courseId: summary.courseId });
                }
              }}
              style={{
                width: "100%", maxWidth: 360, padding: "16px",
                borderRadius: 16, background: "#1A7C4E", color: "#ffffff",
                fontSize: 17, fontWeight: 800, border: "none", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(26,124,78,0.35)",
                letterSpacing: 0.5,
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {showNoHearts && activeModal === "no-hearts" && (
          <div className="fixed inset-0 z-[550] flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center dark:bg-gray-800">
              <div className="mb-3 flex justify-center text-red-500 dark:text-red-400" aria-hidden>
                <HeartOff size={48} strokeWidth={1.5} />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Out of Hearts</h2>
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                You&apos;ll get a heart back in 1 hour, or finish a lesson perfectly to earn one back.
              </p>
              <div className="my-4 flex justify-center gap-0.5" aria-label="Hearts remaining">
                {Array.from({ length: maxHearts }).map((_, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    fill={i < hearts ? "#E03C31" : "none"}
                    stroke={i < hearts ? "#E03C31" : "#ccc"}
                    strokeWidth="2"
                    width="26"
                    height="26"
                    className="opacity-100"
                    aria-hidden
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                ))}
              </div>
              <button
                type="button"
                className="w-full rounded-xl bg-gray-100 py-3 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                onClick={() => {
                  const cid = currentLessonState.courseId;
                  setShowNoHearts(false);
                  setCurrentLessonState({
                    courseId: null,
                    lessonId: null,
                    stepIndex: 0,
                    steps: [],
                    answers: {},
                    correctCount: 0,
                  });
                  setRoute(cid ? { name: "course", courseId: cid } : { name: "learn" });
                }}
              >
                Come Back Later
              </button>
            </div>
          </div>
        )}

        {showMilestoneCta && activeModal === "milestone-cta" && (
          <div className="fixed inset-0 bg-black/80 z-[520] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="mb-3 flex justify-center text-green-600 dark:text-green-400" aria-hidden>
                <Target size={48} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
                You&apos;re making real progress
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {milestoneCtaContent.headline}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">
                {milestoneCtaContent.body}
              </p>
              <button
                type="button"
                onClick={() => {
                  analytics.advisorCtaClicked("lesson_milestone_5");
                  window.open("https://wealthwithkwanele.co.za", "_blank", "noopener,noreferrer");
                }}
                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold mb-3 transition-colors"
              >
                {milestoneCtaContent.button}
              </button>
              <button
                type="button"
                onClick={() => setShowMilestoneCta(false)}
                className="text-gray-400 dark:text-gray-500 text-sm hover:text-gray-600"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* Wrong answer review modal */}
        {reviewAnswers && activeModal === "review-answers" && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}>
            <div style={{
              background: "var(--color-surface)", borderRadius: "20px 20px 0 0",
              padding: "28px 20px 32px", width: "100%", maxWidth: 500,
              maxHeight: "80vh", overflowY: "auto",
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Review</div>
              <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20 }}>
                Questions you missed this lesson:
              </p>
              {reviewAnswers.map((r, i) => (
                <div key={i} style={{
                  background: "var(--color-bg)", borderRadius: 12, padding: 14,
                  marginBottom: 10, borderLeft: "4px solid #E03C31",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{r.question}</div>
                  <div style={{ fontSize: 12, color: "#E03C31", marginBottom: 4 }}>
                    Your answer: {r.yourAnswer}
                  </div>
                  <div style={{ fontSize: 12, color: "#007A4D", fontWeight: 700 }}>
                    Correct: {r.correct}
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }}
                onClick={() => setReviewAnswers(null)}>
                Got it, Continue
              </button>
            </div>
          </div>
        )}

        {weeklyChallengeCelebration && activeModal === "weekly-celebration" && (
          <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
              <div className="mb-4 flex justify-center text-[#FFB612]" aria-hidden>
                <Trophy size={56} strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Weekly Challenge Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                {weeklyChallengeCelebration.description}
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-6">
                <p className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-400 font-bold text-lg">
                  <Sparkles size={20} className="shrink-0" aria-hidden />
                  +{weeklyChallengeCelebration.bonusXP} Bonus XP earned
                </p>
              </div>
              <button
                type="button"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold"
                onClick={() => {
                  localStorage.setItem(`fundi-wc-claimed-${weeklyChallenge.id}`, "true");
                  setWeeklyChallengeCelebration(null);
                }}
              >
                Claim Reward
              </button>
            </div>
          </div>
        )}

        {courseCompleteModal && activeModal === "course-complete" && (
          <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full shadow-xl">
              <div className="mb-4 flex justify-center" aria-hidden>
                <Trophy size={64} strokeWidth={1.5} style={{ color: courseCompleteModal.color }} />
              </div>
              <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">
                Course Complete!
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">You earned the</h2>
              <h3 className="text-3xl font-black mb-4" style={{ color: courseCompleteModal.color }}>
                &quot;{courseCompleteModal.name}&quot;
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                {courseCompleteModal.description}
              </p>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700"
                onClick={() => {
                  setCourseCompleteModal(null);
                  confetti({
                    particleCount: 120,
                    spread: 75,
                    origin: { y: 0.7 },
                    zIndex: 999,
                  });
                }}
              >
                <Sparkles size={20} aria-hidden />
                Awesome
              </button>
              <div className="mt-3">
                <ShareButton
                  text={generateShareText("badge", {
                    badgeName: courseCompleteModal.name,
                  })}
                  label="Share this badge"
                  shareType="badge"
                />
              </div>
            </div>
          </div>
        )}

        {/* Badge earned celebration modal */}
        {newlyEarnedBadges.length > 0 && activeModal === "badge-earned" && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{
              background: "var(--color-surface)", borderRadius: 24,
              padding: "32px 24px", width: "100%", maxWidth: 360, textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}>
              {(() => {
                const BADGE_META: Record<string, { name: string; emoji: string; desc: string }> = {
                  "lesson-1-badge":  { name: "First Step",        emoji: "🎯", desc: "You completed your very first lesson!" },
                  "lesson-5-badge":  { name: "Getting Going",     emoji: "🚀", desc: "You've completed 5 lessons. Keep it up!" },
                  "lesson-10-badge": { name: "On a Roll",         emoji: "🔥", desc: "10 lessons done - you're building real momentum!" },
                  "lesson-25-badge": { name: "Dedicated",         emoji: "💪", desc: "25 lessons completed. You're seriously committed!" },
                  "streak-3-badge":  { name: "3 Day Streak",      emoji: "🗓️", desc: "You learned 3 days in a row!" },
                  "streak-7-badge":  { name: "Week Warrior",      emoji: "🏆", desc: "7-day streak - a full week of learning!" },
                  "xp-100-badge":    { name: "First 100",         emoji: "⚡", desc: "You've earned 100 XP total!" },
                  "xp-500-badge":    { name: "XP Builder",        emoji: "💎", desc: "500 XP earned - you're levelling up fast!" },
                  "perfect-1-badge": { name: "Flawless",          emoji: "✨", desc: "You got a perfect score on a lesson!" },
                };
                // Show only the most notable badge (or the first if multiple earned at once)
                const primaryId = newlyEarnedBadges[0];
                const meta = BADGE_META[primaryId] ?? { name: primaryId, emoji: "🏅", desc: "You unlocked a new badge!" };
                return (
                  <>
                    <div style={{ fontSize: 64, marginBottom: 4, lineHeight: 1 }}>{meta.emoji}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-primary)", marginBottom: 6 }}>
                      Badge Earned!
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text-primary)", marginBottom: 8 }}>
                      {meta.name}
                    </div>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: 15, lineHeight: 1.5, margin: "0 0 20px" }}>
                      {meta.desc}
                    </p>
                    {newlyEarnedBadges.length > 1 && (
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
                        {newlyEarnedBadges.slice(1).map((id) => {
                          const m = BADGE_META[id] ?? { name: id, emoji: "🏅" };
                          return (
                            <span key={id} style={{
                              fontSize: 12, padding: "4px 10px", borderRadius: 20,
                              background: "var(--color-bg)", border: "1px solid var(--color-border)",
                              color: "var(--color-text-secondary)", fontWeight: 700,
                            }}>{m.emoji} {m.name}</span>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                  // Respect the lesson summary choice - if user picked "Done", go to course
                  const summary = lessonSummary;
                  nextLessonRef.current = null;
                  setNewlyEarnedBadges([]);
                  setLessonSummary(null);
                  if (summary && summary.choice === "next" && summary.nextLessonId) {
                    const c = CONTENT_DATA.courses.find((c) => c.id === summary.courseId);
                    const l = c?.units.flatMap((u) => u.lessons).find((ls) => ls.id === summary.nextLessonId);
                    if (l) { startLesson(summary.courseId, l); return; }
                  }
                  setRoute({ name: "course", courseId: currentLessonState.courseId ?? summary?.courseId ?? "" });
                }}>Continue</button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  onClick={() => {
                    const badgeName = (newlyEarnedBadges[0] ?? "").replace(/-badge$/, "").replace(/-/g, " ");
                    const text = `I just earned the "${badgeName}" badge on Fundi Finance! Learning money skills one lesson at a time. fundiapp.co.za`;
                    if (navigator.share) {
                      navigator.share({ title: "Fundi Finance", text });
                    } else {
                      navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"));
                    }
                  }}
                >
                  <Link2 size={16} aria-hidden />
                  Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PWA install banner */}
        {showInstallBanner && (
          <div style={{
            position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
            background: "var(--color-surface)", border: "1.5px solid var(--color-primary)",
            borderRadius: 16, padding: "14px 18px", zIndex: 400,
            display: "flex", alignItems: "center", gap: 12,
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            maxWidth: 360, width: "calc(100% - 32px)",
          }}>
            <img src="/fundi-logo.png" alt="Fundi" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)", marginBottom: 2 }}>
                Add to Home Screen
              </div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Learn faster with the app installed
              </div>
            </div>
            <button
              type="button"
              onClick={handleInstallApp}
              style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
            >
              Install
            </button>
            <button
              type="button"
              onClick={() => { setShowInstallBanner(false); localStorage.setItem("fundi-a2hs-dismissed", "true"); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--color-text-secondary)", flexShrink: 0 }}
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Offline banner */}
        {isOffline && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 600,
            background: "#1a1a1a", color: "#fff", textAlign: "center",
            padding: "8px 16px", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <WifiOff size={14} aria-hidden />
            You&apos;re offline - lessons still available from cache
          </div>
        )}

        {/* XP gain toast */}
        {xpToast && (
          <div
            key={xpToast.id}
            style={{
              position: "fixed",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--color-primary)",
              color: "white",
              fontWeight: 800,
              fontSize: 18,
              padding: "10px 24px",
              borderRadius: 999,
              boxShadow: "0 4px 20px rgba(0,122,77,0.4)",
              zIndex: 500,
              pointerEvents: "none",
              animation: "xp-toast 2s ease-out forwards",
              whiteSpace: "nowrap",
            }}
          >
            +{xpToast.amount} XP
          </div>
        )}

        {isDesktop && (
          <StatsPanel
            userData={userData}
            hearts={hearts}
            maxHearts={maxHearts}
            freezeCount={freezeCount}
            onBuyFreeze={() => { if (!buyStreakFreeze(200)) alert("Not enough XP! You need 200 XP to buy a streak freeze."); }}
            freezeUsedToday={freezeUsedToday}
            onUseFreeze={async () => {
              const result = await useFreeze();
              if (result.ok) {
                setFreezeUsedToday(true);
              } else if (result.reason === "no_freezes_left") {
                alert("No streak freezes left. Resets every Monday.");
              } else {
                alert("Could not use freeze: " + (result.reason ?? "unknown error"));
              }
            }}
          />
        )}
        {needsUsernamePrompt && (
          <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ width: "100%", maxWidth: 420, background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: 20 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "var(--color-text-primary)" }}>Choose your username</h3>
              <p style={{ marginTop: 8, marginBottom: 14, fontSize: 14, color: "var(--color-text-secondary)" }}>
                You need a unique username before continuing. This is what appears on the leaderboard.
              </p>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(normalizeUsername(e.target.value))}
                placeholder="username"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `2px solid ${usernamePromptError ? "var(--color-danger)" : "var(--color-border)"}`, boxSizing: "border-box", marginBottom: 8, fontSize: 14 }}
              />
              <div style={{ minHeight: 18, fontSize: 12, color: usernamePromptError ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                {usernamePromptChecking
                  ? "Checking availability..."
                  : usernamePromptError ?? "3-20 chars: lowercase letters, numbers, underscores."}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={usernamePromptSaving || usernamePromptChecking}
                onClick={saveUsernameFromPrompt}
                style={{ width: "100%", marginTop: 10 }}
              >
                {usernamePromptSaving ? "Saving..." : "Save Username"}
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      <MobileBottomNav
        items={[
          {
            key: "learn",
            label: "Learn",
            icon: <BookOpen size={20} className="text-current" />,
            isActive: route.name === "learn" || route.name === "course" || route.name === "lesson",
            onClick: () => setRoute({ name: "learn" }),
            order: "order-1",
          },
          {
            key: "calculator",
            label: "Calculate",
            icon: <Calculator size={20} className="text-current" />,
            isActive: route.name === "calculator",
            onClick: () => handleNav("calculator"),
            order: "order-2",
          },
          {
            key: "budget",
            label: "Budget",
            icon: <Wallet size={20} className="text-current" />,
            isActive: route.name === "budget",
            onClick: () => handleNav("budget"),
            order: "order-3",
          },
          {
            key: "quests",
            label: "Quests",
            icon: <Target size={20} className="text-current" />,
            isActive: route.name === "quests",
            onClick: () => handleNav("quests"),
            order: "order-4",
          },
          {
            key: "progress",
            label: "Progress",
            icon: <TrendingUp size={20} className="text-current" />,
            isActive: route.name === "leaderboard",
            onClick: () => handleNav("leaderboard"),
            order: "order-5",
          },
          {
            key: "profile",
            label: "Profile",
            icon: <UserIcon size={20} className="text-current" />,
            isActive: route.name === "profile",
            onClick: () => handleNav("profile"),
            order: "order-6",
          },
        ]}
      />
    </AuthGate>
  );
}

