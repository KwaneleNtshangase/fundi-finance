/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { analytics } from "@/lib/analytics";
import { CONTENT_DATA } from "@/data/content";
import { DAILY_FACTS_365 } from "@/data/content-extra";
import {
  COURSE_BADGES,
  getInvestorProfile,
  INVESTOR_PROFILE_STYLES,
  INVESTOR_QUIZ_QUESTIONS,
} from "@/data/gamificationExtras";
import { useProgress } from "@/hooks/useProgress";
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
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart2,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Flag,
  Flame,
  GraduationCap,
  Hash,
  Heart,
  HeartOff,
  Home as HomeIcon,
  Info,
  KeyRound,
  Landmark,
  Lightbulb,
  Link2,
  Lock,
  LogOut,
  Mail,
  Moon,
  PenLine,
  Play,
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
  Umbrella,
  User as UserIcon,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import type { Course, Lesson, LessonStep } from "@/data/content";

function getDailyFact(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_FACTS_365[dayOfYear % DAILY_FACTS_365.length];
}

type WeeklyProgressJSON = {
  lessonsCompleted: number;
  xpEarned: number;
  perfectLessons: number;
  dailyXp: number;
  completed: boolean;
};

const EMPTY_WEEKLY_PROGRESS: WeeklyProgressJSON = {
  lessonsCompleted: 0,
  xpEarned: 0,
  perfectLessons: 0,
  dailyXp: 0,
  completed: false,
};

function parseWeeklyChallengeStorage(
  raw: string | null
): WeeklyProgressJSON | null {
  if (raw == null || raw === "") return null;
  try {
    const asNum = parseInt(raw, 10);
    if (!Number.isNaN(asNum) && String(asNum).trim() === raw.trim()) {
      return { ...EMPTY_WEEKLY_PROGRESS, lessonsCompleted: asNum };
    }
    const j = JSON.parse(raw) as Partial<WeeklyProgressJSON> & {
      dailyXp?: number;
    };
    return {
      lessonsCompleted: j.lessonsCompleted ?? 0,
      xpEarned: j.xpEarned ?? 0,
      perfectLessons: j.perfectLessons ?? 0,
      dailyXp: j.dailyXp ?? 0,
      completed: Boolean(j.completed),
    };
  } catch {
    return null;
  }
}

function progressNumberFromWeeklyState(
  wc: { unit: string },
  st: WeeklyProgressJSON,
  streakDays: number
): number {
  if (wc.unit === "lessons") return st.lessonsCompleted;
  if (wc.unit === "perfect") return st.perfectLessons;
  if (wc.unit === "daily_xp") return st.dailyXp;
  if (wc.unit === "streak_days") return streakDays;
  return 0;
}

function playSound(type: "correct" | "incorrect" | "complete") {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("fundi-sound-enabled") === "false") return;
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "correct") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "incorrect") {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "complete") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // ignore audio errors
  }
}

// ── Onboarding component ─────────────────────────────────────────────────────
const ONBOARDING_GOAL_OPTIONS = [
  { id: "debt-free", label: "Get debt-free", Icon: CreditCard },
  { id: "emergency", label: "Build emergency fund", Icon: Shield },
  { id: "invest", label: "Start investing", Icon: TrendingUp },
  { id: "home", label: "Save for a home", Icon: HomeIcon },
  { id: "retire", label: "Plan for retirement", Icon: Flag },
  { id: "business", label: "Grow my business", Icon: Briefcase },
  { id: "other", label: "Something else", Icon: PenLine },
] as const;

const ONBOARDING_AGE_RANGES = [
  { id: "18-25", label: "18–25", Icon: GraduationCap },
  { id: "26-35", label: "26–35", Icon: Briefcase },
  { id: "36-45", label: "36–45", Icon: HomeIcon },
  { id: "46-55", label: "46–55", Icon: BarChart2 },
  { id: "56+", label: "56+", Icon: Flag },
] as const;

/** Onboarding goal ids + labels — reuse for Learn screen banner (Patch 17). */
const GOAL_OPTIONS = ONBOARDING_GOAL_OPTIONS;

const GOAL_COURSE_MAP: Record<string, string[]> = {
  "debt-free": ["credit-debt", "money-basics", "money-psychology"],
  emergency: ["emergency-fund", "money-basics", "banking-debit"],
  invest: ["investing-basics", "sa-investing", "rand-economy"],
  home: ["property", "credit-debt", "banking-debit"],
  retire: ["retirement", "sa-investing", "investing-basics"],
  business: ["business-finance", "taxes", "money-basics"],
};

function generateShareText(
  type: "lesson" | "badge" | "streak",
  data: {
    lessonTitle?: string;
    badgeName?: string;
    streakDays?: number;
    xp?: number;
  }
): string {
  if (type === "lesson") {
    const t = data.lessonTitle ?? "a lesson";
    return `I just completed "${t}" on Fundi Finance. Short, South Africa–focused money lessons that actually make sense.\n\nJoin me: fundi-finance.vercel.app`;
  }
  if (type === "badge") {
    const n = data.badgeName ?? "a";
    return `I just earned the "${n}" badge on Fundi Finance. Building real financial knowledge, one lesson at a time.\n\nfundi-finance.vercel.app`;
  }
  if (type === "streak") {
    const d = data.streakDays ?? 0;
    return `${d}-day learning streak on Fundi Finance. Showing up for my money goals every day.\n\nfundi-finance.vercel.app`;
  }
  return "";
}

function ShareButton({
  text,
  label = "Share",
  shareType,
}: {
  text: string;
  label?: string;
  shareType?: "lesson" | "badge" | "streak";
}) {
  const handleShare = async () => {
    const method =
      typeof navigator !== "undefined" && typeof navigator.share === "function"
        ? "native"
        : "whatsapp";
    if (shareType) analytics.shareTriggered(shareType, method);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* dismissed or unavailable */
      }
    }
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
    >
      <Share2 size={16} className="shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

async function persistUserGoalToStorageAndSupabase(goalId: string, goalDescription?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("fundi-user-goal", goalId);
  if (goalDescription !== undefined) {
    localStorage.setItem("fundi-goal-description", goalDescription);
  }
  localStorage.removeItem("fundi-goal-banner-dismissed");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const update: Record<string, unknown> = { user_id: user.id, goal: goalId };
    if (goalDescription !== undefined) update.goal_description = goalDescription;
    await supabase.from("profiles").upsert(update, { onConflict: "user_id" });
  }
}

function getLessonTitle(
  courseId: string | null | undefined,
  lessonId: string | null | undefined
): string | undefined {
  if (!courseId || !lessonId) return undefined;
  const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
  if (!course) return undefined;
  for (const u of course.units) {
    const le = u.lessons.find((l) => l.id === lessonId);
    if (le) return le.title;
  }
  return undefined;
}

