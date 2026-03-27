/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CONTENT_DATA } from "@/data/content";
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
  Hash,
  Home as HomeIcon,
  KeyRound,
  Landmark,
  Lightbulb,
  Link2,
  Lock,
  LogOut,
  Mail,
  Moon,
  PiggyBank,
  Search,
  Settings as SettingsIcon,
  Shield,
  Siren,
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
function OnboardingView({ onComplete }: { onComplete: (goal: string) => void }) {
  const [screen, setScreen] = React.useState(0);
  const [selectedGoal, setSelectedGoal] = React.useState("");

  const goals = [
    { id: "debt", label: "Get out of debt", Icon: CreditCard },
    { id: "save", label: "Build savings", Icon: PiggyBank },
    { id: "invest", label: "Start investing", Icon: TrendingUp },
    { id: "literacy", label: "General financial literacy", Icon: BookOpen },
    { id: "retirement", label: "Plan for retirement", Icon: Sun },
    { id: "home", label: "Buy a home", Icon: HomeIcon },
  ];

  const screens = [
    {
      title: "Welcome to Fundi Finance",
      body: "Master your money in minutes a day. Short, SA-specific lessons that actually make sense, from budgeting to investing to what the Bible says about money.",
      cta: "Let's go",
      action: () => setScreen(1),
    },
    {
      title: "What's your money goal?",
      body: "We'll personalise your learning path based on what matters most to you right now.",
      cta: "Next",
      action: () => {
        if (selectedGoal) setScreen(2);
      },
    },
    {
      title: "How it works",
      body: "Earn XP for every lesson. Build streaks. Unlock badges. Compete on the leaderboard. Every lesson takes less than 3 minutes.",
      cta: "Start learning",
      action: () => onComplete(selectedGoal),
    },
  ];

  const current = screens[screen];

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
        {screens.map((_, i) => (
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
        {screen === 2 && (
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24, textAlign: "left" }}>
            {goals.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGoal(g.id)}
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
                <g.Icon size={18} />
                {g.label}
              </button>
            ))}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%", padding: "14px", fontSize: 16, fontWeight: 700 }}
          onClick={current.action}
          disabled={screen === 1 && !selectedGoal}
        >
          {current.cta}
        </button>

        {screen > 0 && (
          <button
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

// ── Analytics (PostHog) ────────────────────────────────────────────────────────
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "YOUR_POSTHOG_KEY";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

function loadPostHog() {
  if (typeof window === "undefined") return;
  if ((window as any).__phLoaded) return;
  (window as any).__phLoaded = true;
  const s = document.createElement("script");
  s.src = POSTHOG_HOST + "/static/array.js";
  s.async = true;
  s.onload = () => {
    (window as any).posthog?.init(POSTHOG_KEY, { api_host: POSTHOG_HOST, capture_pageview: false });
  };
  document.head.appendChild(s);
}

function track(event: string, props?: Record<string, unknown>) {
  try {
    if (POSTHOG_KEY === "YOUR_POSTHOG_KEY") return; // not configured yet
    (window as any).posthog?.capture(event, props);
  } catch {
    /* ignore */
  }
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

function formatZAR(value: number) {
  return `R${formatWithSpaces(value)}`;
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const [inputStr, setInputStr] = useState(String(value));
  useEffect(() => {
    setInputStr(String(value));
  }, [value]);

  const handleBlur = () => {
    let v = parseFloat(inputStr);
    if (isNaN(v)) v = min;
    v = Math.max(min, Math.round(v / step) * step);
    onChange(v);
    setInputStr(String(v));
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-primary)" }}>{format(value)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="range"
          min={min}
          max={max}
          step="any"
          value={value}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            const snapped = Math.round(raw / step) * step;
            const clamped = Math.max(min, Math.min(max, snapped));
            onChange(clamped);
          }}
          style={{ flex: 1, accentColor: "var(--color-primary)", height: 6, cursor: "pointer" }}
        />
        <input
          type="number"
          min={min}
          step={step}
          value={inputStr}
          onChange={(e) => setInputStr(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          style={{
            width: 72,
            padding: "4px 6px",
            borderRadius: 8,
            textAlign: "right",
            border: "1.5px solid var(--color-border)",
            fontSize: 13,
            fontWeight: 700,
            background: "var(--color-surface)",
            color: "var(--color-primary)",
            MozAppearance: "textfield",
          }}
          aria-label={`${label} exact value`}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Flame size={20} style={{ color: "#FFB612" }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#FFB612" }}>{streak}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Zap size={18} style={{ color: "var(--color-primary)" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-primary)" }}>{xp.toLocaleString()} XP</span>
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

      <SliderInput
        label="Initial Lump Sum"
        value={inputs.principal}
        min={0}
        max={2000000}
        step={5000}
        format={formatZAR}
        onChange={(v) => setInputs({ ...inputs, principal: v })}
      />
      <SliderInput
        label="Monthly Contribution"
        value={inputs.monthly}
        min={0}
        max={50000}
        step={500}
        format={formatZAR}
        onChange={(v) => setInputs({ ...inputs, monthly: v })}
      />
      <SliderInput
        label="Annual Return (%)"
        value={inputs.rate}
        min={1}
        max={30}
        step={0.5}
        format={(v) => `${v}%`}
        onChange={(v) => setInputs({ ...inputs, rate: v })}
      />
      <SliderInput
        label="Investment Term"
        value={inputs.years}
        min={1}
        max={40}
        step={1}
        format={(v) => `${v} yrs`}
        onChange={(v) => setInputs({ ...inputs, years: v })}
      />
      <SliderInput
        label="Annual Contribution Increase (%)"
        value={inputs.escalation}
        min={0}
        max={20}
        step={1}
        format={(v) => `${v}%`}
        onChange={(v) => setInputs({ ...inputs, escalation: v })}
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

      {/* CTA */}
      <div
        style={{
          background: "var(--color-primary-light)",
          border: "1px solid var(--color-primary)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Want a personalised investment plan?</div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 16 }}>
          These numbers are a starting point. A qualified financial professional can help you turn them into a real plan built for your life.
        </p>
        <a
          href="https://wealthwithkwanele.co.za"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "var(--color-primary)",
            color: "white",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Talk to a Finance Professional
        </a>
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
    return parseInt(localStorage.getItem("fundi-hearts") ?? String(MAX_HEARTS), 10);
  });
  const [lastHeartLostAt, setLastHeartLostAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("fundi-last-heart-lost");
    return v ? parseInt(v, 10) : null;
  });

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
        setLastHeartLostAt((prev) =>
          prev ? prev + toAdd * HEART_REGEN_MS : null
        );
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [hearts, lastHeartLostAt]);

  const loseHeart = () => {
    setHearts((h) => {
      const next = Math.max(h - 1, 0);
      localStorage.setItem("fundi-hearts", String(next));
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
  const [challengeProgress, setChallengeProgress] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(`fundi-wc-${weeklyChallenge.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });
  const challengeComplete = challengeProgress >= weeklyChallenge.target;
  const [challengeRewardClaimed, setChallengeRewardClaimed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`fundi-wc-claimed-${weeklyChallenge.id}`) === "true";
  });
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

  useEffect(() => {
    progress.updateStreak();
    // daily XP resets on new day (simple in-memory tracker)
    setDailyXP(0);
  }, []);

  // spendXP removed from hook, handled in Home via direct localStorage

  const addXP = (amount: number) => {
    progress.addXP(amount);
    setDailyXP((v) => v + amount);
    // Show XP toast
    setXpToast({ amount, id: Date.now() });
    setTimeout(() => setXpToast(null), 2000);
  };

  const updateStreakOnComplete = async () => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const lastActivity = localStorage.getItem("fundi-last-activity");
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActivity === today) return; // already updated today
    const currentStreak = parseInt(localStorage.getItem("fundi-streak") ?? "0", 10);
    const newStreak = lastActivity === yesterday ? currentStreak + 1 : 1;
    localStorage.setItem("fundi-streak", String(newStreak));
    localStorage.setItem("fundi-last-activity", today);
    // Push to Supabase
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { error } = await supabase.from("user_progress").upsert(
        {
          user_id: data.user.id,
          streak: newStreak,
          last_activity_date: today,
        },
        { onConflict: "user_id" }
      );
      if (error) {
        // silent fail, offline is fine
      }
    }
  };

  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {
    progress.completeLesson(`${courseId}:${lessonId}`);
    updateStreakOnComplete().catch(() => {});
    addXP(xpEarned);
    // Update weekly challenge progress for lesson-count challenges
    if (weeklyChallenge.unit === "lessons") {
      const next = Math.min(challengeProgress + 1, weeklyChallenge.target);
      setChallengeProgress(next);
      localStorage.setItem(`fundi-wc-${weeklyChallenge.id}`, String(next));
    }
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
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    claimChallengeReward: () => {
      if (challengeComplete && !challengeRewardClaimed) {
        progress.addXP(weeklyChallenge.xp);
        setDailyXP(v => v + weeklyChallenge.xp);
        setChallengeRewardClaimed(true);
        localStorage.setItem(`fundi-wc-claimed-${weeklyChallenge.id}`, "true");
      }
    },
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
  challengeProgress,
  challengeComplete,
  challengeRewardClaimed,
  claimChallengeReward,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
  weeklyChallenge?: { text: string; target: number; xp: number; id: string; unit: string };
  challengeProgress?: number;
  challengeComplete?: boolean;
  challengeRewardClaimed?: boolean;
  claimChallengeReward?: () => void;
}) {
  const [search, setSearch] = useState("");


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

  // Fact of the Day
  const FACTS = [
    "Only 42% of South Africans are financially literate. You're changing that right now.",
    "The Rule of 72: divide 72 by your return rate to find how long to double your money.",
    "73% of South Africans live paycheque to paycheque. A R1,000 emergency fund breaks the cycle.",
    "South Africans pay some of the highest bank fees in the world. Switching banks can save R1,700/year.",
    "Less than 7% of South Africans are on track for a comfortable retirement. Start your RA today.",
    "Your TFSA lifetime limit is R500,000. Invest in it early, all growth is tax-free.",
    "Paying R500/month extra on a 20-year bond at 11.75% saves over R300,000 in interest.",
    "A R50 daily coffee = R18,250/year. Invested at 10% over 20 years = over R1 million.",
    "The two-pot retirement system lets you access 1/3 of new contributions in emergencies.",
    "Compound interest at 10%: R10,000 becomes R67,275 in 20 years. Time is everything.",
  ];
  const todayFact = FACTS[new Date().getDate() % FACTS.length];

  return (
    <main className="main-content main-with-stats" id="mainContent">
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

      {filteredCourses.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)" }}>
          No courses found for "{search}"
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

      <div className="courses-grid">
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

    if (isLessonCompleted(course.id, lesson.id)) return "completed";
    if (!hasContent) return "coming_soon";
    if (lessonIndex === 0) return "playable";
    const prevDone = isLessonCompleted(course.id, unitLessons[lessonIndex - 1].id);
    const state = prevDone ? "playable" : "locked";
    if (prevDone) {
      console.log("[Fundi] Unlock:", course.id + ":" + lesson.id, "unlocked because", unitLessons[lessonIndex - 1].id, "is complete");
    }
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
function FillBlankStep({ step, isAnswered, isCorrect, submittedAnswer, onSubmit, onNext, isLast, correctCount }: {
  step: any; isAnswered: boolean; isCorrect: boolean; submittedAnswer: string | undefined;
  onSubmit: (v: string) => void; onNext: () => void; isLast: boolean; correctCount: number;
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
                <button className="btn btn-primary" onClick={onNext}>Continue</button>
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
  answerQuestion,
  answerTrueFalse,
  correctCount,
  hearts = 5,
  maxHearts = 5,
  heartsRegenInfo,
  goBack,
  courseId,
  courseAccent,
  nextLessonTitle,
}: {
  lessonState: {
    steps: LessonStep[];
    stepIndex: number;
    answers: Record<number, unknown>;
  };
  completeLessonFlow: () => void;
  nextStep: () => void;
  answerQuestion: (index: number) => void;
  answerTrueFalse: (value: boolean) => void;
  correctCount: number;
  hearts?: number;
  maxHearts?: number;
  heartsRegenInfo?: () => { nextHeartIn: string; minutesLeft: number } | null;
  goBack?: () => void;
  courseId?: string;
  courseAccent?: string;
  nextLessonTitle?: string;
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

  // ── Hearts gate ────────────────────────────────────────────────────────────
  if (hearts === 0) {
    const regen = heartsRegenInfo ? heartsRegenInfo() : null;
    return (
      <main className="main-content main-with-stats">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", padding: "2rem",
        }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 20, padding: "2.5rem 2rem",
            textAlign: "center", maxWidth: 360,
          }}>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20, opacity: 0.3 }}>
              {Array.from({ length: maxHearts }).map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" fill="#E03C31" width="28" height="28">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              ))}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>No hearts left!</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
              {regen
                ? `Your next heart arrives in ${regen.nextHeartIn}. Hearts refill 1 per hour.`
                : "Hearts refill 1 per hour. Come back soon!"}
            </p>
            {goBack && (
              <button className="btn btn-primary" onClick={() => setShowExitConfirm(true)}>Exit Lesson</button>
            )}
          </div>
        </div>
      </main>
    );
  }
  // ── End hearts gate ────────────────────────────────────────────────────────

  const renderStep = () => {
    if (!step) return null;
    if (step.type === "info") {
      return (
        <>
          <FundiCharacter expression="thinking" size={80} style={{ margin: "0 auto 12px" }} />
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
                    {nextLessonTitle && (
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 14, opacity: 0.8 }}>
                        Up next: <strong>{nextLessonTitle}</strong>
                      </div>
                    )}
                    <button className="btn btn-primary" onClick={nextStep}>
                      {nextLessonTitle ? "Next Lesson →" : "Back to Course"}
                    </button>
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
                    <button className="btn btn-primary" onClick={nextStep}>
                      Continue
                    </button>
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
}: {
  userData: UserData;
  onSignOut: () => void;
  currentUser: any;
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

  // Load name, show update form if no real full_name exists
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setProfileEmail(user.email ?? "");
      const meta = user.user_metadata;
      const fullName = meta?.full_name ?? "";
      // Consider it "missing" if empty OR looks like an email prefix
      const isMissing = !fullName || fullName.includes("@") || fullName === user.email?.split("@")[0];
      if (!isMissing) {
        setProfileName(fullName);
      } else {
        // Pre-fill edit fields from whatever we have
        setNeedsProfileUpdate(true);
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    const firstName = editFirstName.trim();
    const lastName = editLastName.trim();
    const ageNum = parseInt(editAge, 10);
    if (!firstName) { setSaveError("Please enter your first name."); return; }
    if (!lastName) { setSaveError("Please enter your last name."); return; }
    if (!editAge || isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
      setSaveError("Please enter a valid age (13+).");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const fullName = firstName + " " + lastName;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not signed in");
      // Update Supabase auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, age: ageNum },
      });
      if (updateError) throw updateError;
      // Also upsert to profiles table for leaderboard
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: fullName,
        age: ageNum,
      }, { onConflict: "user_id" });
      setProfileName(fullName);
      setNeedsProfileUpdate(false);
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
    // Lesson milestones
    { id: "lesson-1",   name: "First Step",       desc: "Completed your first lesson",     icon: <CheckCircle2 size={22} className="text-current" />, earned: tc >= 1 },
    { id: "lesson-5",   name: "Getting Going",    desc: "Completed 5 lessons",             icon: <BookOpen size={22} className="text-current" />,     earned: tc >= 5 },
    { id: "lesson-10",  name: "On a Roll",        desc: "Completed 10 lessons",            icon: <TrendingUp size={22} className="text-current" />,   earned: tc >= 10 },
    { id: "lesson-25",  name: "Dedicated",        desc: "Completed 25 lessons",            icon: <Target size={22} className="text-current" />,       earned: tc >= 25 },
    { id: "lesson-50",  name: "Half Century",     desc: "Completed 50 lessons",            icon: <Trophy size={22} className="text-current" />,       earned: tc >= 50 },
    { id: "lesson-100", name: "Centurion",        desc: "Completed 100 lessons",           icon: <Trophy size={22} className="text-current" />,       earned: tc >= 100 },
    // Streak milestones
    { id: "streak-3",   name: "3 Day Streak",     desc: "Learned 3 days in a row",        icon: <Flame size={22} className="text-current" />,        earned: str >= 3 },
    { id: "streak-7",   name: "Week Warrior",     desc: "7-day learning streak",          icon: <Flame size={22} className="text-current" />,        earned: str >= 7 },
    { id: "streak-14",  name: "Two Weeks Strong", desc: "14-day learning streak",         icon: <Zap size={22} className="text-current" />,          earned: str >= 14 },
    { id: "streak-30",  name: "Monthly Habit",    desc: "30-day learning streak",         icon: <Zap size={22} className="text-current" />,          earned: str >= 30 },
    { id: "streak-60",  name: "Unstoppable",      desc: "60-day learning streak",         icon: <Trophy size={22} className="text-current" />,       earned: str >= 60 },
    { id: "streak-100", name: "Legendary",        desc: "100-day learning streak",        icon: <Trophy size={22} className="text-current" />,       earned: str >= 100 },
    // XP milestones
    { id: "xp-100",     name: "First 100",        desc: "Earned 100 XP",                  icon: <Zap size={22} className="text-current" />,          earned: xpv >= 100 },
    { id: "xp-500",     name: "XP Builder",       desc: "Earned 500 XP",                  icon: <Zap size={22} className="text-current" />,          earned: xpv >= 500 },
    { id: "xp-1000",    name: "Knowledge Is Power", desc: "Earned 1 000 XP",              icon: <Brain size={22} className="text-current" />,        earned: xpv >= 1000 },
    { id: "xp-5000",    name: "Finance Pro",      desc: "Earned 5 000 XP",                icon: <Wallet size={22} className="text-current" />,       earned: xpv >= 5000 },
    // Perfect lesson milestones
    { id: "perfect-1",  name: "Flawless",         desc: "Got a perfect score on a lesson", icon: <CheckCircle2 size={22} className="text-current" />, earned: perfectLessons >= 1 },
    { id: "perfect-5",  name: "Sharp Mind",       desc: "5 perfect lesson scores",         icon: <Brain size={22} className="text-current" />,        earned: perfectLessons >= 5 },
    { id: "perfect-10", name: "Untouchable",      desc: "10 perfect lesson scores",        icon: <Trophy size={22} className="text-current" />,       earned: perfectLessons >= 10 },
  ];

  const earnedBadges = BADGE_DEFS.filter((b) => b.earned);

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
      </div>

      {/* ── Profile update prompt (shown until user sets name) ── */}
      {needsProfileUpdate && (
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
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="text" placeholder="First name" value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
            />
            <input
              type="text" placeholder="Last name" value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13 }}
            />
          </div>
          <input
            type="number" placeholder="Age" value={editAge} min={13} max={120}
            inputMode="numeric"
            onKeyDown={(e) => { if (["e","E","+","-","."].includes(e.key)) e.preventDefault(); }}
            onChange={(e) => setEditAge(e.target.value.replace(/D/g, ""))}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 13, marginBottom: 8, boxSizing: "border-box" as const }}
          />
          {saveError && <p style={{ color: "var(--error-red, #E03C31)", fontSize: 12, marginBottom: 8 }}>{saveError}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
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
          { label: "XP", value: userData.xp.toLocaleString(), color: "var(--color-primary)" },
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

      {/* ── Talk to a finance professional (same style as calculator CTA) ── */}
      <div
        style={{
          background: "var(--color-primary-light)",
          border: "1px solid var(--color-primary)",
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Talk to a finance professional</div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 16 }}>
          Get personalised guidance for your goals. Email Kwanele to start the conversation.
        </p>
        <a
          href="mailto:kwanele@wealthwithkwanele.co.za?subject=Fundi%20Finance%20-%20Financial%20guidance"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "var(--color-primary)",
            color: "white",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Talk to a Finance Professional
        </a>
      </div>

      {/* ── Earned badges ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
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
                onClick={() => setSelectedBadge(badge)}
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
          href="https://www.wealthwithkwanele.co.za/resources"
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
  const [leaders, setLeaders] = useState<{ id: string; name: string; xp: number; isYou: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    async function load() {
      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        const myId = user?.id ?? currentUserId ?? null;

        // 2. Fetch top 20 by XP
        const { data: progressRows, error } = await supabase
          .from("user_progress")
          .select("user_id, xp")
          .order("xp", { ascending: false })
          .limit(20);

        if (error || !progressRows) {
          setLoadError(true);
          setLoading(false);
          return;
        }

        // 3. Fetch display names from profiles table
        const userIds = progressRows.map((r: any) => r.user_id);
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const nameMap: Record<string, string> = {};
        (profileRows ?? []).forEach((p: any) => {
          if (p.full_name) nameMap[p.user_id] = p.full_name.split(" ")[0]; // first name only
        });

        const rows = progressRows.map((row: any) => {
          const isYou = row.user_id === myId;
          const name = isYou
            ? "You"
            : (nameMap[row.user_id] ?? "Learner " + row.user_id.slice(0, 4).toUpperCase());
          return { id: row.user_id, name, xp: row.xp ?? 0, isYou };
        });

        // Ensure current user is in the list even if outside top 20
        const alreadyIn = rows.some((r) => r.isYou);
        if (!alreadyIn && myId) {
          const myName = user?.user_metadata?.full_name?.split(" ")[0] ?? "You";
          rows.push({ id: myId, name: "You (" + myName + ")", xp, isYou: true });
          rows.sort((a, b) => b.xp - a.xp);
        }

        setLeaders(rows);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [xp, currentUserId]);

  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Leaderboard</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 24, fontSize: 14 }}>
        All players ranked by XP
      </p>
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
        <div
          className="leaderboard-table"
          style={{
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className="leaderboard-row"
              style={leader.isYou ? { background: "rgba(0,122,77,0.08)", border: "1.5px solid var(--color-primary)" } : undefined}
            >
              <div className={`leaderboard-rank ${index < 3 ? "top" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {index === 0 ? <Trophy size={22} style={{ color: "#FFB612" }} aria-hidden /> :
                  index === 1 ? <Trophy size={22} style={{ color: "#9CA3AF" }} aria-hidden /> :
                  index === 2 ? <Trophy size={22} style={{ color: "#CD7F32" }} aria-hidden /> :
                  index + 1}
              </div>
              <div className="leaderboard-avatar" style={{ background: leader.isYou ? "var(--color-primary)" : "#eee", color: leader.isYou ? "white" : "#555" }}>
                {leader.name[0].toUpperCase()}
              </div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">
                  {leader.name}
                  {leader.isYou && (
                    <span style={{ marginLeft: 6, fontSize: 11, background: "var(--color-primary)", color: "white", borderRadius: 999, padding: "2px 7px", fontWeight: 700 }}>You</span>
                  )}
                </div>
              </div>
              <div className="leaderboard-xp" style={{ color: leader.isYou ? "var(--color-primary)" : undefined }}>
                {leader.xp.toLocaleString()} XP
              </div>
            </div>
          ))}
        </div>
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
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Settings</h2>

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
      <a href="mailto:kwanele@wealthwithkwanele.co.za?subject=Fundi%20Finance%20Support" style={{ textDecoration: "none" }}>
        <Row icon={<Shield size={18} />} label="Email support" sub="kwanele@wealthwithkwanele.co.za">
          <ArrowLeft size={16} style={{ transform: "rotate(180deg)", color: "var(--color-text-secondary)" }} />
        </Row>
      </a>
      <a href="https://wealthwithkwanele.co.za" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <Row icon={<TrendingUp size={18} />} label="Wealth with Kwanele" sub="wealthwithkwanele.co.za">
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
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          Built by{" "}
          <a href="https://wealthwithkwanele.co.za" target="_blank" rel="noopener noreferrer"
            style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Kwanele Ntshangase
          </a>
        </div>
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
        <div className="stat-item">
          <div className="stat-icon">
            <Flame size={28} className="text-current" />
          </div>
          <div className="stat-content">
            <div className="stat-label">Day Streak</div>
            <div className="stat-value" id="streakValue">
              {userData.streak}
            </div>
          </div>
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
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0d1f17",
      }}>
        <img
          src="/fundi-logo.png"
          alt="Fundi Finance"
          style={{ width: 200, height: 200, objectFit: "contain", marginBottom: 20, animation: "pulse 1.5s ease-in-out infinite" }}
        />
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 1 }}>Loading…</div>
      </div>
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]" style={{ padding: 16 }}>
        <div style={{ background: "white", padding: 28, borderRadius: 20, border: "2px solid var(--border-light)", maxWidth: 420, width: "100%" }}>
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 20 }}>
            <img src="/fundi-logo.png" alt="" width={80} height={80} style={{ objectFit: "contain" }} />
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Fundi Finance</h1>
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

