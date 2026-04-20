/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { analytics } from "@/lib/analytics";
import { CONTENT_DATA } from "@/data/content";
import {
  Share2,
  CreditCard,
  Shield,
  TrendingUp,
  Home as HomeIcon,
  Flag,
  Briefcase,
  PenLine,
  GraduationCap,
  BarChart2,
  Wallet,
  BookOpen,
  Building2,
  Umbrella,
  Brain,
  FileText,
  Siren,
  TrendingDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types shared across multiple components
// ─────────────────────────────────────────────────────────────────────────────

export type WeeklyProgressJSON = {
  lessonsCompleted: number;
  xpEarned: number;
  perfectLessons: number;
  dailyXp: number;
  completed: boolean;
};

export const EMPTY_WEEKLY_PROGRESS: WeeklyProgressJSON = {
  lessonsCompleted: 0,
  xpEarned: 0,
  perfectLessons: 0,
  dailyXp: 0,
  completed: false,
};

export function parseWeeklyChallengeStorage(
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

export function progressNumberFromWeeklyState(
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

// ─────────────────────────────────────────────────────────────────────────────
// Audio
// ─────────────────────────────────────────────────────────────────────────────

export function playSound(type: "correct" | "incorrect" | "complete") {
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

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding options (shared between OnboardingView and LearnView)
// ─────────────────────────────────────────────────────────────────────────────

export const ONBOARDING_GOAL_OPTIONS = [
  { id: "debt-free", label: "Get debt-free", Icon: CreditCard },
  { id: "emergency", label: "Build emergency fund", Icon: Shield },
  { id: "invest", label: "Start investing", Icon: TrendingUp },
  { id: "home", label: "Save for a home", Icon: HomeIcon },
  { id: "retire", label: "Plan for retirement", Icon: Flag },
  { id: "business", label: "Grow my business", Icon: Briefcase },
  { id: "other", label: "Something else", Icon: PenLine },
] as const;

export const ONBOARDING_AGE_RANGES = [
  { id: "18-25", label: "18–25", Icon: GraduationCap },
  { id: "26-35", label: "26–35", Icon: Briefcase },
  { id: "36-45", label: "36–45", Icon: HomeIcon },
  { id: "46-55", label: "46–55", Icon: BarChart2 },
  { id: "56+", label: "56+", Icon: Flag },
] as const;

/** Onboarding goal ids + labels - reuse for Learn screen banner. */
export const GOAL_OPTIONS = ONBOARDING_GOAL_OPTIONS;

export const GOAL_COURSE_MAP: Record<string, string[]> = {
  "debt-free": ["credit-debt", "money-basics", "money-psychology"],
  emergency: ["emergency-fund", "money-basics", "banking-debit"],
  invest: ["investing-basics", "sa-investing", "rand-economy"],
  home: ["property", "credit-debt", "banking-debit"],
  retire: ["retirement", "sa-investing", "investing-basics"],
  business: ["business-finance", "taxes", "money-basics"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Share helpers
// ─────────────────────────────────────────────────────────────────────────────

export function generateShareText(
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

export function ShareButton({
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
    React.createElement("button", {
      type: "button",
      onClick: handleShare,
      className: "flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40",
    },
      React.createElement(Share2, { size: 16, className: "shrink-0", "aria-hidden": true }),
      React.createElement("span", null, label)
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Persist goal
// ─────────────────────────────────────────────────────────────────────────────

export async function persistUserGoalToStorageAndSupabase(goalId: string, goalDescription?: string) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Lesson title lookup
// ─────────────────────────────────────────────────────────────────────────────

export function getLessonTitle(
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type UserData = {
  xp: number;
  level: number;
  streak: number;
  totalCompleted: number;
  dailyXP: number;
  dailyGoal: number;
  badges: string[];
};

export type Route =
  | { name: "learn" }
  | { name: "course"; courseId: string }
  | { name: "lesson"; courseId: string; lessonId: string }
  | { name: "profile" }
  | { name: "leaderboard" }
  | { name: "settings" }
  | { name: "calculator" }
  | { name: "budget" }
  | { name: "onboarding" };

export type CalcInputs = {
  principal: number;
  monthly: number;
  rate: number;
  years: number;
  escalation: number;
  frequency: "monthly" | "annually" | "once-off";
};

// ─────────────────────────────────────────────────────────────────────────────
// Calculator math
// ─────────────────────────────────────────────────────────────────────────────

export function calcGrowth(inputs: CalcInputs) {
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

// ─────────────────────────────────────────────────────────────────────────────
// Number formatters
// ─────────────────────────────────────────────────────────────────────────────

/** Thousands use spaces (e.g. 1 000), not commas. */
export function formatWithSpaces(value: number) {
  if (!isFinite(value) || isNaN(value)) return "0";
  return Math.round(Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

/** Rand amounts with space grouping (en-ZA). */
export function formatRand(v: number): string {
  if (!isFinite(v) || isNaN(v)) return "R0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const formatted = Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${sign}R${formatted}`;
}

export function formatZAR(value: number) {
  return formatRand(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// FundiCharacter mascot
// ─────────────────────────────────────────────────────────────────────────────

export type FundiExpression = "default" | "thinking" | "sad" | "celebrating";

export function FundiCharacter({
  expression = "default",
  size = 100,
  style: extraStyle = {},
}: {
  expression?: FundiExpression;
  size?: number;
  style?: React.CSSProperties;
}) {
  return React.createElement("img", {
    src: `/characters/fundi-${expression}.png`,
    alt: `Fundi ${expression}`,
    width: size,
    height: size,
    style: { objectFit: "contain", display: "block", ...extraStyle },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CourseIcon + COURSE_COLOURS
// ─────────────────────────────────────────────────────────────────────────────

export function CourseIcon({ name, size = 48 }: { name: string; size?: number }) {
  const props = { size, className: "text-current" };
  switch (name) {
    case "wallet":
      return React.createElement(Wallet, props);
    case "briefcase":
      return React.createElement(Briefcase, props);
    case "building-2":
      return React.createElement(Building2, props);
    case "credit-card":
      return React.createElement(CreditCard, props);
    case "shield":
      return React.createElement(Shield, props);
    case "umbrella":
      return React.createElement(Umbrella, props);
    case "trending-up":
      return React.createElement(TrendingUp, props);
    case "flag":
      return React.createElement(Flag, props);
    case "home":
      return React.createElement(HomeIcon, props);
    case "file-text":
      return React.createElement(FileText, props);
    case "siren":
      return React.createElement(Siren, props);
    case "brain":
      return React.createElement(Brain, props);
    case "book-open":
      return React.createElement(BookOpen, props);
    default:
      return React.createElement(Wallet, props);
  }
}

// Course accent colours, cycles through SA-themed palette
export const COURSE_COLOURS = [
  { bg: "#E8F5EE", accent: "#007A4D", light: "#C8EAD9" }, // green
  { bg: "#FFF8E7", accent: "#FFB612", light: "#FFE9A0" }, // gold
  { bg: "#FFF0EF", accent: "#E03C31", light: "#FCCFCC" }, // red
  { bg: "#EEF4FF", accent: "#3B7DD8", light: "#C5D9F7" }, // blue
  { bg: "#F3EEFF", accent: "#7C4DFF", light: "#D9C8FF" }, // purple
  { bg: "#E8FAF0", accent: "#00BFA5", light: "#B2EFE3" }, // teal
  { bg: "#FFF3E0", accent: "#F57C00", light: "#FFD9A8" }, // orange
  { bg: "#FCE4EC", accent: "#C2185B", light: "#F5B8CE" }, // pink
];

// ─────────────────────────────────────────────────────────────────────────────
// Saved lesson progress type
// ─────────────────────────────────────────────────────────────────────────────

export type SavedLessonProgress = {
  courseId: string;
  lessonId: string;
  lessonTitle?: string;
  stepIndex: number;
  savedAt: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// ShareResultButton (canvas-based shareable card)
// ─────────────────────────────────────────────────────────────────────────────

export type ShareCardData =
  | { type: "lesson"; lessonTitle: string; xpEarned: number; isPerfect: boolean; courseName: string }
  | { type: "calculator"; headline: string; sub: string };

export function generateShareCard(data: ShareCardData): Promise<string> {
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

export function ShareResultButton({ data, label = "Share" }: { data: ShareCardData; label?: string }) {
  const [sharing, setSharing] = React.useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const dataUrl = await generateShareCard(data);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fundi-result.png", { type: "image/png" });

      const text = data.type === "calculator"
        ? `${data.headline} - calculated on Fundi Finance 📊 Try it free at fundiapp.co.za`
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

  return React.createElement("button", {
    type: "button",
    onClick: handleShare,
    disabled: sharing,
    style: {
      display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
      padding: "12px 20px", borderRadius: 12, cursor: sharing ? "default" : "pointer",
      border: "1.5px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.08)",
      color: "#22c55e", fontWeight: 700, fontSize: 14, width: "100%",
    },
  },
    React.createElement(Share2, { size: 16 }),
    sharing ? "Generating…" : label
  );
}