function OnboardingView({
  onComplete,
}: {
  onComplete: (payload: { goal?: string; ageRange?: string; goalDescription?: string }) => void;
}) {
  const [screen, setScreen] = React.useState(0);
  const [selectedGoal, setSelectedGoal] = React.useState("");
  const [selectedAgeRange, setSelectedAgeRange] = React.useState("");
  const [goalDescription, setGoalDescription] = React.useState("");

  const screenCount = 4;
  const screensMeta = [
    {
      title: "Welcome to Fundi Finance",
      body: "Master your money in minutes a day. Short, SA-specific lessons that actually make sense, from budgeting to investing to what the Bible says about money.",
      cta: "Let's go",
      action: () => setScreen(1),
    },
    {
      title: "What's your money goal?",
      body: "We'll personalise tips based on what matters most to you. Optional — skip if you prefer.",
      cta: "Next",
      action: () => {
        if (selectedGoal) setScreen(2);
      },
    },
    {
      title: "Your age range",
      body: "Helps us keep examples relevant. Optional — skip if you prefer.",
      cta: "Next",
      action: () => {
        setScreen(3);
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
        {screen === 3 && (
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
                placeholder="Describe your goal — e.g. save for my child's education"
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

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700 }}
          onClick={current.action}
          disabled={screen === 1 && (!selectedGoal || (selectedGoal === "other" && !goalDescription.trim()))}
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

type UserData = {
  xp: number;
  level: number;
  streak: number;
  totalCompleted: number;
  dailyXP: number;
  dailyGoal: number;
  badges: string[];
};

type Route =
  | { name: "learn" }
  | { name: "course"; courseId: string }
  | { name: "lesson"; courseId: string; lessonId: string }
  | { name: "profile" }
  | { name: "leaderboard" }
  | { name: "settings" }
  | { name: "calculator" }
  | { name: "onboarding" };

type CalcInputs = {
  principal: number;
  monthly: number;
  rate: number;
  years: number;
  escalation: number;
  frequency: "monthly" | "annually" | "once-off";
};

function calcGrowth(inputs: CalcInputs) {
  const { principal, monthly, rate, years, escalation, frequency } = inputs;
  const data: {
    year: number;
    value: number;
    contributions: number;
    interest: number;
  }[] = [];
  let balance = principal;
  let currentMonthly = monthly;
  let totalContributions = principal;

  for (let year = 0; year <= years; year++) {
    data.push({
      year,
      value: Math.round(balance),
      contributions: Math.round(totalContributions),
      interest: Math.round(balance - totalContributions),
    });
    if (year < years) {
      if (frequency === "monthly") {
        for (let m = 0; m < 12; m++) {
          balance = balance * (1 + rate / 100 / 12) + currentMonthly;
          totalContributions += currentMonthly;
        }
        currentMonthly = currentMonthly * (1 + escalation / 100);
      } else if (frequency === "annually") {
        balance = balance * Math.pow(1 + rate / 100, 1) + currentMonthly * 12;
        totalContributions += currentMonthly * 12;
        currentMonthly = currentMonthly * (1 + escalation / 100);
      } else {
        balance = balance * Math.pow(1 + rate / 100, 1);
      }
    }
  }
  return data;
}

/** Thousands use spaces (e.g. R1 000), not commas. */
function formatWithSpaces(value: number) {
  return Math.round(value).toLocaleString("en-ZA").replace(/,/g, " ");
}

/** Rand amounts with space grouping (en-ZA). */
function formatRand(n: number): string {
  return "R" + Math.round(n).toLocaleString("en-ZA").replace(/,/g, " ");
}

function formatZAR(value: number) {
  return formatRand(value);
}

function FieldTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className="rounded-full p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:text-gray-500 dark:hover:text-gray-300"
        aria-label="More info"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={14} strokeWidth={2.5} aria-hidden />
      </button>
      {open ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-2 text-left text-xs font-medium leading-snug text-white shadow-lg dark:bg-gray-700"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}

function CalcNumberRow({
  label,
  tooltip,
  value,
  onChange,
  step = "any",
}: {
  label: string;
  tooltip: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
}) {
  const [str, setStr] = useState(String(value));
  useEffect(() => {
    setStr(String(value));
  }, [value]);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>{label}</span>
        <FieldTip text={tooltip} />
      </div>
      <input
        type="number"
        step={step}
        value={str}
        onChange={(e) => setStr(e.target.value)}
        onBlur={() => {
          const n = parseFloat(str.replace(/,/g, ""));
          if (Number.isNaN(n)) {
            setStr(String(value));
            return;
          }
          onChange(n);
          setStr(String(n));
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1.5px solid var(--color-border)",
          fontSize: 15,
          fontWeight: 600,
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
        }}
        aria-label={label}
      />
    </div>
  );
}

// ── FundiTopBar, sticky mobile top bar ──────────────────────────────────────
function FundiTopBar({
  streak,
  xp,
  hearts,
  maxHearts,
  heartsRegenInfo,
}: {
  streak: number;
  xp: number;
  hearts: number;
  maxHearts: number;
  heartsRegenInfo?: () => { nextHeartIn: string; minutesLeft: number } | null;
}) {
  const [showHeartsModal, setShowHeartsModal] = useState(false);
  const regen = heartsRegenInfo ? heartsRegenInfo() : null;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "var(--color-surface)",
          borderBottom: "1.5px solid var(--color-border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Flame size={20} style={{ color: "#FFB612" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#FFB612" }}>{streak}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              const text = generateShareText("streak", { streakDays: streak });
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({ text });
                  return;
                } catch {
                  /* ignore */
                }
              }
              window.open(
                `https://wa.me/?text=${encodeURIComponent(text)}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="text-orange-400 hover:text-orange-600 p-1"
            title="Share your streak"
            aria-label="Share your streak"
          >
            <Share2 size={18} aria-hidden />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={18} style={{ color: "var(--color-primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>{formatWithSpaces(xp)} XP</span>
        </div>

        <button
          onClick={() => hearts < maxHearts && setShowHeartsModal(true)}
          style={{
            display: "flex",
            gap: 3,
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: hearts < maxHearts ? "pointer" : "default",
            padding: 0,
          }}
          aria-label="Hearts status"
        >
          {Array.from({ length: maxHearts }).map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              fill={i < hearts ? "#E03C31" : "none"}
              stroke={i < hearts ? "#E03C31" : "#ccc"}
              strokeWidth="2"
              width="18"
              height="18"
              style={{ transition: "fill 0.2s" }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ))}
        </button>
      </div>

      {showHeartsModal && (
        <div
          onClick={() => setShowHeartsModal(false)}
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
              maxWidth: 320,
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
              {Array.from({ length: maxHearts }).map((_, i) => (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  fill={i < hearts ? "#E03C31" : "none"}
                  stroke={i < hearts ? "#E03C31" : "#ccc"}
                  strokeWidth="2"
                  width="28"
                  height="28"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              {hearts}/{maxHearts} Hearts
            </div>
            {regen ? (
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.6 }}>
                Next heart in <strong>{regen.nextHeartIn}</strong>.
                <br />
                Hearts refill 1 per hour automatically.
              </p>
            ) : (
              <p style={{ color: "var(--color-text-secondary)", marginBottom: 20 }}>You have full hearts. Keep learning!</p>
            )}
            <button className="btn btn-primary" onClick={() => setShowHeartsModal(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── FundiCharacter, mascot image with expression ─────────────────────────────
type FundiExpression = "default" | "thinking" | "sad" | "celebrating";
function FundiCharacter({
  expression = "default",
  size = 100,
  style: extraStyle = {},
}: {
  expression?: FundiExpression;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={`/characters/fundi-${expression}.png`}
      alt={`Fundi ${expression}`}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block", ...extraStyle }}
    />
  );
}

function CalculatorView() {
  const defaultInputs: CalcInputs = {
    principal: 50000,
    monthly: 1000,
    rate: 10,
    years: 10,
    escalation: 5,
    frequency: "monthly",
  };

  const [mode, setMode] = useState<"single" | "compare">("single");
  const [inputsA, setInputsA] = useState<CalcInputs>(defaultInputs);
  const [inputsB, setInputsB] = useState<CalcInputs>({
    ...defaultInputs,
    rate: 7,
    monthly: 500,
  });

  const [hasCalculated, setHasCalculated] = useState(false);
  const [calcA, setCalcA] = useState<CalcInputs>(defaultInputs);
  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500 });

  const handleCalculate = () => {
    setCalcA(inputsA);
    setCalcB(inputsB);
    setHasCalculated(true);
  };

  const dataA = useMemo(() => (hasCalculated ? calcGrowth(calcA) : []), [hasCalculated, calcA]);
  const dataB = useMemo(() => (hasCalculated ? calcGrowth(calcB) : []), [hasCalculated, calcB]);
  const finalA = hasCalculated && dataA.length > 0 ? dataA[dataA.length - 1] : { year: 0, value: 0, contributions: 0, interest: 0 };
  const finalB = hasCalculated && dataB.length > 0 ? dataB[dataB.length - 1] : { year: 0, value: 0, contributions: 0, interest: 0 };

  const chartData: Record<string, number>[] = useMemo(
    () =>
      !hasCalculated
        ? []
        : mode === "single"
          ? dataA.map((d) => ({
              year: d.year,
              "Portfolio Value": d.value,
              "Total Contributions": d.contributions,
            }))
          : dataA.map((d, i) => ({
              year: d.year,
              "Investment A": d.value,
              "Investment B": dataB[i]?.value ?? 0,
            })),
    [hasCalculated, mode, dataA, dataB]
  );

  const ResultCard = ({
    label,
    value,
    highlight,
  }: {
    label: string;
    value: string;
    highlight?: boolean;
  }) => (
    <div
      style={{
        background: highlight ? "var(--color-primary)" : "var(--color-surface)",
        border: `1px solid ${highlight ? "var(--color-primary)" : "var(--color-border)"}`,
        borderRadius: 12,
        padding: "16px 20px",
        textAlign: "center",
        flex: 1,
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: highlight ? "rgba(255,255,255,0.8)" : "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: highlight ? "white" : "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );

  const calcReturnPct = (value: number, contributions: number) => {
    if (contributions <= 0) return 0;
    return ((value - contributions) / contributions) * 100;
  };

  const InputPanel = ({
    label,
    inputs,
    setInputs,
  }: {
    label?: string;
    inputs: CalcInputs;
    setInputs: (i: CalcInputs) => void;
  }) => (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: 20,
        flex: 1,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-primary)",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {label}
        </div>
      )}

      <CalcNumberRow
        label="Initial Amount"
        tooltip="The lump sum you're starting with today."
        value={inputs.principal}
        onChange={(v) => setInputs({ ...inputs, principal: v })}
      />
      <CalcNumberRow
        label="Monthly Contribution"
        tooltip="How much you add every month."
        value={inputs.monthly}
        onChange={(v) => setInputs({ ...inputs, monthly: v })}
      />
      <CalcNumberRow
        label="Annual Return Rate (%)"
        tooltip="The yearly growth rate of your investment (e.g. JSE average is ~10%)."
        value={inputs.rate}
        step="0.01"
        onChange={(v) => setInputs({ ...inputs, rate: v })}
      />
      <CalcNumberRow
        label="Annual Contribution Increase (%)"
        tooltip="How much you increase your monthly contribution each year, to keep up with inflation."
        value={inputs.escalation}
        step="0.01"
        onChange={(v) => setInputs({ ...inputs, escalation: v })}
      />
      <CalcNumberRow
        label="Investment Period (years)"
        tooltip="How many years you plan to invest for."
        value={inputs.years}
        step="1"
        onChange={(v) => setInputs({ ...inputs, years: v })}
      />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>
          Investment Frequency
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["monthly", "annually", "once-off"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setInputs({ ...inputs, frequency: f })}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "2px solid",
                borderColor: inputs.frequency === f ? "var(--color-primary)" : "var(--color-border)",
                background: inputs.frequency === f ? "var(--color-primary-light)" : "white",
                color: inputs.frequency === f ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}
            >
              {f === "once-off" ? "Once-off" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <main className="main-content main-with-stats" id="mainContent">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Investment Calculator</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={mode === "single" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ padding: "8px 12px", fontSize: 13 }}
            onClick={() => setMode("single")}
          >
            Single
          </button>
          <button
            className={mode === "compare" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ padding: "8px 12px", fontSize: 13 }}
            onClick={() => setMode("compare")}
          >
            Compare
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <InputPanel inputs={inputsA} setInputs={setInputsA} label={mode === "compare" ? "Investment A" : undefined} />
        {mode === "compare" && <InputPanel inputs={inputsB} setInputs={setInputsB} label="Investment B" />}
      </div>

      {/* Results + chart section (clean) */}
      <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleCalculate}>
        <BarChart2 size={20} aria-hidden />
        Calculate
      </button>

      {!hasCalculated && (
        <div style={{ textAlign: "center", padding: "18px 0", color: "var(--color-text-secondary)" }}>
          Set your values above, then tap Calculate
        </div>
      )}

      {hasCalculated && mode === "single" && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          <ResultCard label="Final Value" value={formatZAR(finalA.value)} highlight />
          <ResultCard label="Total Contributions" value={formatZAR(finalA.contributions)} />
          <ResultCard label="Total Interest" value={formatZAR(finalA.interest)} />
        </div>
      )}

      {hasCalculated && mode === "compare" && (
        <div
          style={{
            marginBottom: 24,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                  Metric
                </th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                  Investment A
                </th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-secondary)" }}>
                  Investment B
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Final Value", formatZAR(finalA.value), formatZAR(finalB.value)],
                ["Contributions", formatZAR(finalA.contributions), formatZAR(finalB.contributions)],
                ["Interest", formatZAR(finalA.interest), formatZAR(finalB.interest)],
                ["Return %", `${calcReturnPct(finalA.value, finalA.contributions).toFixed(1)}%`, `${calcReturnPct(finalB.value, finalB.contributions).toFixed(1)}%`],
                ["Term", `${inputsA.years} yrs`, `${inputsB.years} yrs`],
              ].map(([metric, a, b]) => (
                <tr key={metric} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)", fontWeight: 600 }}>{metric}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>{a}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--color-secondary)" }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasCalculated && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Growth Over Time</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} width={50} />
              <Tooltip
                formatter={(v) => formatZAR(typeof v === "number" ? v : Number(v ?? 0))}
                labelFormatter={(l) => `Year ${l}`}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 13 }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              {mode === "single" ? (
                <>
                  <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Total Contributions" stroke="#FFB612" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="Investment A" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Investment B" stroke="#FFB612" strokeWidth={2.5} dot={false} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div
        className="relative overflow-hidden bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-5 text-white mb-8"
        style={{ marginBottom: 32 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-green-100/90">Online</span>
        </div>
        <p className="text-green-100 text-sm leading-relaxed mb-4">
          See how your investments could grow with a personalised plan built around your numbers.
        </p>
        <button
          type="button"
          onClick={() => {
            analytics.advisorCtaClicked("calculator_cta");
            window.open("https://wealthwithkwanele.co.za", "_blank", "noopener,noreferrer");
          }}
          className="block w-full py-3 bg-white text-green-800 rounded-xl font-bold text-center text-sm hover:bg-green-50 transition-colors"
        >
          Get Your Free Investment Plan
        </button>
      </div>
    </main>
  );
}

function useFundiState() {
  const progress = useProgress();
  const [dailyXP, setDailyXP] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === "undefined") return { name: "learn" } as Route;
    const onboarded = localStorage.getItem("fundi-onboarded");
    if (!onboarded) return { name: "onboarding" } as Route;
    const saved = localStorage.getItem("fundi-last-route");
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
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

  // Persist hearts to localStorage
  useEffect(() => {
    localStorage.setItem("fundi-hearts", String(hearts));
  }, [hearts]);
  useEffect(() => {
    if (lastHeartLostAt !== null) {
      localStorage.setItem("fundi-last-heart-lost", String(lastHeartLostAt));
    }
  }, [lastHeartLostAt]);

  // Auto-regen: 1 heart per hour
  useEffect(() => {
    if (hearts >= MAX_HEARTS || !lastHeartLostAt) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastHeartLostAt;
      const toAdd = Math.floor(elapsed / HEART_REGEN_MS);
      if (toAdd > 0) {
        setHearts((h) => Math.min(h + toAdd, MAX_HEARTS));
        setLastHeartLostAt(Date.now() - (elapsed % HEART_REGEN_MS));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [hearts, lastHeartLostAt]);

  const loseHeart = () => {
    setHearts((h) => {
      if (h <= 0) return h;
      const next = h - 1;
      localStorage.setItem("fundi-hearts", String(next));
      localStorage.setItem("fundi-last-heart-lost", String(Date.now()));
      if (next === 0) {
        queueMicrotask(() => setShowNoHearts(true));
      }
      return next;
    });
    setLastHeartLostAt(Date.now());
  };

  const gainHeart = () => {
    setHearts((h) => Math.min(h + 1, MAX_HEARTS));
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
    { id: "wc-3lessons", text: "Complete 3 lessons this week", target: 3, unit: "lessons", xp: 150 },
    { id: "wc-5streak", text: "Maintain your streak for 5 days", target: 5, unit: "streak_days", xp: 200 },
    { id: "wc-perfect", text: "Get a perfect score on 2 lessons", target: 2, unit: "perfect", xp: 250 },
    { id: "wc-100xp", text: "Earn 100 XP in a single day", target: 100, unit: "daily_xp", xp: 180 },
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

  const addXP = (amount: number) => {
    progress.addXP(amount);
    setDailyXP((v) => v + amount);
    setXpToast({ amount, id: Date.now() });
    setTimeout(() => setXpToast(null), 2000);
  };

  const completeLesson = (
    courseId: string,
    lessonId: string,
    xpEarned: number
  ): number | null => {
    progress.completeLesson(`${courseId}:${lessonId}`);
    const newStreak = progress.applyStreakAfterLesson();
    if (newStreak !== null) analytics.streakUpdated(newStreak);
    addXP(xpEarned);
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
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings"];
    if (simpleRoutes.includes(route.name)) {
      localStorage.setItem("fundi-last-route", route.name);
    }
  }, [route.name]);

  const value = {
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
      totalCompleted: progress.completedLessons.size,
      dailyXP,
      dailyGoal,
      badges: userBadges,
    } satisfies UserData,
    dailyXP,
    dailyGoal,
    setDailyGoal,
    resetProgress: progress.resetProgress,
    route,
    setRoute,
    isLessonCompleted,
    completeLesson,
    currentLessonState,
    setCurrentLessonState,
    newlyEarnedBadges,
    setNewlyEarnedBadges,
    xpToast,
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

const RECOMMENDED_READING_BOOKS: {
  title: string;
  author: string;
  lesson: string;
  color: string;
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}[] = [
  { title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", lesson: "Assets vs liabilities. Buy assets that put money in your pocket, not liabilities.", color: "#FFB612", Icon: Wallet },
  { title: "The Richest Man in Babylon", author: "George S. Clason", lesson: "Pay yourself first. Save at least 10% of everything you earn, always.", color: "#007A4D", Icon: Landmark },
  { title: "The Psychology of Money", author: "Morgan Housel", lesson: "Wealth is what you don't spend. Humility, patience and saving beats genius.", color: "#3B7DD8", Icon: Brain },
  { title: "The Millionaire Next Door", author: "Thomas J. Stanley", lesson: "Most millionaires live frugally in modest homes and drive ordinary cars.", color: "#7C4DFF", Icon: Hash },
  { title: "Think and Grow Rich", author: "Napoleon Hill", lesson: "A burning desire + a definite plan + persistent action builds lasting wealth.", color: "#E03C31", Icon: TrendingUp },
];

function LearnView({
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
}) {
  const [search, setSearch] = useState("");
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [goalDescription, setGoalDescription] = useState<string>("");
  const [goalBannerDismissed, setGoalBannerDismissed] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [pickerGoalId, setPickerGoalId] = useState<string>("");
  const [pickerGoalDescription, setPickerGoalDescription] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUserGoal(localStorage.getItem("fundi-user-goal"));
    setGoalDescription(localStorage.getItem("fundi-goal-description") ?? "");
    setGoalBannerDismissed(localStorage.getItem("fundi-goal-banner-dismissed") === "1");
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

  const todayFact = getDailyFact();

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

      {userGoal && !goalBannerDismissed && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Target size={18} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {GOAL_OPTIONS.find((g) => g.id === userGoal)?.label ?? userGoal}
                </p>
                {goalDescription && (
                  <p className="mt-0.5 text-xs text-green-700 dark:text-green-400 opacity-90 break-words">
                    {goalDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPickerGoalId(userGoal);
                  setPickerGoalDescription(goalDescription);
                  setShowGoalPicker(true);
                }}
                className="text-xs font-semibold text-green-600 dark:text-green-400"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoalBannerDismissed(true);
                  localStorage.setItem("fundi-goal-banner-dismissed", "1");
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                aria-label="Dismiss goal banner"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fact of the Day */}
      <div style={{
        background: "linear-gradient(135deg, rgba(0,122,77,0.08) 0%, rgba(255,182,18,0.06) 100%)",
        border: "1px solid rgba(0,122,77,0.2)", borderRadius: 14,
        padding: "14px 16px", marginBottom: 20,
        borderLeft: "4px solid var(--color-primary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 4 }}>
          <Lightbulb size={14} aria-hidden />
          Fact of the Day
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{todayFact}</div>
      </div>

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
      {weeklyChallenge && (
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
                  `Uses your learning streak (goal: ${weeklyChallenge.target} days)`}
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
                placeholder="Describe your goal — e.g. save for my child's education"
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
                  setGoalBannerDismissed(false);
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

function CourseView({
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
            type="number"
            inputMode="numeric"
            value={val}
            onChange={e => setVal(e.target.value.replace(/[^0-9.-]/g, ""))}
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
                <div style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
                  +{50 + correctCount * 10} XP earned
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
                      ✓ Done — Back to Course
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

function LessonView({
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
      // Extract a short tip from content — strip HTML tags and take first 80 chars
      const rawTip = step.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const tipText = rawTip.length > 80 ? rawTip.slice(0, 77) + "…" : rawTip;
      return (
        <>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 4 }}>
            {/* Speech bubble */}
            <div style={{
              background: "white",
              border: "1.5px solid #e5e7eb",
              borderLeft: "3px solid var(--color-primary)",
              borderRadius: 12,
              padding: "10px 14px",
              maxWidth: 260,
              marginBottom: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              position: "relative",
            }}>
              <p style={{ fontSize: 12, color: "#374151", fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>{tipText}</p>
              {/* bubble tail pointing down toward Fundi */}
              <div style={{
                position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
                borderTop: "8px solid white",
              }} />
            </div>
            <FundiCharacter expression="thinking" size={120} style={{ marginBottom: 4 }} />
          </div>
          <h2 className="step-title">{step.title}</h2>
          <div
            className="step-content"
            dangerouslySetInnerHTML={{ __html: step.content }}
          />
          <div className="lesson-actions">
            <button className="btn btn-primary" onClick={nextStep}>
              Continue
            </button>
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
            <button type="button" className="btn btn-primary" onClick={nextStep}>
              Continue
            </button>
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
                  Done — I did it!
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
                  <div style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>
                    +{50 + correctCount * 10} XP earned
                  </div>
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
                          <CheckCircle2 size={18} aria-hidden /> Done — Back to Course
                        </span>
                      </button>
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
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      +{50 + correctCount * 10} XP earned
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
                            Done — Back to Course
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
                    <div
                      style={{
                        color: "var(--color-text-secondary)",
                        marginBottom: 16,
                      }}
                    >
                      +{50 + correctCount * 10} XP earned
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
                            Done — Back to Course
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
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
        </div>
      </main>
    </>
  );
}

function ProfileView({
  userData,
  onSignOut,
  currentUser,
  dailyGoal,
  setDailyGoal,
  courseBadgeIds,
}: {
  userData: UserData;
  onSignOut: () => void;
  currentUser: any;
  dailyGoal: number;
  setDailyGoal: (n: number) => void;
  courseBadgeIds: string[];
}) {
  const [selectedBadge, setSelectedBadge] = useState<null | {
    name: string; desc: string; icon: React.ReactNode;
  }>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [investorQuizOpen, setInvestorQuizOpen] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScores, setQuizScores] = useState<number[]>([]);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [investorProfileLabel, setInvestorProfileLabel] = useState<string | null>(null);
  const [profileGoal, setProfileGoal] = useState<string | null>(null);
  const [profileGoalDescription, setProfileGoalDescription] = useState<string>("");

  // Load goal from localStorage for the goal lookback card
  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileGoal(localStorage.getItem("fundi-user-goal"));
    setProfileGoalDescription(localStorage.getItem("fundi-goal-description") ?? "");
  }, []);

  // Load name, show update form if no real full_name exists
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      setProfileEmail(user.email ?? "");
      const meta = user.user_metadata;
      const fullName = meta?.full_name ?? "";
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, age, investor_profile")
        .eq("user_id", user.id)
        .maybeSingle();
      const row = prof as { full_name?: string; age?: number | null; investor_profile?: string | null } | null;
      if (row?.age != null) setEditAge(String(row.age));
      if (row?.investor_profile) setInvestorProfileLabel(row.investor_profile);
      const nameFromProfile = row?.full_name?.trim();
      const display = nameFromProfile || fullName;
      const isMissing =
        !display ||
        display.includes("@") ||
        display === user.email?.split("@")[0];
      if (!isMissing) {
        setProfileName(display);
        const parts = display.split(" ");
        setEditFirstName(parts[0] ?? "");
        setEditLastName(parts.slice(1).join(" ") ?? "");
      } else {
        setNeedsProfileUpdate(true);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("fundi-investor-profile");
      if (raw) {
        const j = JSON.parse(raw) as { profile?: string };
        if (j.profile) setInvestorProfileLabel(j.profile);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const showQuizResult =
    investorQuizOpen && quizIdx >= INVESTOR_QUIZ_QUESTIONS.length;
  useEffect(() => {
    if (showQuizResult) {
      analytics.advisorCtaShown("investor_quiz");
    }
  }, [showQuizResult]);

  const handleSaveProfile = async () => {
    const firstName = editFirstName.trim();
    const lastName = editLastName.trim();
    const ageTrim = editAge.trim();
    const ageNum =
      ageTrim === "" ? null : parseInt(ageTrim, 10);
    if (!firstName) { setSaveError("Please enter your first name."); return; }
    if (!lastName) { setSaveError("Please enter your last name."); return; }
    if (
      ageTrim !== "" &&
      (ageNum === null || Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120)
    ) {
      setSaveError("Please enter a valid age (13–120) or leave blank.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const fullName = firstName + " " + lastName;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not signed in");
      const metaPayload: Record<string, unknown> = { full_name: fullName };
      if (ageNum != null) metaPayload.age = ageNum;
      const { error: updateError } = await supabase.auth.updateUser({
        data: metaPayload,
      });
      if (updateError) throw updateError;
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: fullName,
        age: ageNum,
      }, { onConflict: "user_id" });
      await supabase.from("user_progress").upsert(
        { user_id: user.id, display_name: fullName },
        { onConflict: "user_id" }
      );
      setProfileName(fullName);
      setNeedsProfileUpdate(false);
      setEditingProfile(false);
      setSaveToast("Profile saved.");
      setTimeout(() => setSaveToast(null), 2500);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = profileName || "Learner";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "FL";

  const tc = userData.totalCompleted;
  const str = userData.streak;
  const xpv = userData.xp;
  // perfectLessons tracked via localStorage (incremented on 100% score)
  const perfectLessons = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10) : 0;

  const BADGE_DEFS = [
    // Lesson milestones (ids align with lesson completion thresholds)
    { id: "lesson-1-badge",   name: "First Step",       desc: "Completed your first lesson",     icon: <CheckCircle2 size={22} className="text-current" />, earned: tc >= 1 },
    { id: "lesson-5-badge",   name: "Getting Going",    desc: "Completed 5 lessons",             icon: <BookOpen size={22} className="text-current" />,     earned: tc >= 5 },
    { id: "lesson-10-badge",  name: "On a Roll",        desc: "Completed 10 lessons",            icon: <TrendingUp size={22} className="text-current" />,   earned: tc >= 10 },
    { id: "lesson-25-badge",  name: "Dedicated",        desc: "Completed 25 lessons",            icon: <Target size={22} className="text-current" />,       earned: tc >= 25 },
    { id: "lesson-50-badge",  name: "Half Century",     desc: "Completed 50 lessons",            icon: <Trophy size={22} className="text-current" />,       earned: tc >= 50 },
    { id: "lesson-100-badge", name: "Centurion",        desc: "Completed 100 lessons",           icon: <Trophy size={22} className="text-current" />,       earned: tc >= 100 },
    // Streak milestones
    { id: "streak-3-badge",   name: "3 Day Streak",     desc: "Learned 3 days in a row",        icon: <Flame size={22} className="text-current" />,        earned: str >= 3 },
    { id: "streak-7-badge",   name: "Week Warrior",     desc: "7-day learning streak",          icon: <Flame size={22} className="text-current" />,        earned: str >= 7 },
    { id: "streak-14-badge",  name: "Two Weeks Strong", desc: "14-day learning streak",         icon: <Zap size={22} className="text-current" />,          earned: str >= 14 },
    { id: "streak-30-badge",  name: "Monthly Habit",    desc: "30-day learning streak",         icon: <Zap size={22} className="text-current" />,          earned: str >= 30 },
    { id: "streak-60-badge",  name: "Unstoppable",      desc: "60-day learning streak",         icon: <Trophy size={22} className="text-current" />,       earned: str >= 60 },
    { id: "streak-100-badge", name: "Legendary",        desc: "100-day learning streak",        icon: <Trophy size={22} className="text-current" />,       earned: str >= 100 },
    // XP milestones
    { id: "xp-100-badge",     name: "First 100",        desc: "Earned 100 XP",                  icon: <Zap size={22} className="text-current" />,          earned: xpv >= 100 },
    { id: "xp-500-badge",     name: "XP Builder",       desc: "Earned 500 XP",                  icon: <Zap size={22} className="text-current" />,          earned: xpv >= 500 },
    { id: "xp-1000-badge",    name: "Knowledge Is Power", desc: "Earned 1 000 XP",              icon: <Brain size={22} className="text-current" />,        earned: xpv >= 1000 },
    { id: "xp-5000-badge",    name: "Finance Pro",      desc: "Earned 5 000 XP",                icon: <Wallet size={22} className="text-current" />,       earned: xpv >= 5000 },
    // Perfect lesson milestones
    { id: "perfect-1-badge",  name: "Flawless",         desc: "Got a perfect score on a lesson", icon: <CheckCircle2 size={22} className="text-current" />, earned: perfectLessons >= 1 },
    { id: "perfect-5-badge",  name: "Sharp Mind",       desc: "5 perfect lesson scores",         icon: <Brain size={22} className="text-current" />,        earned: perfectLessons >= 5 },
    { id: "perfect-10-badge", name: "Untouchable",      desc: "10 perfect lesson scores",        icon: <Trophy size={22} className="text-current" />,       earned: perfectLessons >= 10 },
  ];

  const earnedProgressBadges = BADGE_DEFS.filter((b) => b.earned);
  const earnedCourseBadgeItems = courseBadgeIds
    .map((bid) => Object.values(COURSE_BADGES).find((b) => b.id === bid))
    .filter((b): b is (typeof COURSE_BADGES)[string] => Boolean(b))
    .map((b) => ({
      id: b.id,
      name: b.name,
      desc: b.description,
      icon: <Trophy size={22} style={{ color: b.color }} aria-hidden />,
    }));

  const earnedBadges = [...earnedProgressBadges, ...earnedCourseBadgeItems];

  const BadgeIcon = ({ id }: { id: string }) => {
    const icons: Record<string, React.ReactNode> = {
      "first-lesson":   <CheckCircle2 size={24} className="text-current" />,
      "five-lessons":   <BookOpen size={24} className="text-current" />,
      "ten-lessons":    <Flame size={24} className="text-current" />,
      "twenty-lessons": <Target size={24} className="text-current" />,
      "streak-3":       <Zap size={24} className="text-current" />,
      "streak-7":       <Zap size={24} className="text-current" />,
      "xp-500":         <Trophy size={24} className="text-current" />,
      "xp-2000":        <Wallet size={24} className="text-current" />,
    };
    return <>{icons[id] ?? <Trophy size={24} className="text-current" />}</>;
  };

  return (
    <main className="main-content main-with-stats">
      {/* ── Avatar + name ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 16px" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", marginBottom: 12,
          background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "white",
          boxShadow: "0 4px 16px rgba(0,122,77,0.25)",
        }}>{initials}</div>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 2 }}>{displayName.split(" ")[0]}</div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Financial Learner · Level {userData.level}</div>
        {investorProfileLabel && (() => {
          const st =
            INVESTOR_PROFILE_STYLES[investorProfileLabel] ??
            INVESTOR_PROFILE_STYLES["Moderate"];
          return (
            <div
              className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${st.bg} ${st.darkBg} ${st.color}`}
            >
              <Award size={16} className="shrink-0" aria-hidden />
              <span>{investorProfileLabel} Investor</span>
            </div>
          );
        })()}
      </div>

      {/* ── My Goal card ── */}
      {profileGoal && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 14, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14 }}>
              <Target size={16} style={{ color: "var(--color-primary)" }} aria-hidden />
              My Goal
            </div>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: profileGoalDescription ? 4 : 0 }}>
            {GOAL_OPTIONS.find((g) => g.id === profileGoal)?.label ?? profileGoal}
          </p>
          {profileGoalDescription && (
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              {profileGoalDescription}
            </p>
          )}
          {!profileGoalDescription && (
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
              Go to the Learn tab and tap &ldquo;Edit&rdquo; on your goal to add more detail.
            </p>
          )}
        </div>
      )}

      {needsProfileUpdate && !editingProfile && (
        <div style={{
          background: "var(--color-primary-light, #E8F5EE)",
          border: "1.5px solid var(--color-primary)",
          borderRadius: 14, padding: "16px", marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--color-primary)" }}>
            Complete your profile
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>
            Add your name so we can personalise your experience and show you on the leaderboard.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => {
              setEditingProfile(true);
              if (!editFirstName && profileName) {
                const parts = profileName.split(" ");
                setEditFirstName(parts[0] ?? "");
                setEditLastName(parts.slice(1).join(" ") ?? "");
              }
            }}
          >
            Add details
          </button>
        </div>
      )}

      {/* ── Stat row ── */}
      <div style={{
        display: "flex", background: "var(--color-surface)",
        border: "1px solid var(--color-border)", borderRadius: 14,
        marginBottom: 16, overflow: "hidden",
      }}>
        {[
          { label: "XP", value: formatWithSpaces(userData.xp), color: "var(--color-primary)" },
          { label: "Level", value: userData.level, color: "var(--color-text-primary)" },
          { label: "Streak", value: userData.streak, color: "#FFB612" },
          { label: "Lessons", value: userData.totalCompleted, color: "var(--color-text-primary)" },
        ].map((stat, i, arr) => (
          <div key={stat.label} style={{
            flex: 1, textAlign: "center", padding: "14px 8px",
            borderRight: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {saveToast && (
        <div style={{
          background: "rgba(0,122,77,0.12)", border: "1px solid var(--color-primary)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--color-primary)",
        }}>{saveToast}</div>
      )}

      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-secondary" onClick={() => {
          setEditingProfile(true);
          const parts = profileName.split(" ");
          setEditFirstName(parts[0] ?? "");
          setEditLastName(parts.slice(1).join(" ") ?? "");
        }}>
          Edit Profile
        </button>
      </div>

      {editingProfile && (
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Profile details</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text" placeholder="First name" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
            <input type="text" placeholder="Last name" value={editLastName} onChange={(e) => setEditLastName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }} />
          </div>
          <input type="number" placeholder="Age (optional)" value={editAge} min={13} max={120}
            onChange={(e) => setEditAge(e.target.value.replace(/\D/g, ""))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, marginBottom: 8, boxSizing: "border-box" as const }} />
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>Daily XP goal</label>
            <select value={dailyGoal} onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              setDailyGoal(v);
              localStorage.setItem("fundi-daily-goal", String(v));
            }} style={{ width: "100%", marginTop: 4, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}>
              {[25, 50, 100, 150, 200].map((g) => (
                <option key={g} value={g}>{g} XP / day</option>
              ))}
            </select>
          </div>
          {saveError && <p style={{ color: "var(--error-red)", fontSize: 12 }}>{saveError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSaveProfile}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingProfile(false);
                setSaveError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14,
        padding: 16, marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontWeight: 800 }}>Investor Profile</div>
          {investorProfileLabel && (() => {
            const st =
              INVESTOR_PROFILE_STYLES[investorProfileLabel] ??
              INVESTOR_PROFILE_STYLES["Moderate"];
            return (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.bg} ${st.darkBg} ${st.color}`}
              >
                <Award size={14} className="shrink-0" aria-hidden />
                {investorProfileLabel}
              </span>
            );
          })()}
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>
          {investorProfileLabel
            ? `Your style: ${investorProfileLabel}`
            : "Take a 10-question quiz to see how you think about risk and investing."}
        </p>
        <button type="button" className="btn btn-primary" onClick={() => {
          setInvestorQuizOpen(true);
          setQuizIdx(0);
          setQuizScores([]);
          setQuizSelected(null);
        }}>
          {investorProfileLabel ? "Retake Quiz" : "Take Quiz"}
        </button>
      </div>

      {investorQuizOpen && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            {quizIdx >= INVESTOR_QUIZ_QUESTIONS.length ? (
              (() => {
                const total = quizScores.reduce((a, b) => a + b, 0);
                const res = getInvestorProfile(total);
                return (
                  <div>
                    <div className="flex justify-center mb-2">
                      <Award size={56} style={{ color: res.color }} aria-hidden />
                    </div>
                    <h2 className="text-xl font-black text-center text-gray-900 dark:text-white">{res.profile} Investor</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{res.description}</p>
                    <p className="text-xs font-semibold mt-3 text-gray-700 dark:text-gray-200">{res.allocation}</p>
                    <ul className="text-sm mt-2 list-disc pl-5 text-gray-700 dark:text-gray-200">
                      {res.products.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                    <div className="flex flex-col gap-2 mt-6">
                      <button type="button" className="btn btn-primary w-full" onClick={async () => {
                        analytics.investorQuizCompleted(res.profile, total);
                        const payload = { profile: res.profile, total, savedAt: Date.now() };
                        localStorage.setItem("fundi-investor-profile", JSON.stringify(payload));
                        setInvestorProfileLabel(res.profile);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          await supabase.from("profiles").upsert(
                            { user_id: user.id, investor_profile: res.profile } as Record<string, unknown>,
                            { onConflict: "user_id" }
                          );
                        }
                        setInvestorQuizOpen(false);
                        setSaveToast("Investor profile saved.");
                        setTimeout(() => setSaveToast(null), 2500);
                      }}>Save to Profile</button>
                      <button
                        type="button"
                        className="btn btn-secondary w-full"
                        onClick={() => {
                          setQuizIdx(0);
                          setQuizScores([]);
                          setQuizSelected(null);
                        }}
                      >
                        Retake Quiz
                      </button>
                      <button type="button" className="btn btn-secondary w-full" onClick={() => setInvestorQuizOpen(false)}>Close</button>
                    </div>
                    <div className="mt-4 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-5 text-white">
                      <p className="text-xs font-bold uppercase tracking-widest text-green-200 mb-1">
                        Built for your profile
                      </p>
                      <p className="text-green-100 text-sm mb-4 leading-relaxed">
                        As a {res.profile} investor, here&apos;s what a personalised portfolio could look like — get a free plan in 30 minutes.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          analytics.advisorCtaClicked("investor_quiz");
                          window.open("https://wealthwithkwanele.co.za", "_blank", "noopener,noreferrer");
                        }}
                        className="block w-full py-3 bg-white text-green-800 rounded-xl font-bold text-center hover:bg-green-50 transition-colors"
                      >
                        Get Your {res.profile} Investment Plan
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                  Question {quizIdx + 1} of {INVESTOR_QUIZ_QUESTIONS.length}
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                  <div className="h-2 bg-green-600 rounded-full transition-all" style={{ width: `${((quizIdx + 1) / INVESTOR_QUIZ_QUESTIONS.length) * 100}%` }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {INVESTOR_QUIZ_QUESTIONS[quizIdx].question}
                </h3>
                <div className="flex flex-col gap-2">
                  {INVESTOR_QUIZ_QUESTIONS[quizIdx].options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      className={`text-left px-4 py-3 rounded-xl border-2 transition-colors text-gray-900 dark:text-gray-100 ${
                        quizSelected === oi
                          ? "border-green-600 bg-green-50 dark:bg-green-900/30 dark:border-green-500"
                          : "border-gray-200 dark:border-gray-600 hover:border-green-600 dark:hover:border-green-500"
                      }`}
                      onClick={() => setQuizSelected(oi)}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-full mt-4"
                  disabled={quizSelected === null}
                  onClick={() => {
                    const oi = quizSelected;
                    if (oi === null) return;
                    const opt = INVESTOR_QUIZ_QUESTIONS[quizIdx].options[oi];
                    setQuizScores((prev) => [...prev, opt.score]);
                    setQuizIdx((i) => i + 1);
                    setQuizSelected(null);
                  }}
                >
                  Next
                </button>
                <button type="button" className="mt-3 w-full text-sm text-gray-500 dark:text-gray-400" onClick={() => setInvestorQuizOpen(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-5 text-white">
        <div className="mb-3 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-300 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-green-100/90">Online</span>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-green-100">
          Turn what you&apos;ve learned into a real plan. Get a personalised roadmap for your money goals in 30 minutes.
        </p>
        <button
          type="button"
          onClick={() => {
            analytics.advisorCtaClicked("profile_cta");
            window.open("https://wealthwithkwanele.co.za", "_blank", "noopener,noreferrer");
          }}
          className="block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-green-800 transition-colors hover:bg-green-50"
        >
          Get Your Free Financial Roadmap
        </button>
      </div>

      {/* ── Earned badges ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Trophy size={18} style={{ color: "var(--color-primary)" }} aria-hidden />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Your Badges</span>
        </div>
        {earnedBadges.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
            Complete lessons to earn your first badge!
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {earnedBadges.map((badge) => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge({ name: badge.name, desc: badge.desc, icon: badge.icon })}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
                  borderRadius: 14, padding: "14px 8px", cursor: "pointer",
                  transition: "transform 0.15s", color: "var(--color-primary)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span style={{ color: "var(--color-primary)" }}>{badge.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "var(--color-text-primary)" }}>{badge.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Recommended Reading ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <BookOpen size={18} style={{ color: "var(--color-primary)" }} aria-hidden />
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>
            Recommended Reading
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
          {RECOMMENDED_READING_BOOKS.map((book) => {
            const BookIcon = book.Icon;
            return (
            <div
              key={book.title}
              style={{
                minWidth: 180,
                background: "var(--color-surface)",
                border: `1.5px solid ${book.color}40`,
                borderRadius: 14,
                padding: "14px 14px 12px",
                flexShrink: 0,
                borderTop: `4px solid ${book.color}`,
              }}
            >
              <div style={{ marginBottom: 6, color: book.color }}>
                <BookIcon size={28} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 2, color: "var(--color-text-primary)" }}>{book.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8 }}>{book.author}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{book.lesson}</div>
            </div>
            );
          })}
        </div>
      </div>

      {/* ── Free financial guides ── */}
      <div style={{ marginBottom: 24 }}>
        <a
          href="https://www.wealthwithkwanele.co.za/#resources"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{
            width: "100%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
            boxSizing: "border-box" as const,
          }}
        >
          <ExternalLink size={18} aria-hidden />
          Free Financial Guides
        </a>
      </div>

      {/* ── Sign out ── */}
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--color-danger)" }}
      >
        <LogOut size={18} className="text-current" />
        Sign Out
      </button>

      {/* ── Badge detail modal ── */}
      {selectedBadge && (
        <div
          onClick={() => setSelectedBadge(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)", borderRadius: "20px 20px 14px 14px",
              padding: "28px 24px 24px", width: "100%", maxWidth: 400, textAlign: "center",
            }}
          >
            <div style={{ color: "var(--color-primary)", marginBottom: 8, display: "flex", justifyContent: "center" }}>{selectedBadge.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: "var(--color-text-primary)" }}>{selectedBadge.name}</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>{selectedBadge.desc}</p>

            <button className="btn btn-primary" onClick={() => setSelectedBadge(null)}>Got it</button>
          </div>
        </div>
      )}
    </main>
  );
}

function LeaderboardView({ xp, currentUserId }: { xp: number; currentUserId?: string }) {
  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; isYou: boolean; rank: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const myId = user?.id ?? currentUserId ?? null;

        const { data: progressRows, error } = await supabase
          .from("user_progress")
          .select("user_id, xp")
          .order("xp", { ascending: false })
          .limit(50);

        if (error || !progressRows) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        const userIds = progressRows.map((r: any) => r.user_id);
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        (profileRows ?? []).forEach((p: any) => {
          if (p.full_name) nameMap[p.user_id] = p.full_name.split(" ")[0];
        });

        const rows = progressRows.map((row: any, idx: number) => {
          const isYou = row.user_id === myId;
          const name = isYou
            ? "You"
            : (nameMap[row.user_id] ?? "Learner " + row.user_id.slice(0, 4).toUpperCase());
          return { id: row.user_id, name, xp: row.xp ?? 0, isYou, rank: idx + 1 };
        });

        const alreadyIn = rows.some((r) => r.isYou);
        if (!alreadyIn && myId) {
          const myName = user?.user_metadata?.full_name?.split(" ")[0] ?? "You";
          rows.push({ id: myId, name: "You (" + myName + ")", xp, isYou: true, rank: rows.length + 1 });
          rows.sort((a, b) => b.xp - a.xp);
          rows.forEach((r, i) => { r.rank = i + 1; });
        }

        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, currentUserId, retryCount]);

  const myRank = leaders.find((l) => l.isYou);
  const myIndex = leaders.findIndex((l) => l.isYou);
  const aheadOfMe = myIndex > 0 ? leaders[myIndex - 1] : null;
  const xpToNext = aheadOfMe && myRank ? aheadOfMe.xp - myRank.xp : null;

  // Top 3 podium + nearby section
  const top3 = leaders.slice(0, 3);
  const restLeaders = leaders.slice(3);

  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Leaderboard</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>
        Compete with other learners for the top spot
      </p>

      {/* Your rank summary card */}
      {myRank && !loading && (
        <div style={{
          background: "linear-gradient(135deg, rgba(0,122,77,0.1) 0%, rgba(255,182,18,0.06) 100%)",
          border: "2px solid var(--color-primary)",
          borderRadius: 16, padding: "16px 18px", marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-primary)", marginBottom: 4 }}>
                Your Rank
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "var(--color-text-primary)", lineHeight: 1 }}>
                #{myRank.rank}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)", marginTop: 4 }}>
                {formatWithSpaces(myRank.xp)} XP
              </div>
            </div>
            {xpToNext !== null && xpToNext > 0 && aheadOfMe && (
              <div style={{
                background: "var(--color-surface)", borderRadius: 12, padding: "10px 14px",
                border: "1px solid var(--color-border)", textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", letterSpacing: "0.06em", marginBottom: 2 }}>
                  To overtake {aheadOfMe.name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#FFB612" }}>
                  {formatWithSpaces(xpToNext)} XP
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                  ≈ {Math.ceil(xpToNext / 60)} lessons away
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>Loading leaderboard...</div>
          <div style={{ width: "100%", height: 6, background: "var(--color-border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", background: "var(--color-primary)", borderRadius: 3, animation: "slide-right 1.2s ease-in-out infinite" }} />
          </div>
        </div>
      ) : loadError ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <AlertTriangle size={40} style={{ color: "var(--color-secondary)" }} aria-hidden />
          </div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Could not load leaderboard</div>
          <div style={{ color: "var(--color-text-secondary)", marginBottom: 16, fontSize: 14 }}>Check your connection and try again.</div>
          <button className="btn btn-primary" onClick={() => setRetryCount(n => n + 1)}>Retry</button>
        </div>
      ) : leaders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>
          No players yet. Be the first to earn XP!
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 3 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, marginBottom: 24 }}>
              {/* 2nd place */}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 6px",
                  background: "#C0C0C0", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "white",
                  border: top3[1].isYou ? "3px solid var(--color-primary)" : "3px solid #C0C0C0",
                }}>{top3[1].name[0].toUpperCase()}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>{top3[1].name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF" }}>{formatWithSpaces(top3[1].xp)} XP</div>
                <div style={{ background: "#C0C0C0", borderRadius: "8px 8px 0 0", height: 60, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "white" }}>2</span>
                </div>
              </div>
              {/* 1st place */}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                  <Trophy size={20} style={{ color: "#FFB612" }} />
                </div>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", margin: "0 auto 6px",
                  background: "#FFB612", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "white",
                  border: top3[0].isYou ? "3px solid var(--color-primary)" : "3px solid #FFB612",
                  boxShadow: "0 4px 16px rgba(255,182,18,0.35)",
                }}>{top3[0].name[0].toUpperCase()}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--color-text-primary)" }}>{top3[0].name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FFB612" }}>{formatWithSpaces(top3[0].xp)} XP</div>
                <div style={{ background: "#FFB612", borderRadius: "8px 8px 0 0", height: 80, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: "white" }}>1</span>
                </div>
              </div>
              {/* 3rd place */}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", margin: "0 auto 6px",
                  background: "#CD7F32", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900, color: "white",
                  border: top3[2].isYou ? "3px solid var(--color-primary)" : "3px solid #CD7F32",
                }}>{top3[2].name[0].toUpperCase()}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>{top3[2].name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#CD7F32" }}>{formatWithSpaces(top3[2].xp)} XP</div>
                <div style={{ background: "#CD7F32", borderRadius: "8px 8px 0 0", height: 44, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "white" }}>3</span>
                </div>
              </div>
            </div>
          )}

          {/* Rest of leaderboard */}
          <div style={{
            background: "var(--color-surface)", color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)", borderRadius: 16, overflow: "hidden",
          }}>
            {restLeaders.map((leader) => {
              const prevLeader = leaders[leader.rank - 2]; // person above
              return (
                <div
                  key={leader.id}
                  className="leaderboard-row"
                  style={{
                    ...(leader.isYou ? { background: "rgba(0,122,77,0.08)", borderLeft: "4px solid var(--color-primary)" } : {}),
                    display: "flex", alignItems: "center", padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{
                    width: 32, textAlign: "center", fontSize: 14, fontWeight: 800,
                    color: leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                    flexShrink: 0,
                  }}>
                    {leader.rank}
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", marginLeft: 10, marginRight: 12,
                    background: leader.isYou ? "var(--color-primary)" : "#eee",
                    color: leader.isYou ? "white" : "#555",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}>
                    {leader.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                      {leader.name}
                      {leader.isYou && (
                        <span style={{ fontSize: 10, background: "var(--color-primary)", color: "white", borderRadius: 999, padding: "2px 8px", fontWeight: 700 }}>You</span>
                      )}
                    </div>
                    {leader.isYou && prevLeader && prevLeader.xp > leader.xp && (
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {formatWithSpaces(prevLeader.xp - leader.xp)} XP to #{leader.rank - 1}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 14, flexShrink: 0,
                    color: leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}>
                    {formatWithSpaces(leader.xp)} XP
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}

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

function SettingsView({
  userData,
  setDailyGoal,
  resetProgress,
}: {
  userData: UserData;
  setDailyGoal: (goal: number) => void;
  resetProgress: () => void;
}) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() =>
    typeof window === "undefined" ? true : localStorage.getItem("fundi-sound-enabled") !== "false"
  );
  const [selectedGoal, setSelectedGoal] = useState<number>(() => {
    if (typeof window === "undefined") return 50;
    return parseInt(localStorage.getItem("fundi-daily-goal") ?? "50", 10);
  });

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("fundi-sound-enabled", String(next));
  };

  const handleGoal = (g: number) => {
    setSelectedGoal(g);
    setDailyGoal(g);
    localStorage.setItem("fundi-daily-goal", String(g));
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

function DarkModeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("fundi-dark-mode") === "true" ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches && !localStorage.getItem("fundi-dark-mode"));
  });

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
        onClick={() => setDark(d => !d)}
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

function StatsPanel({ userData }: { userData: UserData }) {
  const goalProgress = Math.min(
    (userData.dailyXP / userData.dailyGoal) * 100,
    100
  );
  return (
    <aside className="stats-panel" id="statsPanel">
      <div className="stats-section">
        <h3>My Stats</h3>
        <div className="stat-item" style={{ position: "relative" }}>
          <div className="stat-icon">
            <Flame size={28} className="text-current" />
          </div>
          <div className="stat-content" style={{ flex: 1 }}>
            <div className="stat-label">Day Streak</div>
            <div className="stat-value" id="streakValue">
              {userData.streak}
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              const text = generateShareText("streak", { streakDays: userData.streak });
              if (typeof navigator !== "undefined" && navigator.share) {
                try {
                  await navigator.share({ text });
                  return;
                } catch {
                  /* ignore */
                }
              }
              window.open(
                `https://wa.me/?text=${encodeURIComponent(text)}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
            className="text-orange-400 hover:text-orange-600"
            title="Share your streak"
            aria-label="Share your streak"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}
          >
            <Share2 size={18} aria-hidden />
          </button>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Zap size={28} className="text-current" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total XP</div>
            <div className="stat-value" id="xpValue">
              {formatWithSpaces(userData.xp)}
            </div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <Target size={28} className="text-current" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Level</div>
            <div className="stat-value" id="levelValue">
              {userData.level}
            </div>
          </div>
        </div>
      </div>
      <div className="stats-section">
        <h3>Daily Goal</h3>
        <div className="daily-goal-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              id="dailyGoalFill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>
          <div className="progress-text" id="dailyGoalText">
            {userData.dailyXP} / {userData.dailyGoal} XP
          </div>
        </div>
      </div>
    </aside>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<unknown | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [splashMinElapsed, setSplashMinElapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { setError("Please enter your email."); return; }
    setError(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (e) { setError(e.message); return; }
    setForgotSent(true);
  };

  useEffect(() => {
    const t = setTimeout(() => setSplashMinElapsed(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setSessionLoading(false);
      })
      .catch(() => {
        if (mounted) setSessionLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (e) setError(e.message);
  };

  const handleSignUp = async () => {
    setError(null);
    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!lastName.trim()) { setError("Please enter your last name."); return; }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      setError("Please enter a valid age (13+).");
      return;
    }
    const fullName = firstName.trim() + " " + lastName.trim();
    const { data, error: e } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, age: ageNum } },
    });
    if (e) { setError(e.message); return; }
    // Also write to profiles table for leaderboard display
    if (data.user) {
      await supabase.from("profiles").upsert({
        user_id: data.user.id,
        full_name: fullName,
        age: ageNum,
      }, { onConflict: "user_id" });
    }
  };

  if (sessionLoading || !splashMinElapsed) {
    return (
      <>
        <style>{`
          @keyframes fundiFadeIn {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fundiBob {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-10px); }
          }
          @keyframes fundiTextIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .splash-logo {
            animation: fundiFadeIn 0.6s ease-out forwards, fundiBob 2.4s 0.6s ease-in-out infinite;
          }
          .splash-title {
            animation: fundiTextIn 0.5s 0.7s ease-out both;
          }
          .splash-tagline {
            animation: fundiTextIn 0.5s 1s ease-out both;
          }
        `}</style>
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "radial-gradient(ellipse at 50% 40%, #163328 0%, #0d1f17 70%)",
          position: "relative", overflow: "hidden",
        }}>
          {/* subtle glow ring behind logo */}
          <div style={{
            position: "absolute", width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.13) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <img
            src="/fundi-logo.png"
            alt="Fundi Finance"
            className="splash-logo"
            style={{ width: 280, height: 280, objectFit: "contain", marginBottom: 20, position: "relative" }}
          />
          <div className="splash-title" style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
            Fundi Finance
          </div>
          <div className="splash-tagline" style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500 }}>
            Your Financial Journey Starts Here
          </div>
        </div>
      </>
    );
  }

  const inputStyle = {
    padding: 12, borderRadius: 8,
    border: "1px solid var(--border-light)", fontSize: 14, width: "100%",
    boxSizing: "border-box" as const,
  };

  if (!session) {
    // Forgot password screen
    if (forgotMode) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
          <div style={{ background: "white", padding: 28, borderRadius: 20, border: "2px solid var(--border-light)", maxWidth: 420, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <KeyRound size={48} style={{ color: "var(--color-primary)" }} aria-hidden />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Reset your password</h2>
              <p style={{ color: "#888", fontSize: 14 }}>We&apos;ll send you a reset link</p>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <Mail size={48} style={{ color: "var(--color-primary)" }} aria-hidden />
                </div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Email sent!</p>
                <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
                  Check your inbox for a password reset link.
                </p>
                <button className="btn btn-primary" style={{ width: "100%" }}
                  onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input type="email" placeholder="Your email address" value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border-light)", fontSize: 14, width: "100%", boxSizing: "border-box" as const }} />
                {error && <p style={{ color: "var(--error-red)", fontSize: 13, margin: 0 }}>{error}</p>}
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleForgotPassword}>
                  Send Reset Link
                </button>
                <button onClick={() => { setForgotMode(false); setError(null); }}
                  style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13, textAlign: "center" }}>
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center" style={{ padding: 16, background: "linear-gradient(160deg, #0d1f17 0%, #1a3a28 100%)" }}>
        <div style={{ background: "white", padding: 28, borderRadius: 20, border: "none", maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.28)", overflow: "hidden", position: "relative" }}>
          {/* brand accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "var(--color-primary)", borderRadius: "20px 20px 0 0" }} />
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20, marginTop: 8 }}>
            <img src="/fundi-logo.png" alt="" width={100} height={100} style={{ objectFit: "contain" }} />
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Fundi Finance</h1>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", background: "#f5f5f5", borderRadius: 10, padding: 3, marginBottom: 20 }}>
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(null); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "var(--color-primary)" : "#888",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}>
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mode === "signup" && (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="text" placeholder="First name" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                  <input type="text" placeholder="Last name" value={lastName}
                    onChange={(e) => setLastName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
                <input type="number" placeholder="Age" value={age} min={13} max={120}
                  inputMode="numeric"
                  onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
                  onChange={(e) => setAge(e.target.value.replace(/D/g, ""))} style={inputStyle} />
              </>
            )}
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#888", fontSize: 13, fontWeight: 600, padding: "2px 4px",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {error && <p style={{ color: "var(--error-red)", fontSize: 13, margin: 0 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
              onClick={mode === "signin" ? handleSignIn : handleSignUp}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
            {mode === "signin" && (
              <div style={{ textAlign: "center" }}>
                <button onClick={() => { setForgotMode(true); setError(null); }}
                  style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13 }}>
                  Forgot password?
                </button>
                <p style={{ fontSize: 13, color: "#888", margin: "8px 0 0" }}>
                  New here?{" "}
                  <button onClick={() => setMode("signup")}
                    style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    Create a free account
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function routePageLabel(route: Route): string {
  switch (route.name) {
    case "learn":
      return "learn";
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
    progressReady,
    userData,
    dailyXP,
    dailyGoal,
    setDailyGoal,
    resetProgress: resetProgressState,
    route,
    setRoute,
    isLessonCompleted,
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
  } = useFundiState();

  const streakFreezeActive: boolean =
    typeof window !== "undefined" && localStorage.getItem("fundi-streak-freeze") === "true";
  const buyStreakFreeze = () => {
    if (typeof window === "undefined" || streakFreezeActive) return;
    if (userData.xp < 50) return;
    if (!tryDeductXp(50)) return;
    localStorage.setItem("fundi-streak-freeze", "true");
    window.location.reload();
  };

  const [showMilestoneCta, setShowMilestoneCta] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedLessonProgress | null>(null);
  const lessonStartTimeRef = useRef(0);
  const lessonHeartLostRef = useRef(false);
  const lessonStateRef = useRef(currentLessonState);
  lessonStateRef.current = currentLessonState;

  const beginLessonSession = React.useCallback(
    (courseId: string, lessonId: string, lessonTitle: string) => {
      lessonStartTimeRef.current = Date.now();
      lessonHeartLostRef.current = false;
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
    analytics.pageViewed(routePageLabel(route));
  }, [route]);

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

  // Weekly leaderboard XP reset, resets every Sunday at midnight
  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = new Date();
    const weekKey = `fundi-week-${now.getFullYear()}-W${Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
    const lastWeekKey = localStorage.getItem("fundi-last-week-key");
    if (lastWeekKey && lastWeekKey !== weekKey) {
      // New week, reset weekly XP tracking (but keep total XP and progress)
      localStorage.setItem("fundi-weekly-xp", "0");
      // Sync reset to Supabase for leaderboard
      supabase.auth.getUser().then(async ({ data }) => {
        if (data.user) {
          const { error } = await supabase.from("user_progress").upsert(
            {
              user_id: data.user.id,
              weekly_xp: 0,
              week_key: weekKey,
            },
            { onConflict: "user_id" }
          );
          if (error) {
            // silent fail, offline is fine
          }
        }
      });
    }
    localStorage.setItem("fundi-last-week-key", weekKey);
  }, []);

  // Cross-device sync, fetch latest progress from Supabase and hydrate localStorage
  useEffect(() => {
    const syncFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_progress")
        .select("xp, streak, completed_lessons, last_activity_date")
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
      if (data.completed_lessons && Array.isArray(data.completed_lessons)) {
        const localRaw = localStorage.getItem("fundi-completed-lessons");
        const localSet: string[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = Array.from(new Set([...localSet, ...data.completed_lessons]));
        localStorage.setItem("fundi-completed-lessons", JSON.stringify(merged));
      }
    };
    syncFromSupabase().catch(() => {}); // silent fail, offline is fine
  }, []);

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

  const handleNav = (name: Route["name"]) => {
    if (name === "learn") setRoute({ name: "learn" });
    if (name === "calculator") setRoute({ name: "calculator" });
    if (name === "profile") setRoute({ name: "profile" });
    if (name === "leaderboard") setRoute({ name: "leaderboard" });
    if (name === "settings") setRoute({ name: "settings" });
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
    };
    let state: WCState = {
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
          state.lessonsCompleted = n;
        } else {
          state = { ...state, ...JSON.parse(raw) };
        }
      } catch {
        /* ignore */
      }
    }
    const today = new Date().toDateString();
    const dailyKey = `fundi-daily-xp-${today}`;
    const dailyXpSoFar =
      parseInt(localStorage.getItem(dailyKey) ?? "0", 10) + payload.xpEarned;
    localStorage.setItem(dailyKey, String(dailyXpSoFar));

    state.lessonsCompleted += 1;
    state.xpEarned += payload.xpEarned;
    state.perfectLessons += payload.isPerfect ? 1 : 0;
    state.dailyXp = dailyXpSoFar;

    let progressVal = 0;
    if (wc.unit === "lessons") progressVal = state.lessonsCompleted;
    else if (wc.unit === "perfect") progressVal = state.perfectLessons;
    else if (wc.unit === "daily_xp") progressVal = state.dailyXp;
    else if (wc.unit === "streak_days") progressVal = userData.streak;

    const meets =
      wc.unit === "lessons"
        ? state.lessonsCompleted >= wc.target
        : wc.unit === "perfect"
          ? state.perfectLessons >= wc.target
          : wc.unit === "daily_xp"
            ? state.dailyXp >= wc.target
            : userData.streak >= wc.target;

    if (meets && !state.completed) {
      analytics.challengeCompleted(wc.text, wc.xp);
      state.completed = true;
      localStorage.setItem(key, JSON.stringify(state));
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
      setChallengeProgress(Math.min(progressVal, wc.target));
    }
    setWeeklyProgress({
      lessonsCompleted: state.lessonsCompleted,
      xpEarned: state.xpEarned,
      perfectLessons: state.perfectLessons,
      dailyXp: state.dailyXp,
      completed: state.completed,
    });
  };

  const checkCourseBadgeEarned = (courseId: string, lessonId: string) => {
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
    const earned = JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]") as string[];
    if (earned.includes(badge.id)) return;
    analytics.courseCompleted(courseId, course.title, badge.name);
    analytics.badgeEarned(badge.id, badge.name);
    const next = [...earned, badge.id];
    localStorage.setItem("fundi-earned-badges", JSON.stringify(next));
    setCourseBadgeIds(next);
    setCourseCompleteModal(badge);
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      void supabase.from("user_progress").upsert(
        { user_id: user.id, badges: next as unknown as string[] },
        { onConflict: "user_id" }
      );
    });
  };

  const finalizeCurrentLesson = (choice: "next" | "course") => {
    const baseXP = 50;
    const totalXP = baseXP + currentLessonState.correctCount * 10;
    if (!currentLessonState.courseId || !currentLessonState.lessonId) return;

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

    const streakAfterLesson = completeLesson(
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
      localStorage.setItem("fundi-perfect-lessons", String(prev + 1));
      if (hearts < maxHearts) gainHeart();
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
    const earned = JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]") as string[];
    const justEarned = THRESHOLDS.filter((b) => b.test && !earned.includes(b.id)).map((b) => b.id);
    const nextLesson = getNextLesson(
      currentLessonState.courseId,
      currentLessonState.lessonId
    );

    checkCourseBadgeEarned(
      currentLessonState.courseId,
      currentLessonState.lessonId
    );

    if (justEarned.length > 0) {
      const merged = [...earned, ...justEarned];
      localStorage.setItem("fundi-earned-badges", JSON.stringify(merged));
      setCourseBadgeIds(merged);
      setNewlyEarnedBadges(justEarned);
      nextLessonRef.current = nextLesson;
      return;
    }
    if (choice === "next" && nextLesson) {
      startLesson(currentLessonState.courseId, nextLesson);
    } else {
      setRoute({ name: "course", courseId: currentLessonState.courseId });
    }
  };

  const nextStep = () => {
    if (currentLessonState.stepIndex < currentLessonState.steps.length - 1) {
      setCurrentLessonState((prev) => ({
        ...prev,
        stepIndex: prev.stepIndex + 1,
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
    setRoute({ name: "learn" });
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Handle onboarding complete
  const handleOnboardingComplete = async (payload: { goal?: string; ageRange?: string; goalDescription?: string }) => {
    localStorage.setItem("fundi-onboarded", "true");
    if (payload.goal) localStorage.setItem("fundi-user-goal", payload.goal);
    if (payload.goalDescription) localStorage.setItem("fundi-goal-description", payload.goalDescription);
    if (payload.ageRange) localStorage.setItem("fundi-age-range", payload.ageRange);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const row: Record<string, unknown> = { user_id: user.id };
      if (payload.goal) row.goal = payload.goal;
      if (payload.goalDescription) row.goal_description = payload.goalDescription;
      if (payload.ageRange) row.age_range = payload.ageRange;
      if (row.goal ?? row.age_range ?? row.goal_description) {
        await supabase.from("profiles").upsert(row, { onConflict: "user_id" });
      }
    }
    setRoute({ name: "learn" } as Route);
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
        <nav className="sidebar hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-64 md:flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="h-1 w-full bg-gradient-to-r from-green-600 to-yellow-400 flex-shrink-0" aria-hidden />
          <div className="logo" style={{ paddingTop: 16 }}>
            <h1 className="inline-flex items-center gap-2">
              <Wallet size={22} className="text-[var(--primary-green)]" />
              Fundi Finance
            </h1>
            <p>Master Your Money</p>
          </div>
          <ul className="nav-menu">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  route.name === "learn" ? "active" : ""
                }`}
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
                className={`nav-link ${
                  route.name === "profile" ? "active" : ""
                }`}
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
                className={`nav-link ${
                  route.name === "leaderboard" ? "active" : ""
                }`}
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
                className={`nav-link ${
                  route.name === "settings" ? "active" : ""
                }`}
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
          />
        )}

        {route.name === "profile" && (
          <ProfileView
            userData={userData}
            onSignOut={handleProfileSignOut}
            currentUser={null}
            dailyGoal={dailyGoal}
            setDailyGoal={setDailyGoal}
            courseBadgeIds={courseBadgeIds}
          />
        )}

        {route.name === "leaderboard" && (
          <LeaderboardView xp={userData.xp} currentUserId={undefined} />
        )}

        {route.name === "settings" && (
          <SettingsView
            userData={userData}
            setDailyGoal={setDailyGoal}
            resetProgress={handleResetProgress}
          />
        )}

        {route.name === "calculator" && <CalculatorView />}

        {showNoHearts && (
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

        {showMilestoneCta && (
          <div className="fixed inset-0 bg-black/80 z-[520] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="mb-3 flex justify-center text-green-600 dark:text-green-400" aria-hidden>
                <Target size={48} strokeWidth={1.5} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
                You&apos;re making real progress
              </p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                5 Lessons Completed
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">
                You now know more about your money than most South Africans. Want a personalised
                plan to reach your first R10k emergency fund or start investing?
              </p>
              <button
                type="button"
                onClick={() => {
                  analytics.advisorCtaClicked("lesson_milestone_5");
                  window.open("https://wealthwithkwanele.co.za", "_blank", "noopener,noreferrer");
                }}
                className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold mb-3 transition-colors"
              >
                Get Your Free R10k Savings Plan
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
        {reviewAnswers && (
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

        {weeklyChallengeCelebration && (
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

        {courseCompleteModal && (
          <div className="fixed inset-0 bg-black/80 z-[500] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full animate-pulse shadow-xl">
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
                onClick={() => setCourseCompleteModal(null)}
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
        {newlyEarnedBadges.length > 0 && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div style={{
              background: "var(--color-surface)", borderRadius: 24,
              padding: "32px 24px", width: "100%", maxWidth: 360, textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <Award size={52} style={{ color: "var(--color-primary)" }} aria-hidden />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: "var(--color-primary)" }}>
                Badge Earned!
              </div>
              {newlyEarnedBadges.map((id) => {
                const NAMES: Record<string, string> = {
                  "lesson-1-badge": "First Step", "lesson-5-badge": "Getting Going",
                  "lesson-10-badge": "On a Roll", "lesson-25-badge": "Dedicated",
                  "streak-3-badge": "3 Day Streak", "streak-7-badge": "Week Warrior",
                  "xp-100-badge": "First 100", "xp-500-badge": "XP Builder",
                  "perfect-1-badge": "Flawless",
                };
                return (
                  <div key={id} style={{
                    margin: "8px auto", background: "var(--color-bg)",
                    borderRadius: 12, padding: "10px 16px", fontWeight: 700,
                    color: "var(--color-text-primary)", fontSize: 15,
                    border: "1.5px solid var(--color-border)",
                  }}>
                    {NAMES[id] ?? id}
                  </div>
                );
              })}
              <p style={{ color: "var(--color-text-secondary)", margin: "16px 0", fontSize: 14, lineHeight: 1.5 }}>
                Keep learning to unlock more badges. Check them all in your profile!
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                  const next = nextLessonRef.current;
                  nextLessonRef.current = null;
                  setNewlyEarnedBadges([]);
                  if (next && currentLessonState.courseId) {
                    startLesson(currentLessonState.courseId, next);
                  } else {
                    setRoute({ name: "course", courseId: currentLessonState.courseId! });
                  }
                }}>Continue</button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  onClick={() => {
                    const NAMES: Record<string, string> = {
                      "lesson-1-badge": "First Step", "lesson-5-badge": "Getting Going",
                      "lesson-10-badge": "On a Roll", "lesson-25-badge": "Dedicated",
                      "streak-3-badge": "3 Day Streak", "streak-7-badge": "Week Warrior",
                      "xp-100-badge": "First 100", "xp-500-badge": "XP Builder",
                      "perfect-1-badge": "Flawless",
                    };
                    const badgeName = NAMES[newlyEarnedBadges[0]] ?? "a badge";
                    const text = `I just earned the "${badgeName}" badge on Fundi Finance! Learning money skills one lesson at a time. fundi-finance.vercel.app`;
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

        <StatsPanel userData={userData} />
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
            key: "progress",
            label: "Progress",
            icon: <TrendingUp size={20} className="text-current" />,
            isActive: route.name === "leaderboard",
            onClick: () => handleNav("leaderboard"),
            order: "order-3",
          },
          {
            key: "profile",
            label: "Profile",
            icon: <UserIcon size={20} className="text-current" />,
            isActive: route.name === "profile",
            onClick: () => handleNav("profile"),
            order: "order-4",
          },
        ]}
      />
    </AuthGate>
  );
}

