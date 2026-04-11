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
import { CONCEPTS, getConceptIdsForCourse } from "@/data/concepts";
import {
  applyReview,
  getDueCards,
  saveMastery,
  scheduleConceptsForCourse,
} from "@/lib/spaced-repetition";
import type { MasteryRecord } from "@/lib/spaced-repetition";
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

import type { Course, Unit, Lesson, LessonStep } from "@/data/content";

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
    const xpPart = data.xp ? ` (+${data.xp} XP)` : "";
    return `I just completed "${t}"${xpPart} on Fundi Finance 🎓\n\nShort, South Africa–focused money lessons that actually make sense. Join me 👇\nfundiapp.co.za`;
  }
  if (type === "badge") {
    const n = data.badgeName ?? "a";
    return `I just earned the "${n}" badge on Fundi Finance 🏅\n\nBuilding real financial knowledge, one lesson at a time.\nfundiapp.co.za`;
  }
  if (type === "streak") {
    const d = data.streakDays ?? 0;
    return `${d}-day learning streak on Fundi Finance 🔥\n\nShowing up for my money goals every single day.\nfundiapp.co.za`;
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
  const [ageConfirmed, setAgeConfirmed] = React.useState(false);

  const screenCount = 4;
  const screensMeta = [
    {
      title: "Welcome to Fundi Finance",
      body: "Master your money in minutes a day. Short, SA-specific lessons that actually make sense, from budgeting to investing to what the Bible says about money.",
      cta: "Let's go",
      action: () => { if (ageConfirmed) setScreen(1); },
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

        {/* Age confirmation — screen 0 only */}
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
          disabled={
            (screen === 0 && !ageConfirmed) ||
            (screen === 1 && (!selectedGoal || (selectedGoal === "other" && !goalDescription.trim())))
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
  | { name: "budget" }
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

/** Bisection solver — finds value where fn(v) ≈ 0; fn must be monotone increasing. */
function bisectSolver(fn: (v: number) => number, lo: number, hi: number, iters = 64): number {
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
function solveForYears(base: CalcInputs, goal: number): number {
  if ((calcGrowth({ ...base, years: 0 }).at(-1)?.value ?? 0) >= goal) return 0;
  if ((calcGrowth({ ...base, years: 100 }).at(-1)?.value ?? 0) < goal) return Infinity;
  return bisectSolver((n) => (calcGrowth({ ...base, years: Math.ceil(n) }).at(-1)?.value ?? 0) - goal, 0, 100);
}
function solveForMonthly(base: CalcInputs, goal: number): number {
  if ((calcGrowth({ ...base, monthly: 0 }).at(-1)?.value ?? 0) >= goal) return 0;
  const cap = Math.max(goal / Math.max(base.years, 1) / 12, 50000);
  return bisectSolver((m) => (calcGrowth({ ...base, monthly: m }).at(-1)?.value ?? 0) - goal, 0, cap);
}
function solveForRate(base: CalcInputs, goal: number): number {
  if ((calcGrowth({ ...base, rate: 0 }).at(-1)?.value ?? 0) >= goal) return 0;
  if ((calcGrowth({ ...base, rate: 100 }).at(-1)?.value ?? 0) < goal) return Infinity;
  return bisectSolver((r) => (calcGrowth({ ...base, rate: r }).at(-1)?.value ?? 0) - goal, 0, 100);
}
function solveForInitial(base: CalcInputs, goal: number): number {
  if ((calcGrowth({ ...base, principal: 0 }).at(-1)?.value ?? 0) >= goal) return 0;
  return bisectSolver((p) => (calcGrowth({ ...base, principal: p }).at(-1)?.value ?? 0) - goal, 0, Math.max(goal * 2, 10_000_000));
}

/** Thousands use spaces (e.g. 1 000), not commas. */
function formatWithSpaces(value: number) {
  if (!isFinite(value) || isNaN(value)) return "0";
  return Math.round(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

/** Rand amounts with space grouping (en-ZA). */
function formatRand(v: number): string {
  if (!isFinite(v) || isNaN(v)) return "R0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const formatted = Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${sign}R${formatted}`;
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

type SolveMode = "goal" | "time" | "monthly" | "rate" | "initial";

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
  const [solveMode, setSolveMode] = useState<SolveMode>("goal");
  const [goalTarget, setGoalTarget] = useState("500000");
  const [solveResult, setSolveResult] = useState<{ label: string; value: string; sub?: string } | null>(null);
  const [inputsA, setInputsA] = useState<CalcInputs>(defaultInputs);
  const [inputsB, setInputsB] = useState<CalcInputs>({
    ...defaultInputs,
    rate: 7,
    monthly: 500,
  });

  const [hasCalculated, setHasCalculated] = useState(false);
  const [calcA, setCalcA] = useState<CalcInputs>(defaultInputs);
  const [calcB, setCalcB] = useState<CalcInputs>({ ...defaultInputs, rate: 7, monthly: 500 });
  const [projectionSaved, setProjectionSaved] = useState(false);

  // Load user's previously saved projection as default inputs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("fundi-calc-saved");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<CalcInputs>;
        setInputsA((prev) => ({ ...prev, ...parsed }));
        setCalcA((prev) => ({ ...prev, ...parsed }));
      } catch { /* ignore */ }
    }
  }, []);

  const handleCalculate = () => {
    const goal = parseFloat(goalTarget.replace(/[^0-9.]/g, "")) || 0;

    // Build effective inputs for the chart — if solving for a variable,
    // fill in the computed value so the chart still draws meaningfully.
    let effectiveA = { ...inputsA };
    let result: { label: string; value: string; sub?: string } | null = null;

    if (solveMode !== "goal" && goal > 0) {
      if (solveMode === "time") {
        const yrs = solveForYears(inputsA, goal);
        if (!isFinite(yrs)) {
          result = { label: "Time Needed", value: "Not achievable", sub: "Try a higher monthly amount or return rate" };
        } else {
          const roundedYrs = Math.ceil(yrs);
          effectiveA = { ...inputsA, years: roundedYrs };
          result = { label: "Time Needed", value: `${roundedYrs} year${roundedYrs !== 1 ? "s" : ""}`, sub: `to reach ${formatZAR(goal)}` };
        }
      } else if (solveMode === "monthly") {
        const monthly = solveForMonthly(inputsA, goal);
        effectiveA = { ...inputsA, monthly };
        result = { label: "Monthly Savings Needed", value: formatZAR(monthly), sub: `per month to reach ${formatZAR(goal)} in ${inputsA.years} years` };
      } else if (solveMode === "rate") {
        const rate = solveForRate(inputsA, goal);
        if (!isFinite(rate)) {
          result = { label: "Return Rate Needed", value: "Not achievable", sub: "Try a higher contribution or longer period" };
        } else {
          effectiveA = { ...inputsA, rate };
          result = { label: "Annual Return Rate Needed", value: `${rate.toFixed(2)}% p.a.`, sub: `to reach ${formatZAR(goal)} in ${inputsA.years} years` };
        }
      } else if (solveMode === "initial") {
        const principal = solveForInitial(inputsA, goal);
        effectiveA = { ...inputsA, principal };
        result = { label: "Lump Sum Needed Today", value: formatZAR(principal), sub: `to reach ${formatZAR(goal)} in ${inputsA.years} years` };
      }
    }

    setCalcA(effectiveA);
    setCalcB(inputsB);
    setHasCalculated(true);
    setProjectionSaved(false);
    setSolveResult(result);
    // Analytics: track solve mode usage
    analytics.calculatorSolveModeUsed(solveMode, {
      monthly: inputsA.monthly,
      rate: inputsA.rate,
      years: inputsA.years,
      principal: inputsA.principal,
    });
  };

  const handlePinProjection = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fundi-calc-saved", JSON.stringify(inputsA));
      setProjectionSaved(true);
    }
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
    hideField,
  }: {
    label?: string;
    inputs: CalcInputs;
    setInputs: (i: CalcInputs) => void;
    hideField?: SolveMode;
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
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </div>
      )}

      {hideField !== "initial" && (
        <CalcNumberRow label="Initial Amount (R)" tooltip="The lump sum you're starting with today." value={inputs.principal} onChange={(v) => setInputs({ ...inputs, principal: v })} />
      )}
      {hideField !== "monthly" && (
        <CalcNumberRow label="Monthly Contribution (R)" tooltip="How much you add every month." value={inputs.monthly} onChange={(v) => setInputs({ ...inputs, monthly: v })} />
      )}
      {hideField !== "rate" && (
        <CalcNumberRow label="Annual Return Rate (%)" tooltip="The yearly growth rate (e.g. JSE average is ~10%)." value={inputs.rate} step="0.01" onChange={(v) => setInputs({ ...inputs, rate: v })} />
      )}
      <CalcNumberRow label="Annual Contribution Increase (%)" tooltip="How much you increase your monthly contribution each year (inflation hedge)." value={inputs.escalation} step="0.01" onChange={(v) => setInputs({ ...inputs, escalation: v })} />
      {hideField !== "time" && (
        <CalcNumberRow label="Investment Period (years)" tooltip="How many years you plan to invest for." value={inputs.years} step="1" onChange={(v) => setInputs({ ...inputs, years: v })} />
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Investment Frequency</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["monthly", "annually", "once-off"] as const).map((f) => (
            <button key={f} onClick={() => setInputs({ ...inputs, frequency: f })} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "2px solid", borderColor: inputs.frequency === f ? "var(--color-primary)" : "var(--color-border)", background: inputs.frequency === f ? "var(--color-primary-light)" : "white", color: inputs.frequency === f ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
              {f === "once-off" ? "Once-off" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const SOLVE_OPTIONS: { id: SolveMode; label: string; Icon: React.ComponentType<{size?: number; style?: React.CSSProperties}>; desc: string }[] = [
    { id: "goal",    label: "End Goal",        Icon: Target,       desc: "What will my investment be worth?" },
    { id: "time",    label: "Time Needed",     Icon: Clock,        desc: "How long to reach my goal?" },
    { id: "monthly", label: "Monthly Amount",  Icon: TrendingUp,   desc: "How much must I save monthly?" },
    { id: "rate",    label: "Return Rate",     Icon: BarChart2,    desc: "What return rate do I need?" },
    { id: "initial", label: "Starting Amount", Icon: Wallet,       desc: "How much must I invest today?" },
  ];

  return (
    <main className="main-content main-with-stats" id="mainContent">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>Investment Calculator</h2>
        {solveMode === "goal" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className={mode === "single" ? "btn btn-primary" : "btn btn-secondary"} style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => setMode("single")}>Single</button>
            <button className={mode === "compare" ? "btn btn-primary" : "btn btn-secondary"} style={{ padding: "8px 12px", fontSize: 13 }} onClick={() => setMode("compare")}>Compare</button>
          </div>
        )}
      </div>

      {/* ── Solve For selector ── */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>What are you solving for?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {SOLVE_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => { setSolveMode(opt.id); setHasCalculated(false); setSolveResult(null); }}
              style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${solveMode === opt.id ? "var(--color-primary)" : "var(--color-border)"}`, background: solveMode === opt.id ? "rgba(0,122,77,0.08)" : "var(--color-bg)", cursor: "pointer", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: solveMode === opt.id ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                <opt.Icon size={18} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: solveMode === opt.id ? "var(--color-primary)" : "var(--color-text-primary)" }}>{opt.label}</div>
            </button>
          ))}
        </div>
        {solveMode !== "goal" && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 6 }}>
              {SOLVE_OPTIONS.find(o => o.id === solveMode)?.desc} — Target Goal Amount (R)
            </div>
            <input
              type="number" inputMode="decimal" placeholder="e.g. 1000000"
              value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid var(--color-primary)", fontSize: 16, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" }}
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <InputPanel inputs={inputsA} setInputs={setInputsA} label={mode === "compare" && solveMode === "goal" ? "Investment A" : undefined} hideField={solveMode !== "goal" ? solveMode : undefined} />
        {mode === "compare" && solveMode === "goal" && <InputPanel inputs={inputsB} setInputs={setInputsB} label="Investment B" />}
      </div>

      {/* Results + chart section (clean) */}
      <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={handleCalculate}>
        <BarChart2 size={20} aria-hidden />
        Calculate
      </button>

      {!hasCalculated && (
        <div style={{ textAlign: "center", padding: "18px 0", color: "var(--color-text-secondary)" }}>
          {solveMode === "goal" ? "Set your values above, then tap Calculate" : "Set your inputs above and enter a target goal, then tap Calculate"}
        </div>
      )}

      {/* ── Solve Result (non-goal modes) ── */}
      {hasCalculated && solveResult && (
        <>
          <div style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, #005c3a 100%)", borderRadius: 16, padding: "20px 24px", marginBottom: 12, color: "white", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 8 }}>{solveResult.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>{solveResult.value}</div>
            {solveResult.sub && <div style={{ fontSize: 13, opacity: 0.85 }}>{solveResult.sub}</div>}
          </div>
          <div style={{ marginBottom: 20 }}>
            <ShareResultButton
              data={{
                type: "calculator",
                headline: `${solveResult.value} — ${solveResult.label.toLowerCase()}`,
                sub: solveResult.sub ?? `Saving R${formatWithSpaces(inputsA.monthly)}/month at ${inputsA.rate}% p.a. — calculated on Fundi Finance`,
              }}
              label="Share this result 📲"
            />
          </div>
        </>
      )}

      {hasCalculated && mode === "single" && solveMode === "goal" && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <ResultCard label="Final Value" value={formatZAR(finalA.value)} highlight />
            <ResultCard label="Total Contributions" value={formatZAR(finalA.contributions)} />
            <ResultCard label="Total Interest" value={formatZAR(finalA.interest)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <ShareResultButton
              data={{
                type: "calculator",
                headline: `My R${formatWithSpaces(inputsA.monthly)}/month investment could be worth ${formatZAR(finalA.value)} in ${inputsA.years} years`,
                sub: `At ${inputsA.rate}% p.a. · R${formatWithSpaces(finalA.interest)} in interest earned · Calculated on Fundi Finance`,
              }}
              label="Share this calculation 📲"
            />
          </div>
        </>
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

      {hasCalculated && !projectionSaved && (
        <button
          onClick={handlePinProjection}
          style={{
            width: "100%", marginBottom: 12, padding: "11px 16px", borderRadius: 12,
            border: "1.5px solid var(--color-primary)", background: "transparent",
            color: "var(--color-primary)", fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <TrendingUp size={16} aria-hidden />
          Save this projection to my Profile
        </button>
      )}
      {projectionSaved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
          <CheckCircle2 size={16} className="shrink-0" aria-hidden />
          <span>Projection pinned to your Profile — tap Profile to view it.</span>
        </div>
      )}

      <div
        className="relative overflow-hidden bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-5 text-white mb-8"
        style={{ marginBottom: 32 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide text-green-100/90">Available</span>
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
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings", "budget"];
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
    const simpleRoutes = ["learn", "calculator", "profile", "leaderboard", "settings", "budget"];
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
        .select("goal, goal_description, age_range")
        .eq("user_id", progress.userId!)
        .maybeSingle();
      if (profile?.goal) {
        localStorage.setItem("fundi-onboarded", "true");
        localStorage.setItem("fundi-user-goal", profile.goal);
        if (profile.goal_description) localStorage.setItem("fundi-goal-description", profile.goal_description);
        if (profile.age_range) localStorage.setItem("fundi-age-range", profile.age_range);
        setRoute({ name: "learn" });
      }
    })().catch(() => {});
  }, [progress.userId]); // eslint-disable-line react-hooks/exhaustive-deps

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

function DailyChallenges({ streak = 0 }: { streak?: number }) {
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
    // Award XP via Supabase and sync challenge completion
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("user_progress").select("xp").eq("user_id", user.id).single();
      if (data) {
        await supabase.from("user_progress").update({
          xp: (data.xp ?? 0) + xp,
          daily_challenges_date: today,
          daily_challenges_claimed: JSON.stringify(next)
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
  const [queue, setQueue] = useState<MasteryRecord[]>(() => getDueCards());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

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
      // All done — go to summary by setting currentIdx beyond queue
      setCurrentIdx(queue.length);
    } else {
      setSelected(null);
      setShowExplanation(false);
      setCurrentIdx((i) => i + 1);
    }
  };

  const isDone = currentIdx >= queue.length;

  if (isDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 text-center shadow-2xl">
          <div className="text-5xl mb-3">🧠</div>
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">
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
  streak = 0,
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
}) {
  const [search, setSearch] = useState("");
  const [userGoal, setUserGoal] = useState<string | null>(null);
  const [goalDescription, setGoalDescription] = useState<string>("");
  const [goalBannerDismissed, setGoalBannerDismissed] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [pickerGoalId, setPickerGoalId] = useState<string>("");
  const [pickerGoalDescription, setPickerGoalDescription] = useState<string>("");
  const [showReview, setShowReview] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  // Refresh due count on mount and when returning from a review
  useEffect(() => {
    setDueCount(getDueCards().length);
  }, [showReview]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUserGoal(localStorage.getItem("fundi-user-goal"));
    setGoalDescription(localStorage.getItem("fundi-goal-description") ?? "");
    setGoalBannerDismissed(localStorage.getItem("fundi-goal-banner-dismissed") === "1");
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
        <ReviewSession onClose={() => { setShowReview(false); setDueCount(getDueCards().length); }} />
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

      {/* Daily Challenges */}
      <DailyChallenges streak={streak} />

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
                      <ShareResultButton
                        data={{ type: "lesson", lessonTitle, xpEarned: 50 + correctCount * 10, isPerfect: false, courseName: "Fundi Finance" }}
                        label="Share your result 📲"
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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={18} /> Done — Back to Course</span>
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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={18} /> Done — Back to Course</span>
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
                  <div style={{ marginBottom: 16, fontSize: 14 }}>
                    <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>
                      {totalQuestions > 0 ? Math.round(correctCount / totalQuestions * 100) : 100}% accuracy
                    </div>
                    {lessonStartTimeRef && (
                      <div style={{ color: "var(--color-text-secondary)", marginBottom: 8 }}>
                        {(() => {
                          const elapsed = Math.round((Date.now() - (lessonStartTimeRef.current || 0)) / 1000);
                          const mins = Math.floor(elapsed / 60);
                          const secs = elapsed % 60;
                          return `${mins}m ${secs}s`;
                        })()}
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 16, color: "var(--color-primary)" }}>
                      +{50 + correctCount * 10} XP earned
                    </div>
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
                      {lessonTitle && (
                        <ShareResultButton
                          data={{ type: "lesson", lessonTitle, xpEarned: 50 + correctCount * 10, isPerfect: false, courseName: "Fundi Finance" }}
                          label="Share your result 📲"
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
            📚 For educational purposes only — not financial advice. Consult a licensed financial advisor before making financial decisions.
          </div>
        </div>
      </main>
    </>
  );
}

function ProfileView({
  userData,
  onSignOut,
  onDeleteAccount,
  onDownloadData,
  currentUser,
  dailyGoal,
  setDailyGoal,
  courseBadgeIds,
  courses = [],
  completedLessons = new Set(),
}: {
  userData: UserData;
  onSignOut: () => void;
  onDeleteAccount?: () => Promise<void>;
  onDownloadData?: () => Promise<void>;
  currentUser: any;
  dailyGoal: number;
  setDailyGoal: (n: number) => void;
  courseBadgeIds: string[];
  courses?: Course[];
  completedLessons?: Set<string>;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
  const [savedProjection, setSavedProjection] = useState<CalcInputs | null>(null);
  const [projectionFinalValue, setProjectionFinalValue] = useState<number | null>(null);
  const [showProfileGoalEdit, setShowProfileGoalEdit] = useState(false);
  const [profileGoalEditId, setProfileGoalEditId] = useState<string>("");
  const [profileGoalEditDesc, setProfileGoalEditDesc] = useState<string>("");

  // Load goal from localStorage for the goal lookback card
  useEffect(() => {
    if (typeof window === "undefined") return;
    setProfileGoal(localStorage.getItem("fundi-user-goal"));
    setProfileGoalDescription(localStorage.getItem("fundi-goal-description") ?? "");
    // Load saved calculator projection
    const raw = localStorage.getItem("fundi-calc-saved");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as CalcInputs;
        setSavedProjection(parsed);
        const growth = calcGrowth(parsed);
        if (growth.length > 0) setProjectionFinalValue(growth[growth.length - 1].value);
      } catch { /* ignore */ }
    }
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

  const [showMore, setShowMore] = React.useState(false);
  const [showAllBadges, setShowAllBadges] = React.useState(false);
  const [showLegalPage, setShowLegalPage] = React.useState<null | "privacy" | "terms" | "faq">(null);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  if (showLegalPage) {
    return <LegalPage page={showLegalPage} onBack={() => setShowLegalPage(null)} onFeedback={() => { setShowLegalPage(null); setFeedbackOpen(true); }} />;
  }

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
            <button
              onClick={() => {
                setProfileGoalEditId(profileGoal ?? "");
                setProfileGoalEditDesc(profileGoalDescription ?? "");
                setShowProfileGoalEdit(true);
              }}
              style={{
                background: "none", border: "1px solid var(--color-border)", borderRadius: 8,
                padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                color: "var(--color-primary)",
              }}
            >
              Edit
            </button>
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
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4, fontStyle: "italic" }}>
              Tap Edit to describe your goal in more detail.
            </p>
          )}
        </div>
      )}

      {/* ── Profile goal edit modal ── */}
      {showProfileGoalEdit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 32px", width: "100%", maxWidth: 480,
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Edit My Goal</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {ONBOARDING_GOAL_OPTIONS.map((g) => {
                const sel = profileGoalEditId === g.id;
                return (
                  <button key={g.id} onClick={() => setProfileGoalEditId(g.id)} style={{
                    padding: "12px 10px", borderRadius: 12, border: `2px solid ${sel ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: sel ? "var(--color-primary-light, #E6F4EF)" : "var(--color-surface)",
                    color: sel ? "var(--color-primary)" : "var(--color-text-primary)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <g.Icon size={16} />
                    {g.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={profileGoalEditDesc}
              onChange={(e) => setProfileGoalEditDesc(e.target.value)}
              placeholder={profileGoalEditId === "other" ? "Describe your goal (required)…" : "Add detail about your goal (optional)…"}
              rows={3}
              style={{
                width: "100%", borderRadius: 10, border: "1.5px solid var(--color-border)",
                padding: "10px 12px", fontSize: 14, background: "var(--color-surface)",
                color: "var(--color-text-primary)", resize: "none", boxSizing: "border-box",
                marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowProfileGoalEdit(false)}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid var(--color-border)",
                  background: "transparent", color: "var(--color-text-primary)", fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={!profileGoalEditId || (profileGoalEditId === "other" && !profileGoalEditDesc.trim())}
                onClick={async () => {
                  const desc = profileGoalEditDesc.trim();
                  localStorage.setItem("fundi-user-goal", profileGoalEditId);
                  if (desc) localStorage.setItem("fundi-goal-description", desc);
                  else localStorage.removeItem("fundi-goal-description");
                  setProfileGoal(profileGoalEditId);
                  setProfileGoalDescription(desc);
                  setShowProfileGoalEdit(false);
                  // Persist to Supabase
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from("profiles").upsert({
                      user_id: user.id,
                      goal: profileGoalEditId,
                      goal_description: desc || null,
                    }, { onConflict: "user_id" });
                  }
                }}
                style={{
                  flex: 2, padding: "12px", borderRadius: 12, border: "none",
                  background: "var(--color-primary)", color: "#fff", fontWeight: 700, cursor: "pointer",
                  opacity: (!profileGoalEditId || (profileGoalEditId === "other" && !profileGoalEditDesc.trim())) ? 0.5 : 1,
                }}
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Savings Projection card ── */}
      {savedProjection && projectionFinalValue !== null && (
        <div style={{
          background: "linear-gradient(135deg, rgba(0,122,77,0.07) 0%, rgba(255,182,18,0.05) 100%)",
          border: "1px solid rgba(0,122,77,0.2)",
          borderRadius: 14, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, marginBottom: 8 }}>
            <TrendingUp size={16} style={{ color: "var(--color-primary)" }} aria-hidden />
            My Savings Projection
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>
            {savedProjection.frequency === "once-off"
              ? `R${formatWithSpaces(savedProjection.principal)} once-off`
              : `R${formatWithSpaces(savedProjection.monthly)}/month`}
            {" · "}{savedProjection.rate}% return{" · "}{savedProjection.years} years
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              flex: 1, background: "var(--color-surface)", borderRadius: 10, padding: "10px 14px",
              border: "1px solid var(--color-border)", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Projected Value</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--color-primary)" }}>
                {formatRand(projectionFinalValue)}
              </div>
            </div>
            <div style={{
              flex: 1, background: "var(--color-surface)", borderRadius: 10, padding: "10px 14px",
              border: "1px solid var(--color-border)", textAlign: "center",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Time Horizon</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--color-text-primary)" }}>
                {savedProjection.years} yrs
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("fundi-calc-saved");
              setSavedProjection(null);
              setProjectionFinalValue(null);
            }}
            style={{
              marginTop: 12, width: "100%", padding: "9px", borderRadius: 10,
              border: "1.5px solid rgba(220,38,38,0.35)", background: "rgba(220,38,38,0.06)",
              color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Trash2 size={14} />
            Remove Projection
          </button>
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
              // Persist daily goal to Supabase for cross-device sync
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (!user) return;
                supabase.from("user_progress").upsert({ user_id: user.id, daily_goal: v }, { onConflict: "user_id" });
              });
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
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wide text-green-100/90">Available</span>
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
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {(showAllBadges ? earnedBadges : earnedBadges.slice(-3).reverse()).map((badge) => (
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
            {earnedBadges.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllBadges((v) => !v)}
                style={{
                  marginTop: 10, width: "100%", padding: "9px", borderRadius: 10,
                  border: "1.5px solid var(--color-border)", background: "transparent",
                  color: "var(--color-primary)", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                {showAllBadges ? "Show less" : `View all ${earnedBadges.length} badges`}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Weekly XP Chart ── */}
      {(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=Sun
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weekData = weekDays.map((name, i) => {
          const diff = i - dayOfWeek;
          const d = new Date(today);
          d.setDate(today.getDate() + diff);
          const key = `fundi-daily-xp-${d.toISOString().slice(0, 10)}`;
          const xp = typeof window !== "undefined" ? parseInt(localStorage.getItem(key) ?? "0", 10) : 0;
          return { name, xp, isToday: diff === 0 };
        });
        const maxXP = Math.max(...weekData.map(d => d.xp), 1);
        return (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <BarChart2 size={18} style={{ color: "var(--color-primary)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>This Week&apos;s XP</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [`${value} XP`, "XP"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                  labelStyle={{ color: "var(--color-text-primary)", fontWeight: 700 }}
                  itemStyle={{ color: "var(--color-text-primary)" }}
                />
                <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {weekData.map((entry, i) => (
                    <Cell key={i} fill={entry.isToday ? "var(--color-primary)" : "rgba(0,122,77,0.3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
              Week total: {weekData.reduce((s, d) => s + d.xp, 0)} XP
            </div>
          </div>
        );
      })()}

      {/* ── Personal Bests ── */}
      {(() => {
        let longestStreak = userData.streak;
        let bestDayXP = 0;
        if (typeof window !== "undefined") {
          longestStreak = Math.max(longestStreak, parseInt(localStorage.getItem("fundi-longest-streak") ?? "0", 10));
          for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `fundi-daily-xp-${d.toISOString().slice(0, 10)}`;
            const v = parseInt(localStorage.getItem(key) ?? "0", 10);
            if (v > bestDayXP) bestDayXP = v;
          }
        }
        if (typeof window !== "undefined" && userData.streak > longestStreak) {
          localStorage.setItem("fundi-longest-streak", String(userData.streak));
          longestStreak = userData.streak;
        }
        return (
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Award size={18} style={{ color: "#FFB612" }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Personal Bests</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Longest Streak", value: `${longestStreak}d`, icon: <Flame size={20} style={{ color: "#FFB612" }} /> },
                { label: "Best Day XP", value: `${formatWithSpaces(bestDayXP)}`, icon: <Zap size={20} style={{ color: "var(--color-primary)" }} /> },
                { label: "Total Lessons", value: String(userData.totalCompleted), icon: <BookOpen size={20} style={{ color: "var(--color-primary)" }} /> },
              ].map((pb) => (
                <div key={pb.label} style={{ textAlign: "center", padding: "12px 6px", background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                  <div style={{ marginBottom: 6 }}>{pb.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "var(--color-text-primary)" }}>{pb.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", marginTop: 2 }}>{pb.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── More (collapsible) — reading, guides, topic mastery ── */}
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: 14, padding: "14px 16px", cursor: "pointer",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>More</span>
          <ChevronRight size={18} style={{ color: "var(--color-text-secondary)", transform: showMore ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {showMore && (
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Topic Mastery */}
            {courses.length > 0 && (
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BookOpen size={16} style={{ color: "var(--color-primary)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Topic Mastery</span>
                </div>
                {courses.map((course) => {
                  const totalLessons = course.units.reduce((s: number, u: Unit) => s + u.lessons.length, 0);
                  const completedCount = course.units.reduce(
                    (s: number, u: Unit) => s + u.lessons.filter((l: Lesson) => completedLessons.has(`${course.id}:${l.id}`)).length, 0
                  );
                  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                  return (
                    <div key={course.id} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{course.title}</span>
                        <span style={{ fontWeight: 700, fontSize: 12, color: pct === 100 ? "#007A4D" : "var(--color-text-secondary)" }}>{pct}%</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 4, background: pct === 100 ? "#007A4D" : "var(--color-primary)", width: `${pct}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{completedCount}/{totalLessons} lessons</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recommended Reading */}
            <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <BookOpen size={16} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)" }}>Recommended Reading</span>
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
                {RECOMMENDED_READING_BOOKS.map((book) => {
                  const BookIcon = book.Icon;
                  return (
                    <div key={book.title} style={{ minWidth: 170, background: "var(--color-bg)", border: `1.5px solid ${book.color}40`, borderRadius: 14, padding: "12px 12px 10px", flexShrink: 0, borderTop: `4px solid ${book.color}` }}>
                      <div style={{ marginBottom: 6, color: book.color }}><BookIcon size={24} /></div>
                      <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 2, color: "var(--color-text-primary)" }}>{book.title}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6 }}>{book.author}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{book.lesson}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Free Financial Guides */}
            <a
              href="https://www.wealthwithkwanele.co.za/#resources"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", boxSizing: "border-box" as const }}
            >
              <ExternalLink size={16} aria-hidden />
              Free Financial Guides
            </a>
          </div>
        )}
      </div>

      {/* ── Help / Legal / Feedback row ── */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, marginBottom: 16, overflow: "hidden" }}>
        {[
          { label: "FAQ & Help", icon: <HelpCircle size={16} />, action: () => setShowLegalPage("faq") },
          { label: "Privacy Policy", icon: <Shield size={16} />, action: () => setShowLegalPage("privacy") },
          { label: "Terms of Service", icon: <FileText size={16} />, action: () => setShowLegalPage("terms") },
          { label: "Send Feedback", icon: <MessageSquare size={16} />, action: () => setFeedbackOpen(true) },
        ].map((item, i, arr) => (
          <button
            key={item.label} type="button"
            onClick={item.action}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              background: "none", border: "none", borderBottom: i < arr.length - 1 ? "1px solid var(--color-border)" : "none",
              cursor: "pointer", textAlign: "left",
            }}
          >
            <span style={{ color: "var(--color-text-secondary)" }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{item.label}</span>
            <ChevronRight size={14} style={{ color: "var(--color-text-secondary)" }} />
          </button>
        ))}
      </div>

      {/* ── Sign out ── */}
      <button
        type="button"
        onClick={onSignOut}
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "var(--color-danger)", marginBottom: 32 }}
      >
        <LogOut size={18} className="text-current" />
        Sign Out
      </button>

      {/* ── Danger zone (POPIA / data rights) — collapsed by default ── */}
      {onDeleteAccount && (
        <div style={{ marginBottom: 32 }}>
          <details style={{ borderRadius: 12, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <summary style={{
              padding: "12px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--color-text-secondary)", listStyle: "none",
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--color-surface)",
            }}>
              <AlertTriangle size={13} style={{ color: "var(--color-text-secondary)" }} />
              Account &amp; Data
            </summary>
            <div style={{ padding: "8px 0", background: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}>
              {/* Download data — POPIA right to access */}
              {onDownloadData && (
                <button
                  type="button"
                  onClick={onDownloadData}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", background: "none", border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <FileText size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Download My Data</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Export your progress as a JSON file (POPIA right to access)</div>
                  </div>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", background: "none", border: "none",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <Trash2 size={16} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-danger)" }}>Delete My Data</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Permanently removes all your account data</div>
                </div>
              </button>
            </div>
          </details>
        </div>
      )}

      {/* ── Delete data confirmation modal ── */}
      {showDeleteModal && (
        <div
          onClick={() => !deleting && setShowDeleteModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-surface)", borderRadius: 20,
              padding: "28px 24px 24px", width: "100%", maxWidth: 380, textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: "var(--color-text-primary)" }}>
              Delete All My Data?
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              This permanently deletes your account, XP, progress, and all personal data from Fundi Finance. This cannot be undone.
            </p>
            <button
              type="button"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try { if (onDeleteAccount) await onDeleteAccount(); } finally { setDeleting(false); }
              }}
              style={{
                width: "100%", padding: "12px", borderRadius: 12, border: "none",
                background: "#E03C31", color: "#fff", fontWeight: 700, fontSize: 15,
                cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1,
                marginBottom: 10,
              }}
            >
              {deleting ? "Deleting…" : "Yes, Delete Everything"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setShowDeleteModal(false)}
              style={{
                width: "100%", padding: "10px", borderRadius: 12, border: "1px solid var(--color-border)",
                background: "transparent", color: "var(--color-text-primary)", fontWeight: 600, fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback modal ── */}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

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

/** Returns the week key for the most recent Sunday: "fundi-week-YYYY-MM-DD" */
function getLeaderboardWeekKey(): string {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const d = String(sunday.getDate()).padStart(2, "0");
  return `fundi-week-${y}-${m}-${d}`;
}

/** Next Saturday midnight (end of current week) for the countdown */
function getWeekResetDate(): Date {
  const now = new Date();
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + (6 - now.getDay())); // roll forward to Saturday
  saturday.setHours(23, 59, 59, 0);
  return saturday;
}

function LeaderboardView({ xp, weeklyXp, currentUserId }: { xp: number; weeklyXp?: number; currentUserId?: string }) {
  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; totalXp: number; isYou: boolean; rank: number; ageRange?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [showLeagueInfo, setShowLeagueInfo] = useState(false);

  // Countdown to Saturday midnight reset
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const reset = getWeekResetDate();
      const diff = reset.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("Resetting…"); return; }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(days > 0 ? `${days}d ${hrs}h` : `${hrs}h ${mins}m`);
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const myId = user?.id ?? currentUserId ?? null;
        const currentWeekKey = getLeaderboardWeekKey();

        // 1. Fetch ALL profiles (every registered user, even brand-new ones)
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, age_range")
          .limit(200);

        if (profileError) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        // 2. Fetch progress rows (weekly_xp + week_key + total xp)
        const { data: progressRows } = await supabase
          .from("user_progress")
          .select("user_id, xp, weekly_xp, week_key")
          .limit(200);

        // Build lookup maps
        const profileMap: Record<string, { name: string; ageRange?: string }> = {};
        (profileRows ?? []).forEach((p: any) => {
          profileMap[p.user_id] = {
            name: p.full_name ? p.full_name.split(" ")[0] : "",
            ageRange: p.age_range ?? undefined,
          };
        });

        const progressMap: Record<string, { xp: number; weeklyXp: number; weekKey: string }> = {};
        (progressRows ?? []).forEach((r: any) => {
          progressMap[r.user_id] = {
            xp: r.xp ?? 0,
            weeklyXp: r.weekly_xp ?? 0,
            weekKey: r.week_key ?? "",
          };
        });

        // 3. Union of all user IDs from both tables
        const allIds = new Set([
          ...Object.keys(profileMap),
          ...Object.keys(progressMap),
        ]);

        // 4. Build rows — weekly XP only counts if week_key matches current week
        const rows: { id: string; name: string; xp: number; totalXp: number; isYou: boolean; rank: number; ageRange?: string }[] = [];

        allIds.forEach((uid) => {
          const profile = profileMap[uid];
          const progress = progressMap[uid];
          const isCurrentWeek = progress?.weekKey === currentWeekKey;
          const thisWeekXp = isCurrentWeek ? (progress?.weeklyXp ?? 0) : 0;
          const totalXp = progress?.xp ?? 0;
          const isYou = uid === myId;

          // Merge: current user's local weekly XP takes priority (most up-to-date)
          const displayWeeklyXp = isYou
            ? Math.max(thisWeekXp, weeklyXp ?? 0)
            : thisWeekXp;

          const rawName = profile?.name ?? "";
          const name = isYou ? "You" : (rawName || "Learner " + uid.slice(0, 4).toUpperCase());

          rows.push({
            id: uid,
            name,
            xp: displayWeeklyXp,
            totalXp,
            isYou,
            rank: 0,
            ageRange: profile?.ageRange,
          });
        });

        // Sort by this week's XP descending
        rows.sort((a, b) => b.xp - a.xp || b.totalXp - a.totalXp);
        rows.forEach((r, i) => { r.rank = i + 1; });

        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, weeklyXp, currentUserId, retryCount]);

  const myRank = leaders.find((l) => l.isYou);
  const myIndex = leaders.findIndex((l) => l.isYou);
  const aheadOfMe = myIndex > 0 ? leaders[myIndex - 1] : null;
  const xpToNext = aheadOfMe && myRank ? aheadOfMe.xp - myRank.xp : null;

  // Top 3 podium + nearby section
  const top3 = leaders.slice(0, 3);
  const restLeaders = leaders.slice(3);

  const LEAGUES = [
    { name: "Bronze",  min: 0,     max: 999,   emoji: "🥉", color: "#CD7F32" },
    { name: "Silver",  min: 1000,  max: 4999,  emoji: "🥈", color: "#A8A9AD" },
    { name: "Gold",    min: 5000,  max: 14999, emoji: "🥇", color: "#FFB612" },
    { name: "Diamond", min: 15000, max: Infinity, emoji: "💎", color: "#7DD3FC" },
  ];
  // Leagues based on total XP (permanent achievement), not weekly
  const getLeague = (totalXpVal: number) => LEAGUES.find((l) => totalXpVal >= l.min && totalXpVal <= l.max) ?? LEAGUES[0];
  const myLeague = myRank ? getLeague(myRank.totalXp) : null;

  return (
    <main className="main-content main-with-stats">
      <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Leaderboard</h2>
        {timeLeft && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", background: "var(--color-border)", borderRadius: 20, padding: "4px 12px", marginBottom: 4 }}>
            🔄 Resets in {timeLeft}
          </div>
        )}
      </div>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 12, fontSize: 14 }}>
        This week's XP — everyone starts fresh every Sunday
      </p>

      {/* League tier legend + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {LEAGUES.map((league) => {
          const isMyLeague = myLeague?.name === league.name;
          return (
            <div key={league.name} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 20,
              background: isMyLeague ? league.color + "22" : "var(--color-border)",
              border: isMyLeague ? `1.5px solid ${league.color}` : "1.5px solid transparent",
              fontSize: 12, fontWeight: isMyLeague ? 700 : 500,
              color: isMyLeague ? league.color : "var(--color-text-secondary)",
            }}>
              <span>{league.emoji}</span>
              <span>{league.name}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {league.max === Infinity ? `${formatWithSpaces(league.min)}+` : `${formatWithSpaces(league.min)}–${formatWithSpaces(league.max)}`}
              </span>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setShowLeagueInfo(true)}
          aria-label="What do leagues mean?"
          style={{
            width: 22, height: 22, borderRadius: "50%", border: "1.5px solid var(--color-border)",
            background: "var(--color-surface)", cursor: "pointer",
            fontSize: 11, fontWeight: 800, color: "var(--color-text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >?</button>
      </div>

      {/* League info modal */}
      {showLeagueInfo && (
        <div
          onClick={() => setShowLeagueInfo(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--color-surface)", borderRadius: 20, padding: "24px", width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: "var(--color-text-primary)" }}>What are leagues?</div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Leagues show your overall Fundi Finance level based on your <strong>total XP earned all time</strong>. They don&apos;t reset — keep earning XP to move up permanently.
            </p>
            {LEAGUES.map((league) => (
              <div key={league.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: 22 }}>{league.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: league.color }}>{league.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {league.max === Infinity
                      ? `${formatWithSpaces(league.min)} XP and above`
                      : `${formatWithSpaces(league.min)} – ${formatWithSpaces(league.max)} total XP`}
                  </div>
                </div>
              </div>
            ))}
            <p style={{ color: "var(--color-text-secondary)", fontSize: 12, marginTop: 14, lineHeight: 1.5 }}>
              The weekly leaderboard ranks everyone by XP earned <strong>this week only</strong>. Every Sunday it resets to zero so everyone gets a fresh start.
            </p>
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => setShowLeagueInfo(false)}>Got it</button>
          </div>
        </div>
      )}

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
                {formatWithSpaces(myRank.xp)} XP this week
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                {formatWithSpaces(myRank.totalXp)} total XP
              </div>
              {myLeague && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, padding: "3px 10px", borderRadius: 20, background: myLeague.color + "22", border: `1px solid ${myLeague.color}`, fontSize: 12, fontWeight: 700, color: myLeague.color }}>
                  {myLeague.emoji} {myLeague.name} League
                </div>
              )}
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
                {top3[1].ageRange && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{top3[1].ageRange}</div>}
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
                {top3[0].ageRange && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{top3[0].ageRange}</div>}
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
                {top3[2].ageRange && <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{top3[2].ageRange}</div>}
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
            {/* Demotion zone divider — shown when ≥6 users, marks bottom 3 */}
            {leaders.length >= 6 && (
              <div style={{
                background: "rgba(220,38,38,0.06)", borderBottom: "1.5px solid rgba(220,38,38,0.25)",
                padding: "6px 16px", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  ⚠️ Demotion Zone — bottom {Math.min(3, restLeaders.length)} this week
                </span>
              </div>
            )}
            {restLeaders.map((leader) => {
              const prevLeader = leaders[leader.rank - 2]; // person above
              const inDemotionZone = leaders.length >= 6 && leader.rank > leaders.length - 3;
              return (
                <div
                  key={leader.id}
                  className="leaderboard-row"
                  style={{
                    ...(leader.isYou ? { background: "rgba(0,122,77,0.08)", borderLeft: "4px solid var(--color-primary)" } : {}),
                    ...(inDemotionZone && !leader.isYou ? { background: "rgba(220,38,38,0.04)" } : {}),
                    display: "flex", alignItems: "center", padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{
                    width: 32, textAlign: "center", fontSize: 14, fontWeight: 800,
                    color: inDemotionZone ? "#dc2626" : leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                    flexShrink: 0,
                  }}>
                    {inDemotionZone ? "⚠️" : leader.rank}
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
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      {leader.ageRange && (
                        <span style={{ background: "var(--color-border)", borderRadius: 999, padding: "1px 6px", fontWeight: 600 }}>{leader.ageRange}</span>
                      )}
                      {leader.isYou && prevLeader && prevLeader.xp > leader.xp && (
                        <span>{formatWithSpaces(prevLeader.xp - leader.xp)} XP to #{leader.rank - 1}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <div style={{
                      fontWeight: 800, fontSize: 14,
                      color: leader.isYou ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}>
                      {formatWithSpaces(leader.xp)} XP
                    </div>
                    {(() => {
                      const lg = getLeague(leader.totalXp);
                      return (
                        <span style={{ fontSize: 10, fontWeight: 700, color: lg.color }}>
                          {lg.emoji} {lg.name}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      </div>
    </main>
  );
}

// ─── Shareable Results Card ──────────────────────────────────────────────────

type ShareCardData =
  | { type: "lesson"; lessonTitle: string; xpEarned: number; isPerfect: boolean; courseName: string }
  | { type: "calculator"; headline: string; sub: string };

function generateShareCard(data: ShareCardData): Promise<string> {
  return new Promise((resolve) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0a1e12");
    bg.addColorStop(0.6, "#0d2318");
    bg.addColorStop(1, "#061009");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Radial glow centre
    const glow = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, 480);
    glow.addColorStop(0, "rgba(34,197,94,0.22)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(34,197,94,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Top brand strip
    ctx.fillStyle = "rgba(0,122,60,0.18)";
    ctx.beginPath(); ctx.roundRect(60, 100, W - 120, 90, 18); ctx.fill();
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FUNDI FINANCE", W / 2, 156);

    if (data.type === "lesson") {
      // Big trophy icon area
      ctx.fillStyle = "rgba(255,182,18,0.12)";
      ctx.beginPath(); ctx.arc(W / 2, H * 0.35, 140, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FFB612";
      ctx.font = "140px serif";
      ctx.textAlign = "center";
      ctx.fillText("🏆", W / 2, H * 0.35 + 52);

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath(); ctx.roundRect(60, H * 0.52, W - 120, 260, 24); ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 58px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = "center";
      // wrap long titles
      const words = data.lessonTitle.split(" ");
      let line = ""; const lines: string[] = [];
      for (const w of words) {
        const test = line + (line ? " " : "") + w;
        if (ctx.measureText(test).width > W - 160) { lines.push(line); line = w; }
        else line = test;
      }
      lines.push(line);
      lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.54 + i * 70));

      ctx.fillStyle = "#22c55e";
      ctx.font = `bold 48px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(`+${data.xpEarned} XP earned`, W / 2, H * 0.54 + lines.length * 70 + 60);

      if (data.isPerfect) {
        ctx.fillStyle = "#FFB612";
        ctx.font = `bold 38px -apple-system, BlinkMacSystemFont, sans-serif`;
        ctx.fillText("⭐ Perfect Score!", W / 2, H * 0.54 + lines.length * 70 + 120);
      }

      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = `500 34px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillText(`${data.courseName} course`, W / 2, H * 0.82);
    } else {
      // Calculator card
      ctx.fillStyle = "rgba(34,197,94,0.1)";
      ctx.beginPath(); ctx.roundRect(60, H * 0.28, W - 120, 500, 28); ctx.fill();
      ctx.strokeStyle = "rgba(34,197,94,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(60, H * 0.28, W - 120, 500, 28); ctx.stroke();

      ctx.fillStyle = "#22c55e";
      ctx.font = `bold 42px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("I just discovered…", W / 2, H * 0.31);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 68px -apple-system, BlinkMacSystemFont, sans-serif`;
      // wrap headline
      const words2 = data.headline.split(" ");
      let line2 = ""; const lines2: string[] = [];
      for (const w of words2) {
        const test = line2 + (line2 ? " " : "") + w;
        if (ctx.measureText(test).width > W - 180) { lines2.push(line2); line2 = w; }
        else line2 = test;
      }
      lines2.push(line2);
      lines2.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.37 + i * 80));

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `500 38px -apple-system, BlinkMacSystemFont, sans-serif`;
      const subWords = data.sub.split(" ");
      let subLine = ""; const subLines: string[] = [];
      for (const w of subWords) {
        const test = subLine + (subLine ? " " : "") + w;
        if (ctx.measureText(test).width > W - 200) { subLines.push(subLine); subLine = w; }
        else subLine = test;
      }
      subLines.push(subLine);
      subLines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.37 + lines2.length * 80 + 60 + i * 52));
    }

    // Bottom CTA
    ctx.fillStyle = "#22c55e";
    ctx.beginPath(); ctx.roundRect(120, H - 220, W - 240, 80, 40); ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.font = `bold 34px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText("Try it FREE → fundiapp.co.za", W / 2, H - 170);

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = `500 28px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText("Your financial journey starts here", W / 2, H - 110);

    resolve(canvas.toDataURL("image/png"));
  });
}

function ShareResultButton({ data, label = "Share" }: { data: ShareCardData; label?: string }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const dataUrl = await generateShareCard(data);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fundi-result.png", { type: "image/png" });

      const text = data.type === "calculator"
        ? `${data.headline} — calculated on Fundi Finance 📊 Try it free at fundiapp.co.za`
        : `I just completed "${data.lessonTitle}" (+${data.xpEarned} XP) on Fundi Finance 🎓 fundiapp.co.za`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Fundi Finance", text });
        analytics.shareTriggered(data.type === "lesson" ? "lesson" : "badge", "native");
      } else {
        // Fallback: download the image
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "fundi-result.png";
        a.click();
      }
    } catch { /* user cancelled or unsupported */ }
    setSharing(false);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      style={{
        display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
        padding: "12px 20px", borderRadius: 12, cursor: sharing ? "default" : "pointer",
        border: "1.5px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.08)",
        color: "#22c55e", fontWeight: 700, fontSize: 14, width: "100%",
      }}
    >
      <Share2 size={16} />
      {sharing ? "Generating…" : label}
    </button>
  );
}

// ─── Budget Tracker ──────────────────────────────────────────────────────────

type BudgetEntry = {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string;
  entry_date: string;
};

type CustomBudgetCat = {
  id: string;
  name: string;
  color: string;
  icon_name: string;
  type: "expense" | "income";
};

// Curated icon palette for the custom category picker
const ICON_PICKER_OPTIONS: { name: string; Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }> }[] = [
  { name: "ShoppingCart",  Icon: ShoppingCart },
  { name: "Car",           Icon: Car },
  { name: "Home",          Icon: HomeIcon },
  { name: "CreditCard",    Icon: CreditCard },
  { name: "PiggyBank",     Icon: PiggyBank },
  { name: "Tv",            Icon: Tv },
  { name: "Smartphone",    Icon: Smartphone },
  { name: "Heart",         Icon: Heart },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Briefcase",     Icon: Briefcase },
  { name: "Building2",     Icon: Building2 },
  { name: "Wallet",        Icon: Wallet },
  { name: "Zap",           Icon: Zap },
  { name: "Target",        Icon: Target },
  { name: "TrendingUp",    Icon: TrendingUp },
  { name: "BarChart2",     Icon: BarChart2 },
  { name: "Flame",         Icon: Flame },
  { name: "Award",         Icon: Award },
  { name: "Flag",          Icon: Flag },
  { name: "Landmark",      Icon: Landmark },
  { name: "Lock",          Icon: Lock },
  { name: "Umbrella",      Icon: Umbrella },
  { name: "Shield",        Icon: Shield },
  { name: "Brain",         Icon: Brain },
  { name: "Lightbulb",     Icon: Lightbulb },
  { name: "MoreHorizontal",Icon: MoreHorizontal },
];

function getIconByName(name: string): React.ComponentType<{ size?: number; style?: React.CSSProperties }> {
  return ICON_PICKER_OPTIONS.find((o) => o.name === name)?.Icon ?? MoreHorizontal;
}

const CAT_COLOR_SWATCHES = [
  "#007A4D","#FFB612","#3B7DD8","#E03C31","#00BFA5",
  "#7C4DFF","#F57C00","#C2185B","#1976D2","#9E9E9E",
  "#00897B","#D81B60","#F4511E","#8E24AA","#43A047",
];

const BUDGET_EXPENSE_CATS = [
  { id: "food",          label: "Food & Groceries", color: "#007A4D", tag: "needs",   Icon: ShoppingCart },
  { id: "transport",     label: "Transport",         color: "#FFB612", tag: "needs",   Icon: Car },
  { id: "housing",       label: "Housing/Rent",      color: "#3B7DD8", tag: "needs",   Icon: HomeIcon },
  { id: "debt",          label: "Debt Repayments",   color: "#E03C31", tag: "debt",    Icon: CreditCard },
  { id: "savings",       label: "Savings",           color: "#00BFA5", tag: "savings", Icon: PiggyBank },
  { id: "entertainment", label: "Entertainment",     color: "#7C4DFF", tag: "wants",   Icon: Tv },
  { id: "airtime",       label: "Airtime & Data",    color: "#F57C00", tag: "needs",   Icon: Smartphone },
  { id: "healthcare",    label: "Healthcare",        color: "#C2185B", tag: "needs",   Icon: Heart },
  { id: "education",     label: "Education",         color: "#1976D2", tag: "needs",   Icon: GraduationCap },
  { id: "other",         label: "Other",             color: "#9E9E9E", tag: "other",   Icon: MoreHorizontal },
] as const;

const BUDGET_INCOME_CATS = [
  { id: "salary",       label: "Salary / Wages",    Icon: Briefcase },
  { id: "freelance",    label: "Freelance",          Icon: Zap },
  { id: "business",     label: "Business Income",   Icon: Building2 },
  { id: "other-income", label: "Other Income",      Icon: Wallet },
] as const;

// ─── Feedback Modal ──────────────────────────────────────────────────────────

function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("feedback").insert({
        user_id: user?.id ?? null,
        subject,
        description,
        issue_type: issueType,
      });
      if (!error) setSent(true);
    } catch { /* ignore */ }
    setSending(false);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Send Feedback</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}>
            <X size={22} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <CheckCircle2 size={48} style={{ color: "var(--color-primary)", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Thank you!</div>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 20 }}>Your feedback helps us improve Fundi Finance.</p>
            <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Subject *</label>
              <input
                required value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your feedback"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Description *</label>
              <textarea
                required value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue or suggestion in detail…"
                rows={4}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", resize: "none", boxSizing: "border-box" as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Type of feedback *</label>
              <select
                required value={issueType} onChange={(e) => setIssueType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: issueType ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
              >
                <option value="">Please select one…</option>
                <option value="bug">Bug report</option>
                <option value="feature">Feature request</option>
                <option value="lesson-content">Lesson content issue</option>
                <option value="account">Account issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} disabled={sending}>
              {sending ? "Sending…" : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Legal Page ───────────────────────────────────────────────────────────────

const FUNDI_FAQ = [
  {
    section: "Using Fundi Finance",
    items: [
      { q: "What is a streak?", a: "A streak counts how many days in a row you've completed at least one lesson. Streaks help build a daily learning habit — miss a day and your streak resets to zero." },
      { q: "How does the XP system work?", a: "You earn XP (experience points) by completing lessons, getting correct answers, and claiming daily challenges. XP increases your level and your position on the leaderboard." },
      { q: "What are Daily Challenges?", a: "Every day, three challenges appear on your home screen. Complete the required action first (e.g. finish a lesson, log an expense), then tap Claim to receive bonus XP. Challenges reset at midnight." },
      { q: "What are Leaderboards?", a: "Leaderboards rank all Fundi users by XP. Your position updates in real time as you and others complete lessons. Use it to track your progress relative to other learners." },
    ],
  },
  {
    section: "Account & Data",
    items: [
      { q: "How do I change my name?", a: "Go to Profile → Edit Profile, update your first and last name, then tap Save." },
      { q: "How do I delete my account?", a: "Email us at privacy@fundiapp.co.za with subject 'Account Deletion Request'. We'll process it within 7 working days and permanently delete all your data." },
      { q: "What data does Fundi collect?", a: "We collect the email address you register with, your learning progress (lessons completed, XP, streaks), and anonymised budget data for benchmarking. See our Privacy Policy for full details." },
      { q: "Is my budget data shared?", a: "Budget data is aggregated and anonymised before being used for the community benchmarking feature. Individual entries are never shared with other users. We require at least 3 users in a category before showing any comparison." },
    ],
  },
  {
    section: "Still unsure?",
    items: [
      { q: "How do I contact support?", a: "Use the Send Feedback button at the bottom of your Profile. We'll get back to you within 2 business days." },
    ],
  },
];

function LegalPage({ page, onBack, onFeedback }: { page: "privacy" | "terms" | "faq"; onBack: () => void; onFeedback: () => void }) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const titles = { privacy: "Privacy Policy", terms: "Terms of Service", faq: "FAQ & Help" };

  return (
    <main className="main-content" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0 20px" }}>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-primary)", display: "flex" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{titles[page]}</div>
      </div>

      {page === "faq" && (
        <div>
          {FUNDI_FAQ.map((section) => (
            <div key={section.section} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-secondary)", marginBottom: 10 }}>{section.section}</div>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden" }}>
                {section.items.map((item, i) => {
                  const key = section.section + i;
                  const isOpen = openFaq === key;
                  return (
                    <div key={key} style={{ borderBottom: i < section.items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{item.q}</span>
                        <ChevronRight size={16} style={{ color: "var(--color-text-secondary)", flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: "0 16px 14px", fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{item.a}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Send Feedback CTA */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20, marginTop: 8, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Still unsure about something?</div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>Our team is happy to help. Send us a message and we'll respond within 2 business days.</p>
            <button
              type="button"
              onClick={onFeedback}
              className="btn btn-primary"
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 20px", fontSize: 15, fontWeight: 700 }}
            >
              <MessageSquare size={18} />
              Send Feedback
            </button>
          </div>
        </div>
      )}

      {page === "privacy" && (
        <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 20 }}>Last revised: 5 April 2026</p>

          {[
            { title: "1. General", body: "Fundi Finance (\"we\", \"us\") cares about your personal information. This Privacy Policy explains how we collect, use, and protect it when you use the Fundi Finance app and related services. By using the service, you agree to the practices described here." },
            { title: "2. Information We Collect", body: "We collect: (a) your email address and display name when you register; (b) your learning progress including lessons completed, XP earned, and streaks; (c) budget entries you create — these are stored securely and only accessible to you; (d) anonymised, aggregated budget data for the community benchmarking feature; (e) app usage data such as which lessons you viewed and how long you spent." },
            { title: "3. How We Use Your Information", body: "We use your information to provide and improve the service, personalise your learning experience, display your progress on the leaderboard (which you can disable by not setting a public display name), detect and fix bugs, and send you progress-related reminders (which you can opt out of in your device notification settings)." },
            { title: "4. Sharing Your Information", body: "We do not sell your personal information. We may share it with trusted service providers (Supabase for database hosting, PostHog for anonymised analytics) who are contractually bound to protect it. Budget data is only used in aggregate form with a minimum of 3 users before any comparison is shown." },
            { title: "5. Your Rights", body: "You have the right to: access the personal data we hold about you; correct inaccurate information; request deletion of your account and associated data; object to certain processing; export your data. To exercise any of these rights, email privacy@fundiapp.co.za." },
            { title: "6. Data Retention", body: "We retain your data for as long as your account is active. When you delete your account, we delete your personal data within 30 days, except where retention is required by law." },
            { title: "7. Children", body: "Fundi Finance is not directed at children under the age of 13. We do not knowingly collect data from children. If we become aware that a child has provided personal information, we will delete it promptly." },
            { title: "8. Cookies & Analytics", body: "We use analytics tools (PostHog) to understand how users engage with the app. Data collected is anonymised and used only to improve the product. We do not use third-party advertising cookies." },
            { title: "9. Contact", body: "For all privacy enquiries, contact our team at privacy@fundiapp.co.za." },
          ].map((s) => (
            <div key={s.title} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.title}</div>
              <p style={{ color: "var(--color-text-secondary)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      )}

      {page === "terms" && (
        <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)" }}>
          <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 20 }}>Last revised: 5 April 2026</p>

          {[
            { title: "1. Acceptance of Terms", body: "By accessing or using Fundi Finance (\"Service\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service. We may update these terms and will notify you of material changes via the app." },
            { title: "2. Description of Service", body: "Fundi Finance is a financial literacy app that provides educational content, budgeting tools, and gamified learning experiences. It is designed for general financial education purposes only and does not constitute financial advice." },
            { title: "3. Not Financial Advice", body: "Nothing in the Fundi Finance app, including lessons, calculator results, or investment projections, constitutes personalised financial, investment, tax, or legal advice. Always consult a qualified financial advisor before making financial decisions." },
            { title: "4. Acceptable Use", body: "You may use the Service only for lawful purposes. You agree not to: share your account credentials; attempt to reverse-engineer or scrape the app; upload harmful or offensive content; impersonate other users or misrepresent your identity on the leaderboard." },
            { title: "5. Intellectual Property", body: "All content in the app — including lessons, graphics, and the Fundi Finance name and logo — is owned by or licensed to Fundi Finance. You may not reproduce, distribute, or create derivative works from any app content without our written permission." },
            { title: "6. User-Generated Content", body: "Any display names, profile information, or content you submit to the Service grants us a licence to display it within the app. You retain ownership of your content but are responsible for ensuring it does not violate these terms." },
            { title: "7. Account Termination", body: "We reserve the right to suspend or terminate your account for violations of these terms, fraudulent activity, or any other reason at our discretion. You may delete your account at any time by contacting privacy@fundiapp.co.za." },
            { title: "8. Limitation of Liability", body: "To the fullest extent permitted by law, Fundi Finance and its team shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability for any claim shall not exceed any amount you have paid to us in the preceding 12 months." },
            { title: "9. Governing Law", body: "These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts." },
            { title: "10. Contact", body: "For any questions about these Terms, contact us at legal@fundiapp.co.za." },
          ].map((s) => (
            <div key={s.title} style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{s.title}</div>
              <p style={{ color: "var(--color-text-secondary)" }}>{s.body}</p>
            </div>
          ))}

          {/* Feedback CTA */}
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 20, marginTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>Questions about these terms? We're happy to help.</p>
            <button type="button" className="btn btn-secondary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={onFeedback}>
              <MessageSquare size={16} /> Contact Us
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function BudgetView() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [monthOffset, setMonthOffset] = useState(0);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"income" | "expense">("expense");
  const [addCategory, setAddCategory] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addDate, setAddDate] = useState(() => now.toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  // Edit state
  const [editEntry, setEditEntry] = useState<BudgetEntry | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  // Year view
  const [yearEntries, setYearEntries] = useState<BudgetEntry[]>([]);
  // Budget targets
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>({});
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  const [budgetSaving, setBudgetSaving] = useState(false);
  // Custom categories
  const [customCats, setCustomCats] = useState<CustomBudgetCat[]>([]);
  const [showAddCustomCat, setShowAddCustomCat] = useState(false);
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#007A4D");
  const [newCatIcon, setNewCatIcon] = useState("MoreHorizontal");
  const [savingCustomCat, setSavingCustomCat] = useState(false);
  // Budget benchmarks
  const [benchmarks, setBenchmarks] = useState<Record<string, number>>({});

  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth(); // 0-indexed
  const monthLabel = targetDate.toLocaleString("en-ZA", { month: "long", year: "numeric" });
  const isCurrentMonth = monthOffset === 0;

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const loadEntries = React.useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .lte("entry_date", endDate)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false });
    setEntries((data ?? []) as BudgetEntry[]);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // Track "budget visited today" for daily challenges
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isoDay = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`fundi-budget-visited-${isoDay}`, "1");
    }
  }, []);

  // Budget targets
  const monthYear = `${year}-${String(month + 1).padStart(2, "0")}`;

  const loadBudgetTargets = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("budget_targets")
      .select("category, monthly_limit")
      .eq("user_id", user.id)
      .eq("month_year", monthYear);
    const map: Record<string, number> = {};
    (data ?? []).forEach((r: { category: string; monthly_limit: number }) => { map[r.category] = Number(r.monthly_limit); });
    setBudgetTargets(map);
  }, [monthYear]);

  useEffect(() => { loadBudgetTargets(); }, [loadBudgetTargets]);

  // Custom categories
  const loadCustomCats = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("custom_budget_categories")
      .select("id, name, color, icon_name, type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setCustomCats((data ?? []) as CustomBudgetCat[]);
  }, []);

  useEffect(() => { loadCustomCats(); }, [loadCustomCats]);

  // Budget benchmarks: load anonymized category averages from all users
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("budget_benchmarks")
        .select("category, avg_pct, user_count");
      if (data) {
        const map: Record<string, number> = {};
        (data as { category: string; avg_pct: number }[]).forEach((r) => { map[r.category] = Number(r.avg_pct); });
        setBenchmarks(map);
      }
    })();
  }, []);

  const handleSaveCustomCat = async () => {
    if (!newCatName.trim()) return;
    setSavingCustomCat(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingCustomCat(false); return; }
    await supabase.from("custom_budget_categories").insert({
      user_id: user.id,
      name: newCatName.trim(),
      color: newCatColor,
      icon_name: newCatIcon,
      type: newCatType,
    });
    setSavingCustomCat(false);
    setShowAddCustomCat(false);
    setNewCatName("");
    setNewCatColor("#007A4D");
    setNewCatIcon("MoreHorizontal");
    loadCustomCats();
  };

  const handleDeleteCustomCat = async (id: string) => {
    await supabase.from("custom_budget_categories").delete().eq("id", id);
    setCustomCats((prev) => prev.filter((c) => c.id !== id));
  };

  const openSetBudget = () => {
    const draft: Record<string, string> = {};
    allExpCats.forEach((c) => { draft[c.id] = budgetTargets[c.id] ? String(budgetTargets[c.id]) : ""; });
    setBudgetDraft(draft);
    setShowSetBudget(true);
  };

  const handleSaveBudgetTargets = async () => {
    setBudgetSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBudgetSaving(false); return; }
    // Upsert each category that has a value
    for (const cat of allExpCats) {
      const val = Number(budgetDraft[cat.id]);
      if (val > 0) {
        await supabase.from("budget_targets").upsert(
          { user_id: user.id, category: cat.id, monthly_limit: val, month_year: monthYear },
          { onConflict: "user_id,category,month_year" }
        );
      } else {
        // Remove target if cleared
        await supabase.from("budget_targets").delete()
          .eq("user_id", user.id).eq("category", cat.id).eq("month_year", monthYear);
      }
    }
    setBudgetSaving(false);
    setShowSetBudget(false);
    loadBudgetTargets();
  };

  // Load full year data for the year view
  const loadYearEntries = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const yr = now.getFullYear();
    const { data } = await supabase
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", `${yr}-01-01`)
      .lte("entry_date", `${yr}-12-31`);
    setYearEntries((data ?? []) as BudgetEntry[]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (viewMode === "year") loadYearEntries(); }, [viewMode, loadYearEntries]);

  const handleAdd = async () => {
    if (!addCategory || !addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    await supabase.from("budget_entries").insert({
      user_id: user.id,
      type: addType,
      category: addCategory,
      amount: Number(addAmount),
      description: addDesc.trim() || null,
      entry_date: addDate,
    });
    // Check budget alert after adding expense
    if (addType === "expense" && budgetTargets[addCategory]) {
      const catSpent = entries.filter(e => e.type === "expense" && e.category === addCategory).reduce((s, e) => s + e.amount, 0) + Number(addAmount);
      const limit = budgetTargets[addCategory];
      const pct = (catSpent / limit) * 100;
      if (pct >= 80) {
        // Fire-and-forget budget alert push
        const catLabel = BUDGET_EXPENSE_CATS.find(c => c.id === addCategory)?.label ?? addCategory;
        fetch(`${window.location.origin}/api/budget-alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, category: catLabel, pct }),
        }).catch(() => {});
      }
    }
    // Analytics: budget category distribution
    analytics.budgetEntryAdded(addCategory, addType);
    // Track daily challenge: expense logged today
    if (addType === "expense" && typeof window !== "undefined") {
      const isoDay = new Date().toISOString().slice(0, 10);
      const expKey = `fundi-expense-today-${isoDay}`;
      localStorage.setItem(expKey, String((parseInt(localStorage.getItem(expKey) ?? "0", 10)) + 1));
    }
    setSaving(false);
    setShowAdd(false);
    setAddCategory("");
    setAddAmount("");
    setAddDesc("");
    setAddDate(now.toISOString().slice(0, 10));
    loadEntries();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("budget_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  const openEdit = (e: BudgetEntry) => {
    setEditEntry(e);
    setEditType(e.type);
    setEditCategory(e.category);
    setEditAmount(String(e.amount));
    setEditDesc(e.description ?? "");
    setEditDate(e.entry_date);
  };

  const handleEditSave = async () => {
    if (!editEntry || !editCategory || !editAmount || Number(editAmount) <= 0) return;
    setEditSaving(true);
    await supabase.from("budget_entries").update({
      type: editType,
      category: editCategory,
      amount: Number(editAmount),
      description: editDesc.trim() || null,
      entry_date: editDate,
    }).eq("id", editEntry.id);
    setEntries((prev) => prev.map((e) => e.id === editEntry.id ? { ...e, type: editType, category: editCategory, amount: Number(editAmount), description: editDesc.trim() || undefined, entry_date: editDate } : e));
    setEditSaving(false);
    setEditEntry(null);
  };

  const handleEditDelete = async () => {
    if (!editEntry) return;
    setEditSaving(true);
    await supabase.from("budget_entries").delete().eq("id", editEntry.id);
    setEntries((prev) => prev.filter((e) => e.id !== editEntry.id));
    setEditSaving(false);
    setEditEntry(null);
  };

  const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const surplus = income - expenses;

  // Merged expense/income category lists (static + custom, "other" always last)
  const allExpCats = useMemo(() => {
    const statics = BUDGET_EXPENSE_CATS.filter(c => c.id !== "other");
    const custom = customCats.filter(c => c.type === "expense").map(c => ({
      id: c.id, label: c.name, color: c.color, tag: "custom" as const, Icon: getIconByName(c.icon_name),
    }));
    const other = BUDGET_EXPENSE_CATS.find(c => c.id === "other")!;
    return [...statics, ...custom, other];
  }, [customCats]);

  const allIncCats = useMemo(() => {
    const custom = customCats.filter(c => c.type === "income").map(c => ({
      id: c.id, label: c.name, Icon: getIconByName(c.icon_name),
    }));
    return [...BUDGET_INCOME_CATS, ...custom];
  }, [customCats]);

  const catTotals = allExpCats.map((c) => ({
    ...c,
    total: entries.filter((e) => e.type === "expense" && e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const needsTotal = entries.filter((e) => e.type === "expense" && ["food","transport","housing","airtime","healthcare","education"].includes(e.category)).reduce((s, e) => s + e.amount, 0);
  const wantsTotal = entries.filter((e) => e.type === "expense" && e.category === "entertainment").reduce((s, e) => s + e.amount, 0);
  const debtTotal = entries.filter((e) => e.type === "expense" && e.category === "debt").reduce((s, e) => s + e.amount, 0);
  const savingsTotal = entries.filter((e) => e.type === "expense" && e.category === "savings").reduce((s, e) => s + e.amount, 0);
  const savingsRate = income > 0 ? Math.round((savingsTotal / income) * 100) : 0;
  const debtRate = income > 0 ? Math.round((debtTotal / income) * 100) : 0;

  const getCatLabel = (type: string, cat: string) => {
    if (type === "income") return allIncCats.find((c) => c.id === cat)?.label ?? cat;
    return allExpCats.find((c) => c.id === cat)?.label ?? cat;
  };

  const getCatColor = (cat: string) => allExpCats.find((c) => c.id === cat)?.color ?? "#9E9E9E";

  const formatEntry = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  };

  // Year view data
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const yearMonthData = monthNames.map((name, mi) => {
    const monthEntries = yearEntries.filter((e) => {
      const d = new Date(e.entry_date + "T00:00:00");
      return d.getMonth() === mi;
    });
    const inc = monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const exp = monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { name, income: inc, expenses: exp, surplus: inc - exp };
  });

  return (
    <main className="main-content main-with-stats budget-page">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900 }}>Budget</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Month / Year toggle */}
          <div style={{ display: "flex", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
            {(["month", "year"] as const).map((v) => (
              <button key={v} type="button" onClick={() => setViewMode(v)}
                style={{ padding: "7px 14px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", background: viewMode === v ? "var(--color-primary)" : "var(--color-surface)", color: viewMode === v ? "white" : "var(--color-text-secondary)" }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setAddType("expense"); setAddCategory(""); setAddAmount(""); setAddDesc(""); setAddDate(now.toISOString().slice(0, 10)); setShowAdd(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--color-primary)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={16} aria-hidden /> Add
          </button>
        </div>
      </div>

      {/* ── YEAR VIEW ── */}
      {viewMode === "year" && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>{now.getFullYear()} Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            {yearMonthData.map((m) => (
              <div key={m.name} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: "var(--color-text-primary)" }}>{m.name}</div>
                {m.income === 0 && m.expenses === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", fontStyle: "italic" }}>No entries</div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Income</span>
                      <span style={{ fontWeight: 700, color: "#007A4D" }}>{formatRand(m.income)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Expenses</span>
                      <span style={{ fontWeight: 700, color: "#E03C31" }}>{formatRand(m.expenses)}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "var(--color-border)", overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", background: m.surplus >= 0 ? "#007A4D" : "#E03C31", width: `${m.income > 0 ? Math.min(100, (m.expenses / m.income) * 100) : 100}%` }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: m.surplus >= 0 ? "#007A4D" : "#E03C31", textAlign: "right" }}>
                      {m.surplus >= 0 ? "+" : ""}{formatRand(m.surplus)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Year totals */}
          {(() => {
            const totInc = yearMonthData.reduce((s, m) => s + m.income, 0);
            const totExp = yearMonthData.reduce((s, m) => s + m.expenses, 0);
            const totSur = totInc - totExp;
            return (
              <>
                {/* ── Income vs Expenses Line Graph ── */}
                {yearMonthData.some(m => m.income > 0 || m.expenses > 0) && (
                  <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>Income vs Expenses — {now.getFullYear()}</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={yearMonthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={((value: unknown, name: unknown) => [formatRand(Number(value)), name === "income" ? "Income" : name === "expenses" ? "Expenses" : "Surplus"]) as never}
                          contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                        />
                        <Legend iconType="circle" iconSize={8} formatter={(v: string) => v === "income" ? "Income" : v === "expenses" ? "Expenses" : "Surplus"} wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="income" stroke="#007A4D" strokeWidth={2.5} dot={{ r: 3, fill: "#007A4D" }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#E03C31" strokeWidth={2.5} dot={{ r: 3, fill: "#E03C31" }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="surplus" stroke="#FFB612" strokeWidth={2} dot={{ r: 2, fill: "#FFB612" }} strokeDasharray="4 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>Year Totals</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[{ label: "Total Income", value: totInc, color: "#007A4D" }, { label: "Total Expenses", value: totExp, color: "#E03C31" }, { label: totSur >= 0 ? "Net Surplus" : "Net Deficit", value: Math.abs(totSur), color: totSur >= 0 ? "#007A4D" : "#E03C31" }].map((c) => (
                      <div key={c.label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: c.color }}>{formatRand(c.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {viewMode === "month" && (<>

      {/* Month selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "10px 14px", marginBottom: 20 }}>
        <button type="button" onClick={() => setMonthOffset((o) => o - 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", padding: 4 }} aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{monthLabel}</span>
        <button type="button" onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))} disabled={isCurrentMonth} style={{ background: "none", border: "none", cursor: isCurrentMonth ? "default" : "pointer", color: isCurrentMonth ? "var(--color-border)" : "var(--color-text-secondary)", padding: 4 }} aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Apply to all months button */}
      {Object.keys(budgetTargets).length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Apply this month's budget to all 12 months? Individual months can still be edited afterwards.")) {
              const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
              const y = year;
              const applyToAll = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                for (const m of months) {
                  const targetMonthYear = `${y}-${m}`;
                  for (const [cat, limit] of Object.entries(budgetTargets)) {
                    await supabase.from("budget_targets").upsert(
                      { user_id: user.id, category: cat, monthly_limit: limit, month_year: targetMonthYear },
                      { onConflict: "user_id,category,month_year" }
                    );
                  }
                }
                loadBudgetTargets();
              };
              applyToAll();
            }
          }}
          style={{
            width: "100%", marginBottom: 12, padding: "10px", borderRadius: 10,
            border: "1.5px solid var(--color-border)", background: "var(--color-surface)",
            color: "var(--color-text-secondary)", fontWeight: 600, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Copy size={14} />
          Apply this budget to all months
        </button>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-secondary)" }}>Loading...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Income", value: income, color: "#007A4D" },
              { label: "Expenses", value: expenses, color: "#E03C31" },
              { label: surplus >= 0 ? "Surplus" : "Deficit", value: Math.abs(surplus), color: surplus >= 0 ? "#007A4D" : "#E03C31" },
            ].map((c) => (
              <div key={c.label} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: c.color, lineHeight: 1.2 }}>{formatRand(c.value)}</div>
              </div>
            ))}
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)" }}>
              <Wallet size={48} strokeWidth={1.2} style={{ color: "var(--color-border)", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--color-text-primary)" }}>No entries yet</p>
              <p style={{ fontSize: 14, marginBottom: 20 }}>Start by adding your income and expenses for {monthLabel}.</p>
              <button type="button" onClick={() => { setAddType("income"); setShowAdd(true); }} className="btn btn-primary" style={{ padding: "12px 28px" }}>
                Add your first entry
              </button>
            </div>
          ) : (
            <>
              {/* Fundi insights */}
              {income > 0 && (
                <div style={{ background: "linear-gradient(135deg,rgba(0,122,77,0.07) 0%,rgba(255,182,18,0.05) 100%)", border: "1px solid rgba(0,122,77,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                    <Lightbulb size={16} style={{ color: "var(--color-primary)" }} /> Fundi Insights
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>Savings rate</span>
                      <span style={{ fontWeight: 700, color: savingsRate >= 10 ? "#007A4D" : "#E03C31" }}>{savingsRate}% {savingsRate >= 10 ? "✓ On track" : "— aim for 10%+"}</span>
                    </div>
                    {debtTotal > 0 && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>Debt repayments</span>
                        <span style={{ fontWeight: 700, color: debtRate > 40 ? "#E03C31" : debtRate > 20 ? "#FFB612" : "var(--color-text-primary)" }}>{debtRate}% of income</span>
                      </div>
                    )}
                    {needsTotal + wantsTotal > 0 && (
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        Needs: {formatRand(needsTotal)} · Wants: {formatRand(wantsTotal)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Budget vs Actual summary card */}
              {Object.keys(budgetTargets).length > 0 && catTotals.length > 0 && (() => {
                const totalBudget = Object.values(budgetTargets).reduce((s, v) => s + v, 0);
                const totalActual = BUDGET_EXPENSE_CATS.reduce((s, c) => s + (budgetTargets[c.id] ? entries.filter(e => e.type === "expense" && e.category === c.id).reduce((a, e) => a + e.amount, 0) : 0), 0);
                const delta = totalBudget - totalActual;
                const isOver = delta < 0;
                return (
                  <div style={{ background: isOver ? "rgba(224,60,49,0.08)" : "rgba(0,122,77,0.08)", border: `1px solid ${isOver ? "rgba(224,60,49,0.3)" : "rgba(0,122,77,0.3)"}`, borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: isOver ? "rgba(224,60,49,0.15)" : "rgba(0,122,77,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Target size={22} style={{ color: isOver ? "#E03C31" : "#007A4D" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: isOver ? "#E03C31" : "#007A4D" }}>
                        {isOver ? "Over Budget" : "Under Budget"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        {isOver ? `${formatRand(Math.abs(delta))} over` : `${formatRand(delta)} remaining`} of {formatRand(totalBudget)} budgeted
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Donut chart + Category breakdown with % */}
              {catTotals.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Expense breakdown</div>
                    <button type="button" onClick={openSetBudget} style={{ background: "rgba(0,122,77,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#007A4D", display: "flex", alignItems: "center", gap: 4 }}>
                      <Target size={13} /> Set Budget
                    </button>
                  </div>

                  {/* Interactive Donut Chart */}
                  <div style={{ position: "relative", width: "100%", maxWidth: 260, margin: "0 auto 20px" }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={catTotals.map((c) => ({ name: c.label, value: c.total, color: c.color }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {catTotals.map((c, i) => (
                            <Cell key={`cell-${i}`} fill={c.color} style={{ cursor: "pointer", outline: "none" }} />
                          ))}
                        </Pie>
                        <Tooltip
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(value: any) => formatRand(Number(value))}
                          contentStyle={{ borderRadius: 10, fontSize: 13, fontWeight: 600, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)" }}
                          itemStyle={{ color: "var(--color-text-primary)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label: total expenses */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 2 }}>Total</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--color-text-primary)" }}>{formatRand(expenses)}</div>
                    </div>
                  </div>

                  {/* Bar breakdown per category — with budget vs actual */}
                  {catTotals.map((c) => {
                    const pct = expenses > 0 ? (c.total / expenses) * 100 : 0;
                    const limit = budgetTargets[c.id];
                    const usagePct = limit ? (c.total / limit) * 100 : 0;
                    const isAmber = limit && usagePct >= 80 && usagePct < 100;
                    const isOver = limit && usagePct >= 100;
                    return (
                      <div key={c.id} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600 }}>{c.label}</span>
                            {isOver && <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(224,60,49,0.15)", color: "#E03C31", borderRadius: 4, padding: "1px 5px" }}>OVER</span>}
                            {isAmber && !isOver && <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,152,0,0.15)", color: "#F57C00", borderRadius: 4, padding: "1px 5px" }}>80%+</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, background: "var(--color-bg)", borderRadius: 6, padding: "2px 6px", color: "var(--color-text-secondary)" }}>{pct.toFixed(1)}%</span>
                            <span style={{ fontWeight: 800, color: isOver ? "#E03C31" : "var(--color-text-primary)" }}>{formatRand(c.total)}</span>
                          </div>
                        </div>
                        {limit ? (
                          /* Two-tone budget bar: spent portion + remaining */
                          <div>
                            <div style={{ height: 10, borderRadius: 5, background: "var(--color-border)", overflow: "hidden", position: "relative" }}>
                              <div style={{ height: "100%", borderRadius: 5, background: isOver ? "#E03C31" : isAmber ? "#F57C00" : c.color, width: `${Math.min(100, usagePct)}%`, transition: "width 0.4s ease" }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 11, color: "var(--color-text-secondary)" }}>
                              <span>{formatRand(c.total)} of {formatRand(limit)}</span>
                              <span style={{ color: isOver ? "#E03C31" : isAmber ? "#F57C00" : "#007A4D", fontWeight: 700 }}>
                                {isOver ? `${formatRand(c.total - limit)} over` : `${formatRand(limit - c.total)} left`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: 8, borderRadius: 4, background: "var(--color-border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, background: c.color, width: `${Math.min(100, pct)}%`, transition: "width 0.4s ease" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Legend summary */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--color-border)", display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {catTotals.map((c) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-text-secondary)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color }} />
                        <span>{c.label}: {expenses > 0 ? ((c.total / expenses) * 100).toFixed(0) : 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget Benchmarking card */}
              {income > 0 && Object.keys(benchmarks).length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <BarChart2 size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <div style={{ fontWeight: 800, fontSize: 14 }}>How you compare</div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-secondary)", marginLeft: "auto", background: "rgba(0,122,77,0.08)", padding: "2px 8px", borderRadius: 20 }}>Community avg</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {catTotals.filter((c) => benchmarks[c.id] !== undefined).slice(0, 5).map((c) => {
                      const userPct = income > 0 ? Math.round((c.total / income) * 100) : 0;
                      const avgPct = benchmarks[c.id];
                      const diff = userPct - avgPct;
                      const isOver = diff > 2;
                      const isUnder = diff < -2;
                      return (
                        <div key={c.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>avg {avgPct}%</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: isOver ? "#E03C31" : isUnder ? "#007A4D" : "var(--color-text-primary)" }}>
                                you {userPct}%
                                {isOver ? " ▲" : isUnder ? " ▼" : ""}
                              </span>
                            </div>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: "var(--color-border)", overflow: "visible", position: "relative" }}>
                            {/* Community avg marker */}
                            <div style={{ position: "absolute", top: -2, left: `${Math.min(avgPct, 95)}%`, width: 2, height: 10, background: "rgba(255,255,255,0.4)", borderRadius: 1, zIndex: 2 }} />
                            {/* User bar */}
                            <div style={{ height: "100%", borderRadius: 3, background: isOver ? "#E03C31" : isUnder ? "#007A4D" : c.color, width: `${Math.min(100, userPct)}%`, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 12, textAlign: "center" }}>
                    Anonymized · community data · updated daily
                  </div>
                </div>
              )}

              {/* Entry list — tap to edit */}
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 14, padding: "14px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Transactions</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)" }}>Tap to edit</span>
                </div>
                {entries.map((e) => (
                  <button
                    key={e.id} type="button" onClick={() => openEdit(e)}
                    style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: "1px solid var(--color-border)", gap: 12, width: "100%", background: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: e.type === "income" ? "rgba(0,122,77,0.12)" : `${getCatColor(e.category)}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {e.type === "income" ? <TrendingUp size={16} style={{ color: "#007A4D" }} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: getCatColor(e.category) }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--color-text-primary)" }}>{getCatLabel(e.type, e.category)}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>
                        {formatEntry(e.entry_date)}{e.description ? ` · ${e.description}` : ""}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: e.type === "income" ? "#007A4D" : "var(--color-text-primary)", flexShrink: 0 }}>
                      {e.type === "income" ? "+" : "-"}{formatRand(e.amount)}
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      </>)} {/* end month view */}

      {/* Set Budget Targets Modal */}
      {showSetBudget && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>Set Monthly Budget</h3>
              <button type="button" onClick={() => setShowSetBudget(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
              Set a spending limit for each category in {monthLabel}. Leave blank for no limit.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {allExpCats.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 0 }}>{c.label}</span>
                  <div style={{ position: "relative", width: 120 }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>R</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={budgetDraft[c.id] ?? ""}
                      onChange={(e) => setBudgetDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      style={{ width: "100%", padding: "10px 10px 10px 26px", borderRadius: 10, border: "1px solid var(--color-border)", background: "var(--color-bg)", fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", padding: 14, fontSize: 15 }}
              disabled={budgetSaving}
              onClick={handleSaveBudgetTargets}
            >
              {budgetSaving ? "Saving…" : "Save Budget Targets"}
            </button>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editEntry && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>Edit Entry</h3>
              <button type="button" onClick={() => setEditEntry(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setEditType(t); setEditCategory(""); }}
                  style={{ padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `2px solid ${editType === t ? "var(--color-primary)" : "var(--color-border)"}`, background: editType === t ? "rgba(0,122,77,0.1)" : "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                  {t === "income" ? "Income +" : "Expense −"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Category</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(editType === "expense" ? allExpCats : allIncCats).map((c) => (
                  <button key={c.id} type="button" onClick={() => setEditCategory(c.id)}
                    style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `2px solid ${editCategory === c.id ? "var(--color-primary)" : "var(--color-border)"}`, background: editCategory === c.id ? "rgba(0,122,77,0.08)" : "var(--color-bg)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)" }}>
                    <c.Icon size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <span>{c.label}</span>
                  </button>
                ))}
                {editType === "expense" && (
                  <button type="button" onClick={() => { setNewCatType("expense"); setShowAddCustomCat(true); }}
                    style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `2px dashed var(--color-border)`, background: "transparent", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)" }}>
                    <Plus size={14} style={{ flexShrink: 0 }} />
                    <span>Add category</span>
                  </button>
                )}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Amount (R)</div>
              <input type="number" inputMode="decimal" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="0.01" step="0.01"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 16, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description</div>
              <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Date</div>
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={handleEditDelete} disabled={editSaving}
                style={{ padding: "13px 16px", borderRadius: 12, border: "1.5px solid #E03C31", background: "transparent", color: "#E03C31", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Trash2 size={15} /> Delete
              </button>
              <button type="button" className="btn btn-primary" style={{ flex: 1, padding: 14, fontSize: 15 }} disabled={editSaving || !editCategory || !editAmount || Number(editAmount) <= 0} onClick={handleEditSave}>
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>Add Entry</h3>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><X size={20} /></button>
            </div>

            {/* Income / Expense toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button" onClick={() => { setAddType(t); setAddCategory(""); }}
                  style={{ padding: "10px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `2px solid ${addType === t ? "var(--color-primary)" : "var(--color-border)"}`, background: addType === t ? "rgba(0,122,77,0.1)" : "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                  {t === "income" ? "Income +" : "Expense −"}
                </button>
              ))}
            </div>

            {/* Category grid */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Category</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(addType === "expense" ? allExpCats : allIncCats).map((c) => (
                  <button key={c.id} type="button" onClick={() => setAddCategory(c.id)}
                    style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `2px solid ${addCategory === c.id ? "var(--color-primary)" : "var(--color-border)"}`, background: addCategory === c.id ? "rgba(0,122,77,0.08)" : "var(--color-bg)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-primary)", textAlign: "left" }}>
                    <c.Icon size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} aria-hidden />
                    <span>{c.label}</span>
                  </button>
                ))}
                <button type="button" onClick={() => { setNewCatType(addType); setShowAddCustomCat(true); }}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: `2px dashed var(--color-border)`, background: "transparent", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", textAlign: "left" }}>
                  <Plus size={14} style={{ flexShrink: 0 }} aria-hidden />
                  <span>Add category</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Amount (R)</div>
              <input
                type="number" inputMode="decimal" placeholder="0.00" value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)} min="0.01" step="0.01"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 16, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Description (optional)</div>
              <input
                type="text" placeholder="e.g. Woolworths, Uber" value={addDesc}
                onChange={(e) => setAddDesc(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Date</div>
              <input
                type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 14, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }}
              />
            </div>

            <button type="button" className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 16 }}
              disabled={saving || !addCategory || !addAmount || Number(addAmount) <= 0}
              onClick={handleAdd}>
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      {showAddCustomCat && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/70" role="dialog" aria-modal="true">
          <div style={{ background: "var(--color-surface)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 500, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontWeight: 900, fontSize: 18 }}>New Category</h3>
              <button type="button" onClick={() => setShowAddCustomCat(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}><X size={20} /></button>
            </div>

            {/* Type toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {(["expense", "income"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setNewCatType(t)}
                  style={{ padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", border: `2px solid ${newCatType === t ? "var(--color-primary)" : "var(--color-border)"}`, background: newCatType === t ? "rgba(0,122,77,0.1)" : "var(--color-bg)", color: "var(--color-text-primary)", textTransform: "capitalize" }}>
                  {t === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Category Name</div>
              <input
                type="text" placeholder="e.g. Gym, Pets, Clothing" value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--color-border)", fontSize: 15, fontWeight: 700, background: "var(--color-bg)", color: "var(--color-text-primary)", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Color swatches */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Colour</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CAT_COLOR_SWATCHES.map((col) => (
                  <button key={col} type="button" onClick={() => setNewCatColor(col)}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: col, border: `3px solid ${newCatColor === col ? "white" : "transparent"}`, outline: newCatColor === col ? `2px solid ${col}` : "none", cursor: "pointer", flexShrink: 0 }}
                    aria-label={col}
                  />
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>Icon</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                {ICON_PICKER_OPTIONS.map((opt) => (
                  <button key={opt.name} type="button" onClick={() => setNewCatIcon(opt.name)}
                    style={{ padding: 10, borderRadius: 10, cursor: "pointer", border: `2px solid ${newCatIcon === opt.name ? newCatColor : "var(--color-border)"}`, background: newCatIcon === opt.name ? `${newCatColor}18` : "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label={opt.name}
                  >
                    <opt.Icon size={18} style={{ color: newCatIcon === opt.name ? newCatColor : "var(--color-text-secondary)" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-bg)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${newCatColor}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {(() => { const Ic = getIconByName(newCatIcon); return <Ic size={18} style={{ color: newCatColor }} />; })()}
              </div>
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>
                {newCatName.trim() || "Category name"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{newCatType}</span>
            </div>

            <button type="button" className="btn btn-primary" style={{ width: "100%", padding: 14, fontSize: 15 }}
              disabled={savingCustomCat || !newCatName.trim()}
              onClick={handleSaveCustomCat}>
              {savingCustomCat ? "Saving…" : "Create Category"}
            </button>

            {/* Existing custom cats with delete */}
            {customCats.filter(c => c.type === newCatType).length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 10 }}>Your custom {newCatType} categories</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {customCats.filter(c => c.type === newCatType).map((c) => {
                    const CatIcon = getIconByName(c.icon_name);
                    return (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                        <CatIcon size={16} style={{ color: c.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{c.name}</span>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                        <button type="button" onClick={() => handleDeleteCustomCat(c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#E03C31", padding: 4, display: "flex", alignItems: "center" }}
                          aria-label="Delete category">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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
    localStorage.setItem("fundi-sound-enabled", String(next));
  };

  const handleGoal = (g: number) => {
    setSelectedGoal(g);
    setDailyGoal(g);
    localStorage.setItem("fundi-daily-goal", String(g));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("user_progress").upsert({ user_id: user.id, daily_goal: g }, { onConflict: "user_id" });
    });
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

function StatsPanel({ userData, hearts = 5, maxHearts = 5, freezeCount = 0, onBuyFreeze }: { userData: UserData; hearts?: number; maxHearts?: number; freezeCount?: number; onBuyFreeze?: () => void }) {
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
            <Heart size={28} className="text-current" style={{ color: "#E03C31" }} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Hearts</div>
            <div className="stat-value" id="heartsValue">
              {hearts}/{maxHearts}
            </div>
          </div>
        </div>
        {/* Streak Freeze */}
        <div className="stat-item" style={{ alignItems: "flex-start" }}>
          <div className="stat-icon" style={{ color: "#3B82F6" }}>
            <Shield size={28} />
          </div>
          <div className="stat-content" style={{ flex: 1 }}>
            <div className="stat-label">Streak Freezes</div>
            <div className="stat-value" style={{ color: freezeCount > 0 ? "#3B82F6" : "var(--color-text-secondary)" }}>
              {freezeCount} 🧊
            </div>
            {freezeCount === 0 && onBuyFreeze && (
              <button
                type="button"
                onClick={onBuyFreeze}
                style={{
                  marginTop: 6,
                  background: userData.xp >= 200 ? "#3B82F6" : "var(--color-border)",
                  color: userData.xp >= 200 ? "#fff" : "var(--color-text-secondary)",
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: userData.xp >= 200 ? "pointer" : "not-allowed",
                  width: "100%",
                }}
                disabled={userData.xp < 200}
                title={userData.xp >= 200 ? "Buy a streak freeze for 200 XP" : "Need 200 XP"}
              >
                Buy for 200 XP
              </button>
            )}
            {freezeCount > 0 && (
              <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 2 }}>
                Auto-used if you miss a day
              </div>
            )}
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
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
              {(() => {
                const levels = [
                  { min: 0, max: 499 },
                  { min: 500, max: 1499 },
                  { min: 1500, max: 2999 },
                  { min: 3000, max: 4999 },
                  { min: 5000, max: Infinity }
                ];
                const currentLevel = userData.level - 1;
                if (currentLevel < 0 || currentLevel >= levels.length) return null;
                const nextLevel = currentLevel + 1;
                if (nextLevel >= levels.length) return "Max level reached";
                const nextThreshold = levels[nextLevel].min;
                const xpNeeded = Math.max(0, nextThreshold - userData.xp);
                return `${formatWithSpaces(xpNeeded)} XP to Level ${nextLevel + 1}`;
              })()}
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
      {/* Legal disclaimer */}
      <div style={{
        marginTop: "auto",
        paddingTop: 20,
        borderTop: "1px solid var(--color-border)",
        color: "var(--color-text-secondary)",
        fontSize: 10,
        lineHeight: 1.5,
        opacity: 0.7,
        textAlign: "center",
      }}>
        📚 Educational content only — not financial advice. Consult a licensed financial advisor before making any financial decisions.
      </div>
    </aside>
  );
}

// Disposable / obviously-fake email domains to block at signup
const BLOCKED_EMAIL_DOMAINS = new Set([
  "mailinator.com","guerrillamail.com","guerrillamail.net","guerrillamail.org",
  "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
  "spam4.me","trashmail.com","trashmail.net","trashmail.me","trashmail.at",
  "trashmail.io","trashmail.org","yopmail.com","yopmail.fr","cool.fr.nf",
  "jetable.fr.nf","nospam.ze.tc","nomail.xl.cx","mega.zik.dj","speed.1s.fr",
  "courriel.fr.nf","moncourrier.fr.nf","monemail.fr.nf","monmail.fr.nf",
  "dispostable.com","fakeinbox.com","throwam.com","maildrop.cc",
  "throwaway.email","tempmail.com","temp-mail.org","temp-mail.io",
  "getnada.com","mailnesia.com","mailnull.com","spamgourmet.com",
  "spamgourmet.net","spamgourmet.org","spamdecoy.net","spamspot.com",
  "spamfree24.org","spamfree24.de","spamfree24.info","spamfree24.com",
  "emailondeck.com","getairmail.com","fakemailgenerator.com",
  "10minutemail.com","10minutemail.net","10minemail.com",
  "tempr.email","discard.email","spamwc.de","rcpt.at","spam.la",
  "boun.cr","filzmail.com","spamgob.com","spam.su","spamthisplease.com",
]);

function isBlockedEmailDomain(emailAddr: string): boolean {
  const parts = emailAddr.toLowerCase().trim().split("@");
  if (parts.length !== 2) return false;
  return BLOCKED_EMAIL_DOMAINS.has(parts[1]);
}

function isValidEmailFormat(emailAddr: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailAddr.trim());
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
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

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
    if (!isValidEmailFormat(email)) { setError("Please enter a valid email address."); return; }
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) {
      if (e.message.toLowerCase().includes("email not confirmed") ||
          e.message.toLowerCase().includes("not confirmed")) {
        setVerificationEmail(email);
        setAwaitingVerification(true);
      } else {
        setError("Incorrect email or password. Please try again.");
      }
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    const { error: e } = await supabase.auth.resend({ type: "signup", email: verificationEmail });
    if (e) setError(e.message);
    else setError(null);
  };

  const handleSignUp = async () => {
    setError(null);
    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!lastName.trim()) { setError("Please enter your last name."); return; }
    if (!isValidEmailFormat(email)) { setError("Please enter a valid email address."); return; }
    if (isBlockedEmailDomain(email)) {
      setError("Please sign up with a real email address. Temporary or disposable emails are not allowed.");
      return;
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      setError("Please enter a valid age (13+).");
      return;
    }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    const fullName = firstName.trim() + " " + lastName.trim();
    const { data, error: e } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName, age: ageNum } },
    });
    if (e) { setError(e.message); return; }
    // If Supabase email confirmation is enabled, user.identities will be present
    // but session will be null — show verify screen
    if (data.user && !data.session) {
      setVerificationEmail(email.trim().toLowerCase());
      setAwaitingVerification(true);
      return;
    }
    // Auto-confirmed (email confirm disabled) — write profile immediately
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
          @keyframes splashFadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes splashLogoReveal {
            0%   { opacity: 0; transform: scale(0.85); filter: drop-shadow(0 0 0px rgba(34,197,94,0)); }
            60%  { opacity: 1; transform: scale(1.04); filter: drop-shadow(0 0 32px rgba(34,197,94,0.7)); }
            100% { opacity: 1; transform: scale(1);    filter: drop-shadow(0 0 18px rgba(34,197,94,0.4)); }
          }
          @keyframes splashLogoFloat {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-8px); }
          }
          @keyframes splashDividerIn {
            from { opacity: 0; transform: scaleX(0); }
            to   { opacity: 1; transform: scaleX(1); }
          }
          @keyframes splashGlowPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50%       { opacity: 0.85; transform: scale(1.15); }
          }
          .splash-logo-wrap {
            animation: splashLogoReveal 0.9s cubic-bezier(0.22,1,0.36,1) both,
                       splashLogoFloat 3.5s 1.1s ease-in-out infinite;
          }
          .splash-title  { animation: splashFadeUp 0.5s 0.75s ease-out both; }
          .splash-divider{ animation: splashDividerIn 0.45s 1.0s ease-out both; }
          .splash-tagline{ animation: splashFadeUp 0.5s 1.1s ease-out both; }
          .splash-bg-glow{ animation: splashGlowPulse 3s 0.5s ease-in-out infinite; }
        `}</style>
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#ffffff",
          position: "relative", overflow: "hidden",
        }}>
          {/* Subtle ambient glow */}
          <div className="splash-bg-glow" style={{
            position: "absolute", width: 480, height: 480, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(26,124,78,0.08) 0%, rgba(26,124,78,0.03) 50%, transparent 72%)",
            pointerEvents: "none",
          }} />

          {/* Logo — large, fills most of space */}
          <div className="splash-logo-wrap" style={{ position: "relative", zIndex: 1, marginBottom: 28 }}>
            <img
              src="/fundi-logo.png"
              alt="Fundi Finance"
              style={{ width: 260, height: 260, objectFit: "contain", display: "block" }}
            />
          </div>

          {/* App name */}
          <div className="splash-title" style={{
            color: "#1A7C4E", fontSize: 24, fontWeight: 800,
            letterSpacing: 5, textTransform: "uppercase",
            marginBottom: 12, position: "relative", zIndex: 1,
          }}>
            Fundi Finance
          </div>

          {/* Thin divider */}
          <div className="splash-divider" style={{
            width: 40, height: 2, borderRadius: 1,
            background: "linear-gradient(90deg, transparent, rgba(26,124,78,0.6), transparent)",
            marginBottom: 12, position: "relative", zIndex: 1,
          }} />

          {/* Tagline */}
          <div className="splash-tagline" style={{
            color: "rgba(30,30,30,0.45)", fontSize: 11,
            letterSpacing: 2, textTransform: "uppercase", fontWeight: 500,
            position: "relative", zIndex: 1,
          }}>
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
    // ── Email verification pending screen ────────────────────────────────────
    if (awaitingVerification) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
          <div style={{ background: "var(--color-surface)", padding: 32, borderRadius: 20, border: "1px solid var(--color-border)", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-light, #E6F4EF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={32} style={{ color: "var(--color-primary)" }} aria-hidden />
              </div>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: "var(--color-text-primary)" }}>
              Check your email
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 6, lineHeight: 1.6 }}>
              We sent a verification link to
            </p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--color-primary)", marginBottom: 20 }}>
              {verificationEmail}
            </p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Click the link in that email to activate your account. Check your spam folder if you don&apos;t see it.
            </p>
            {error && <p style={{ color: "var(--error-red)", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              className="btn btn-primary" style={{ width: "100%", marginBottom: 10 }}
              onClick={handleResendVerification}
            >
              Resend verification email
            </button>
            <button
              onClick={() => { setAwaitingVerification(false); setMode("signin"); setError(null); }}
              style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      );
    }

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

          {/* ── Social sign-in buttons ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
            <button
              onClick={() => supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
              })}
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 10,
                border: "1.5px solid var(--color-border)", background: "var(--color-surface)",
                color: "var(--color-text-primary)", fontWeight: 600, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
            <button
              onClick={() => supabase.auth.signInWithOAuth({
                provider: "facebook",
                options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
              })}
              style={{
                width: "100%", padding: "11px 16px", borderRadius: 10,
                border: "1.5px solid var(--color-border)", background: "var(--color-surface)",
                color: "var(--color-text-primary)", fontWeight: 600, fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.93-1.956 1.886v2.288h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Continue with Facebook
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
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
    weeklyXp,
    lessonSummary,
    setLessonSummary,
  } = useFundiState();

  // Streak freeze — count-based, powered by useProgress hook

  // ── Register service worker for offline support ───────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {/* silent — no SW support or HTTPS required */});
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

  // Retention ping: fire once per cohort day after signup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const signupStr = localStorage.getItem("fundi-signup-ts");
    if (!signupStr) {
      localStorage.setItem("fundi-signup-ts", String(Date.now()));
      return;
    }
    const hoursSince = (Date.now() - parseInt(signupStr, 10)) / 3_600_000;
    const fired = new Set((localStorage.getItem("fundi-retention-fired") ?? "").split(",").filter(Boolean));
    if (hoursSince >= 1 && !fired.has("day1")) {
      analytics.retentionPing(Math.floor(hoursSince / 24), "day1");
      fired.add("day1");
    }
    if (hoursSince >= 168 && !fired.has("day7")) {
      analytics.retentionPing(Math.floor(hoursSince / 24), "day7");
      fired.add("day7");
    }
    if (hoursSince >= 720 && !fired.has("day30")) {
      analytics.retentionPing(Math.floor(hoursSince / 24), "day30");
      fired.add("day30");
    }
    localStorage.setItem("fundi-retention-fired", Array.from(fired).join(","));
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

  // Cross-device sync — fetch latest progress from Supabase and hydrate localStorage
  useEffect(() => {
    const syncFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── Profiles table ──────────────────────────────────────────────────────
      const { data: profileData } = await supabase
        .from("profiles")
        .select("goal, goal_description, age_range, investor_profile")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileData) {
        if (profileData.goal) {
          localStorage.setItem("fundi-user-goal", profileData.goal);
          window.dispatchEvent(new StorageEvent("storage", { key: "fundi-user-goal", newValue: profileData.goal }));
        }
        if (profileData.goal_description) localStorage.setItem("fundi-goal-description", profileData.goal_description);
        if (profileData.age_range) localStorage.setItem("fundi-age-range", profileData.age_range);
        if (profileData.investor_profile) localStorage.setItem("fundi-investor-profile", profileData.investor_profile);
      }

      // ── User progress table ─────────────────────────────────────────────────
      const { data } = await supabase
        .from("user_progress")
        .select("xp, streak, longest_streak, completed_lessons, hearts, last_heart_lost_at, weekly_xp, week_key, daily_xp_today, daily_xp_date, perfect_lessons, freeze_count, daily_goal, earned_badges, badges")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;

      const todayIso = new Date().toISOString().slice(0, 10);

      // Take the highest value (Supabase wins if ahead, localStorage wins if ahead)
      const takeMax = (localKey: string, remoteVal: number | null | undefined) => {
        const local = parseInt(localStorage.getItem(localKey) ?? "0", 10);
        const remote = remoteVal ?? 0;
        if (remote > local) localStorage.setItem(localKey, String(remote));
      };

      takeMax("fundi-xp", data.xp);
      takeMax("fundi-streak", data.streak);
      takeMax("fundi-longest-streak", data.longest_streak);
      takeMax("fundi-perfect-lessons", data.perfect_lessons);
      takeMax("fundi-hearts", data.hearts ?? 5);

      if ((data.freeze_count ?? 0) > 0) {
        const localFreeze = parseInt(localStorage.getItem("fundi-freeze-count") ?? "0", 10);
        if ((data.freeze_count ?? 0) > localFreeze) {
          localStorage.setItem("fundi-freeze-count", String(data.freeze_count));
        }
      }

      if ((data.daily_goal ?? 0) > 0 && !localStorage.getItem("fundi-daily-goal")) {
        localStorage.setItem("fundi-daily-goal", String(data.daily_goal ?? 50));
      }

      if (data.last_heart_lost_at) {
        const local = parseInt(localStorage.getItem("fundi-last-heart-lost") ?? "0", 10);
        if ((data.last_heart_lost_at as unknown as number) > local) {
          localStorage.setItem("fundi-last-heart-lost", String(data.last_heart_lost_at));
        }
      }

      // Restore today's XP from Supabase if localStorage was wiped
      const localDailyXp = parseInt(localStorage.getItem(`fundi-daily-xp-${todayIso}`) ?? "0", 10);
      if (localDailyXp === 0 && (data.daily_xp_today ?? 0) > 0 && data.daily_xp_date === todayIso) {
        localStorage.setItem(`fundi-daily-xp-${todayIso}`, String(data.daily_xp_today));
      }

      // Merge completed lessons (union of both sets)
      if (data.completed_lessons && Array.isArray(data.completed_lessons)) {
        const localRaw = localStorage.getItem("fundi-completed-lessons");
        const localSet: string[] = localRaw ? JSON.parse(localRaw) : [];
        const merged = Array.from(new Set([...localSet, ...data.completed_lessons]));
        localStorage.setItem("fundi-completed-lessons", JSON.stringify(merged));
      }

      // Merge earned badges (union)
      const remoteBadges: string[] = [
        ...(Array.isArray(data.earned_badges) ? data.earned_badges : []),
        ...(Array.isArray(data.badges) ? data.badges : []),
      ];
      if (remoteBadges.length > 0) {
        const localBadges: string[] = JSON.parse(localStorage.getItem("fundi-earned-badges") ?? "[]");
        const merged = Array.from(new Set([...localBadges, ...remoteBadges]));
        localStorage.setItem("fundi-earned-badges", JSON.stringify(merged));
      }

      // ── Spaced repetition mastery ───────────────────────────────────────────
      const { data: masteryRows } = await supabase
        .from("concept_mastery")
        .select("concept_id, interval_days, ease_factor, repetitions, next_review_date, last_reviewed_at")
        .eq("user_id", user.id);
      if (masteryRows && masteryRows.length > 0) {
        const localMastery: Record<string, import("@/lib/spaced-repetition").MasteryRecord> =
          JSON.parse(localStorage.getItem("fundi-mastery") ?? "{}");
        for (const row of masteryRows) {
          const local = localMastery[row.concept_id];
          // Remote wins if it has more repetitions (more reviews done elsewhere)
          if (!local || row.repetitions > local.repetitions) {
            localMastery[row.concept_id] = {
              concept_id: row.concept_id,
              interval_days: row.interval_days,
              ease_factor: parseFloat(String(row.ease_factor)),
              repetitions: row.repetitions,
              next_review_date: row.next_review_date,
              last_reviewed_at: row.last_reviewed_at,
            };
          }
        }
        localStorage.setItem("fundi-mastery", JSON.stringify(localMastery));
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
    if (name === "budget") setRoute({ name: "budget" });
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
    let newPerfectCount = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
    if (isPerfect) {
      newPerfectCount += 1;
      localStorage.setItem("fundi-perfect-lessons", String(newPerfectCount));
      if (hearts < maxHearts) gainHeart();
    }
    // Track daily challenge progress + first-lesson analytics
    if (typeof window !== "undefined") {
      const isoDay = new Date().toISOString().slice(0, 10);
      const lessonsKey = `fundi-lessons-today-${isoDay}`;
      const newLessonCount = (parseInt(localStorage.getItem(lessonsKey) ?? "0", 10)) + 1;
      localStorage.setItem(lessonsKey, String(newLessonCount));
      // Fire first-lesson-completed analytics event once
      if (!localStorage.getItem("fundi-first-lesson-fired")) {
        const signupTs = parseInt(localStorage.getItem("fundi-signup-ts") ?? String(Date.now()), 10);
        const hoursSince = (Date.now() - signupTs) / 3_600_000;
        analytics.firstLessonCompleted(Math.round(hoursSince * 10) / 10, currentLessonState.courseId);
        localStorage.setItem("fundi-first-lesson-fired", "1");
      }
      if (isPerfect) {
        const perfKey = `fundi-perfect-today-${isoDay}`;
        localStorage.setItem(perfKey, String((parseInt(localStorage.getItem(perfKey) ?? "0", 10)) + 1));
      }
      // Also write ISO-keyed daily XP (for challenge condition checks)
      const xpIsoKey = `fundi-daily-xp-${isoDay}`;
      const prev = parseInt(localStorage.getItem(xpIsoKey) ?? "0", 10);
      const newDailyXp = prev + totalXP;
      localStorage.setItem(xpIsoKey, String(newDailyXp));
      // Compute longest streak
      const currentStreakVal = streakAfterLesson ?? userData.streak;
      const prevLongest = parseInt(localStorage.getItem("fundi-longest-streak") ?? "0", 10);
      const newLongest = Math.max(prevLongest, currentStreakVal);
      if (newLongest > prevLongest) localStorage.setItem("fundi-longest-streak", String(newLongest));
      // Persist all lesson-completion fields to Supabase
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (!user) return;
        await supabase.from("user_progress").upsert({
          user_id: user.id,
          daily_xp_today: newDailyXp,
          daily_xp_date: isoDay,
          streak: currentStreakVal,
          longest_streak: newLongest,
          perfect_lessons: newPerfectCount,
          xp: userData.xp + totalXP,
        } as any, { onConflict: "user_id" });
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
            headline: "5 Lessons Down — Emergency Fund Next",
            body: "You understand why an emergency fund matters. Want a plan to actually build yours — how much, where to keep it, how fast?",
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

    // Schedule spaced-repetition reviews for concepts in this course
    const conceptIds = getConceptIdsForCourse(currentLessonState.courseId ?? "");
    if (conceptIds.length > 0) {
      scheduleConceptsForCourse(conceptIds);
    }

    if (justEarned.length > 0) {
      const merged = [...earned, ...justEarned];
      localStorage.setItem("fundi-earned-badges", JSON.stringify(merged));
      setCourseBadgeIds(merged);
      setNewlyEarnedBadges(justEarned);
      nextLessonRef.current = nextLesson;
      return;
    }

    // Show Duolingo-style lesson summary before navigating
    const elapsedSeconds = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
    const accuracy = totalQuestions > 0 ? Math.round((currentLessonState.correctCount / totalQuestions) * 100) : 100;
    setLessonSummary({
      xpEarned: totalXP,
      timeSeconds: elapsedSeconds,
      accuracy,
      streak: str,
      isPerfect,
      choice,
      nextLessonId: nextLesson?.id ?? null,
      courseId: currentLessonState.courseId,
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
    setRoute({ name: "learn" });
    if (typeof window !== "undefined") {
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
      exportNote: "Your Fundi Finance data export — requested under POPIA Section 23 (Right of Access)",
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
                  route.name === "budget" ? "active" : ""
                }`}
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
            streak={userData.streak}
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
              <div style={{ fontSize: 64, marginBottom: 8 }}>
                {lessonSummary.isPerfect ? "🏆" : "🎉"}
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
                <div style={{ fontSize: 30, marginBottom: 4 }}>🎯</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#1A7C4E" }}>{lessonSummary.accuracy}%</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1A7C4E", textTransform: "uppercase", letterSpacing: 1 }}>Accuracy</div>
              </div>
              {/* Streak */}
              <div style={{
                background: "#FFF3EE", border: "2px solid #F97316",
                borderRadius: 16, padding: "18px 12px", textAlign: "center",
              }}>
                <div style={{ fontSize: 30, marginBottom: 4 }}>🔥</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#EA580C" }}>{lessonSummary.streak}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", textTransform: "uppercase", letterSpacing: 1 }}>Day Streak</div>
              </div>
            </div>

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
              {(() => {
                const BADGE_META: Record<string, { name: string; emoji: string; desc: string }> = {
                  "lesson-1-badge":  { name: "First Step",        emoji: "🎯", desc: "You completed your very first lesson!" },
                  "lesson-5-badge":  { name: "Getting Going",     emoji: "🚀", desc: "You've completed 5 lessons. Keep it up!" },
                  "lesson-10-badge": { name: "On a Roll",         emoji: "🔥", desc: "10 lessons done — you're building real momentum!" },
                  "lesson-25-badge": { name: "Dedicated",         emoji: "💪", desc: "25 lessons completed. You're seriously committed!" },
                  "streak-3-badge":  { name: "3 Day Streak",      emoji: "🗓️", desc: "You learned 3 days in a row!" },
                  "streak-7-badge":  { name: "Week Warrior",      emoji: "🏆", desc: "7-day streak — a full week of learning!" },
                  "xp-100-badge":    { name: "First 100",         emoji: "⚡", desc: "You've earned 100 XP total!" },
                  "xp-500-badge":    { name: "XP Builder",        emoji: "💎", desc: "500 XP earned — you're levelling up fast!" },
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
                  // Respect the lesson summary choice — if user picked "Done", go to course
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
            You&apos;re offline — lessons still available from cache
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

        <StatsPanel userData={userData} hearts={hearts} maxHearts={maxHearts} freezeCount={freezeCount} onBuyFreeze={() => { if (!buyStreakFreeze(200)) alert("Not enough XP! You need 200 XP to buy a streak freeze."); }} />
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
            key: "progress",
            label: "Progress",
            icon: <TrendingUp size={20} className="text-current" />,
            isActive: route.name === "leaderboard",
            onClick: () => handleNav("leaderboard"),
            order: "order-4",
          },
          {
            key: "profile",
            label: "Profile",
            icon: <UserIcon size={20} className="text-current" />,
            isActive: route.name === "profile",
            onClick: () => handleNav("profile"),
            order: "order-5",
          },
        ]}
      />
    </AuthGate>
  );
}