export default function Home() {
  // Streak freeze, stored in localStorage, managed locally
  const streakFreezeActive: boolean =
    typeof window !== "undefined" && localStorage.getItem("fundi-streak-freeze") === "true";
  const buyStreakFreeze = () => {
    if (typeof window === "undefined" || streakFreezeActive) return;
    const currentXP = parseInt(localStorage.getItem("fundi-xp") ?? "0", 10);
    if (currentXP < 50) return;
    localStorage.setItem("fundi-xp", String(currentXP - 50));
    localStorage.setItem("fundi-streak-freeze", "true");
    window.location.reload();
  };
  const {
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
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    claimChallengeReward,
  } = useFundiState();

  // Load PostHog analytics on mount
  useEffect(() => { loadPostHog(); }, []);

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
    // Flatten all lessons across all units
    const allLessons: Lesson[] = course.units.flatMap((u) => u.lessons);
    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return null;
    // Find the next lesson that has steps (not coming soon)
    for (let i = currentIndex + 1; i < allLessons.length; i++) {
      const candidate = allLessons[i];
      if (candidate.steps && candidate.steps.length > 0) return candidate;
    }
    return null; // end of course
  };

  // ── Start a specific lesson (used for auto-advance) ──────────────────────
  const startLesson = (courseId: string, lesson: Lesson) => {
    if (!lesson.steps || lesson.steps.length === 0) return;
    console.log("[Fundi] Auto-advancing to:", courseId + ":" + lesson.id);
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

  const nextStep = () => {
    if (currentLessonState.stepIndex < currentLessonState.steps.length - 1) {
      setCurrentLessonState((prev) => ({
        ...prev,
        stepIndex: prev.stepIndex + 1,
      }));
    } else {
      const baseXP = 50;
      const totalXP =
        baseXP + currentLessonState.correctCount * 10;
      if (
        currentLessonState.courseId &&
        currentLessonState.lessonId
      ) {
        console.log("[Fundi] Lesson complete:", currentLessonState.courseId + ":" + currentLessonState.lessonId, "+" + totalXP + "XP");
        track("lesson_completed", {
          course_id: currentLessonState.courseId,
          lesson_id: currentLessonState.lessonId,
          xp_earned: totalXP,
          correct_count: currentLessonState.correctCount,
        });
        completeLesson(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          totalXP
        );
      }
      playSound("complete");
      // Track perfect lessons for badge system
      const totalQuestions = currentLessonState.steps.filter(
        (s) => s.type === "mcq" || s.type === "true-false" || s.type === "scenario"
      ).length;
      if (totalQuestions > 0 && currentLessonState.correctCount === totalQuestions) {
        const prev = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
        localStorage.setItem("fundi-perfect-lessons", String(prev + 1));
      }
      // Build wrong-answer review list
      const reviewList: { question: string; yourAnswer: string; correct: string; wasCorrect: boolean; }[] = [];
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
              yourAnswer: String(ans),
              correct: String(s.correct),
              wasCorrect,
            });
          }
        }
      });
      if (reviewList.length > 0) {
        setReviewAnswers(reviewList);
        // Still compute badges and next lesson, they'll show after review
      }

      // Compute newly earned badges for celebration modal
      const tc = userData.totalCompleted + 1; // +1 because completeLesson just ran
      const str = userData.streak;
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
      const justEarned = THRESHOLDS.filter(b => b.test && !earned.includes(b.id)).map(b => b.id);
      // Determine next lesson for auto-advance
      const nextLesson = getNextLesson(
        currentLessonState.courseId!,
        currentLessonState.lessonId!
      );

      if (justEarned.length > 0) {
        localStorage.setItem("fundi-earned-badges", JSON.stringify([...earned, ...justEarned]));
        setNewlyEarnedBadges(justEarned);
        // nextLesson stored in ref so badge dismiss can use it
        nextLessonRef.current = nextLesson;
      } else if (nextLesson) {
        // Auto-advance directly
        startLesson(currentLessonState.courseId!, nextLesson);
      } else {
        setRoute({ name: "course", courseId: currentLessonState.courseId! });
      }
    }
  };

  // Wire fill-blank submissions
  React.useEffect(() => {
    (window as any).__fillBlankSubmit = (val: string, correct: boolean) => {
      setCurrentLessonState(prev => ({
        ...prev,
        answers: { ...prev.answers, [prev.stepIndex]: val },
        correctCount: correct ? prev.correctCount + 1 : prev.correctCount,
      }));
      playSound(correct ? "correct" : "incorrect");
      track(correct ? "answer_correct" : "answer_incorrect", {
        course_id: currentLessonState.courseId,
        lesson_id: currentLessonState.lessonId,
        step_index: currentLessonState.stepIndex,
        type: "fill-blank",
      });
      if (!correct) loseHeart();
    };
  }, [currentLessonState]);

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
    track(isCorrect ? "answer_correct" : "answer_incorrect", {
      course_id: currentLessonState.courseId,
      lesson_id: currentLessonState.lessonId,
      step_index: currentLessonState.stepIndex,
    });
    if (!isCorrect) loseHeart();
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
    if (!isCorrect) loseHeart();
  };

  const handleResetProgress = () => {
    if (typeof window !== "undefined" && window.confirm("Reset all progress?")) {
      void resetProgressState();
      window.location.reload();
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
  const handleOnboardingComplete = (goal: string) => {
    localStorage.setItem("fundi-onboarded", "true");
    if (goal) localStorage.setItem("fundi-user-goal", goal);
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
        <nav className="sidebar hidden md:block">
          <div className="logo">
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
        <div className="pb-24">
        {/* TopBar moved outside scroll area, see below */}
        {route.name === "learn" && (
          <LearnView
            courses={CONTENT_DATA.courses}
            isLessonCompleted={isLessonCompleted}
            goToCourse={(courseId) => {
              track("course_opened", { course_id: courseId });
              setRoute({ name: "course", courseId });
            }}
            weeklyChallenge={weeklyChallenge}
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
              console.log("[Fundi] Lesson loaded:", courseId + ":" + lessonId, "(" + found.steps.length + " steps)");
              track("lesson_started", { course_id: courseId, lesson_id: lessonId, step_count: found.steps.length });
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
            answerQuestion={answerQuestion}
            answerTrueFalse={answerTrueFalse}
            correctCount={currentLessonState.correctCount}
            hearts={hearts}
            maxHearts={maxHearts}
            heartsRegenInfo={heartsRegenInfo}
            goBack={() =>
              currentLessonState.courseId
                ? setRoute({ name: "course", courseId: currentLessonState.courseId })
                : setRoute({ name: "learn" })
            }
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
          />
        )}

        {route.name === "profile" && (
          <ProfileView userData={userData} onSignOut={handleProfileSignOut} currentUser={null} />
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

