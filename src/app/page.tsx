/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useEffect, useMemo, useState } from "react";
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
  ArrowLeft,
  BookOpen,
  Brain,
  Building2,
  Briefcase,
  Calculator,
  CheckCircle2,
  CreditCard,
  FileText,
  Flame,
  Flag,
  Home as HomeIcon,
  Lock,
  Settings as SettingsIcon,
  Shield,
  Siren,
  Target,
  TrendingUp,
  Trophy,
  LogOut,
  Umbrella,
  User as UserIcon,
  Wallet,
  Zap,
} from "lucide-react";

import type { Course, Lesson, LessonStep } from "@/data/content";

function playSound(type: "correct" | "incorrect" | "complete") {
  if (typeof window === "undefined") return;
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
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.3
      );
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "incorrect") {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.3
      );
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "complete") {
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.5
      );
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch {
    // ignore audio errors
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
  | { name: "calculator" };

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

function formatZAR(value: number) {
  return `R${Math.round(value).toLocaleString("en-ZA")}`;
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
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "var(--color-primary)",
          }}
        >
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          accentColor: "var(--color-primary)",
          height: 6,
          cursor: "pointer",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--color-text-secondary)",
          marginTop: 2,
        }}
      >
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
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

  const dataA = calcGrowth(inputsA);
  const dataB = calcGrowth(inputsB);
  const finalA = dataA[dataA.length - 1];
  const finalB = dataB[dataB.length - 1];

  const chartData: Record<string, number>[] =
    mode === "single"
      ? dataA.map((d) => ({
          year: d.year,
          "Portfolio Value": d.value,
          "Total Contributions": d.contributions,
        }))
      : dataA.map((d, i) => ({
          year: d.year,
          "Investment A": d.value,
          "Investment B": dataB[i]?.value ?? 0,
        }));

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
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            marginBottom: 8,
          }}
        >
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
                borderColor:
                  inputs.frequency === f
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                background:
                  inputs.frequency === f
                    ? "var(--color-primary-light)"
                    : "white",
                color:
                  inputs.frequency === f
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
              }}
            >
              {f === "once-off"
                ? "Once-off"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
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
        background: highlight
          ? "var(--color-primary)"
          : "var(--color-surface)",
        border: `1px solid ${
          highlight ? "var(--color-primary)" : "var(--color-border)"
        }`,
        borderRadius: 12,
        padding: "16px 20px",
        textAlign: "center",
        flex: 1,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: highlight
            ? "rgba(255,255,255,0.8)"
            : "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: highlight ? "white" : "var(--color-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <main className="main-content main-with-stats">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
        Investment Calculator
      </h2>
      <p
        style={{
          color: "var(--color-text-secondary)",
          marginBottom: 24,
        }}
      >
        See how your money can grow over time
      </p>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
        }}
      >
        {(["single", "compare"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              border: "none",
              background:
                mode === m ? "var(--color-primary)" : "transparent",
              color:
                mode === m ? "white" : "var(--color-text-secondary)",
              transition: "all 0.2s ease",
            }}
          >
            {m === "single" ? "Single" : "Compare Two"}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <InputPanel
          label={mode === "compare" ? "Investment A" : undefined}
          inputs={inputsA}
          setInputs={setInputsA}
        />
        {mode === "compare" && (
          <InputPanel
            label="Investment B"
            inputs={inputsB}
            setInputs={setInputsB}
          />
        )}
      </div>

      {mode === "single" ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <ResultCard
            label="Final Value"
            value={formatZAR(finalA.value)}
            highlight
          />
          <ResultCard
            label="Total Contributions"
            value={formatZAR(finalA.contributions)}
          />
          <ResultCard
            label="Total Interest Earned"
            value={formatZAR(finalA.interest)}
          />
        </div>
      ) : (
        <div
          style={{
            marginBottom: 24,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ background: "var(--color-bg)" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 700,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Metric
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "var(--color-primary)",
                  }}
                >
                  Investment A
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "var(--color-secondary)",
                  }}
                >
                  Investment B
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Final Value",
                  formatZAR(finalA.value),
                  formatZAR(finalB.value),
                ],
                [
                  "Total Contributions",
                  formatZAR(finalA.contributions),
                  formatZAR(finalB.contributions),
                ],
                [
                  "Total Interest",
                  formatZAR(finalA.interest),
                  formatZAR(finalB.interest),
                ],
                ["Annual Return", `${inputsA.rate}%`, `${inputsB.rate}%`],
                ["Term", `${inputsA.years} yrs`, `${inputsB.years} yrs`],
              ].map(([metric, a, b]) => (
                <tr
                  key={metric}
                  style={{
                    borderTop: "1px solid var(--color-border)",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {metric}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}
                  >
                    {a}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--color-secondary)",
                    }}
                  >
                    {b}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>
          Growth Over Time
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Yr ${v}`}
              tick={{
                fontSize: 11,
                fill: "var(--color-text-secondary)",
              }}
            />
            <YAxis
              tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`}
              tick={{
                fontSize: 11,
                fill: "var(--color-text-secondary)",
              }}
            />
            <Tooltip
              formatter={(value: number) => formatZAR(value)}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />
            {mode === "single" ? (
              <>
                <Line
                  type="monotone"
                  dataKey="Portfolio Value"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Total Contributions"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="Investment A"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Investment B"
                  stroke="var(--color-secondary)"
                  strokeWidth={3}
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

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
        <div
          style={{
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 4,
          }}
        >
          Want a personalised investment plan?
        </div>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          Kwanele has helped 100+ South Africans build real portfolios. Your
          numbers deserve a real plan.
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
          Book a Free Call
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
  const [route, setRoute] = useState<Route>({ name: "learn" });
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

  const addXP = (amount: number) => {
    progress.addXP(amount);
    setDailyXP((v) => v + amount);
  };

  const completeLesson = (courseId: string, lessonId: string, xpEarned: number) => {
    progress.completeLesson(`${courseId}:${lessonId}`);
    addXP(xpEarned);
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
    if (!found || found.comingSoon || !found.steps) return;
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

  const value = {
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
    default:
      return <Wallet {...props} />;
  }
}

function LearnView({
  courses,
  isLessonCompleted,
  goToCourse,
}: {
  courses: Course[];
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goToCourse: (courseId: string) => void;
}) {
  return (
    <main className="main-content main-with-stats" id="mainContent">
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>
        Your Learning Path
      </h2>
      <div className="courses-grid">
        {courses.map((course) => {
          const totalLessons = course.units.reduce(
            (sum, unit) => sum + unit.lessons.length,
            0
          );
          const completedLessons = course.units.reduce((sum, unit) => {
            return (
              sum +
              unit.lessons.filter((lesson) =>
                isLessonCompleted(course.id, lesson.id)
              ).length
            );
          }, 0);
          const percentage =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;
          return (
            <div
              key={course.id}
              className="course-card"
              onClick={() => goToCourse(course.id)}
            >
              <div className="course-header">
                <div>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    <CourseIcon name={course.icon} size={48} />
                  </div>
                  <div className="course-title">{course.title}</div>
                  <div className="course-description">
                    {course.description}
                  </div>
                </div>
                <div className="course-progress">
                  <div className="course-percentage">{percentage}%</div>
                  <div className="course-percentage-label">Complete</div>
                </div>
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
}: {
  course: Course;
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  goBack: () => void;
  goToLesson: (lessonId: string) => void;
}) {
  return (
    <main className="main-content main-with-stats">
      <div className="course-map">
        <button className="back-button" onClick={goBack}>
          <span className="inline-flex items-center gap-2">
            <ArrowLeft size={20} className="text-current" />
            Back to Courses
          </span>
        </button>
        <div className="course-map-header">
          <div style={{ marginBottom: 16 }}>
            <CourseIcon name={course.icon} size={64} />
          </div>
          <h2 className="course-map-title">{course.title}</h2>
          <p className="course-map-description">{course.description}</p>
        </div>
        {course.units.map((unit) => (
          <div className="unit" key={unit.id}>
            <div className="unit-header">
              <div className="unit-title">{unit.title}</div>
              <div className="unit-description">{unit.description}</div>
            </div>
            <div className="lessons-path">
              {unit.lessons.map((lesson) => {
                const completed = isLessonCompleted(course.id, lesson.id);
                const comingSoon = lesson.comingSoon;
                let nodeClass = "lesson-node";
                let icon: ReactNode = (
                  <BookOpen size={28} className="text-current" />
                );
                if (comingSoon) {
                  nodeClass += " coming-soon";
                  icon = <Lock size={28} className="text-current" />;
                } else if (completed) {
                  nodeClass += " completed";
                  icon = <CheckCircle2 size={28} className="text-current" />;
                }
                return (
                  <div key={lesson.id}>
                    <div
                      className={nodeClass}
                      onClick={() =>
                        !comingSoon ? goToLesson(lesson.id) : undefined
                      }
                    >
                      {icon}
                    </div>
                    <div className="lesson-label">{lesson.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function LessonView({
  lessonState,
  completeLessonFlow,
  nextStep,
  answerQuestion,
  answerTrueFalse,
  correctCount,
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
}) {
  const step = lessonState.steps[lessonState.stepIndex];
  const progress =
    ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;

  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;

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
                        className="text-[var(--color-accent)]"
                        style={{ margin: "0 auto" }}
                      />
                    </div>
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
                    <div
                      style={{
                        fontSize: 48,
                        marginBottom: 8,
                      }}
                    >
                      <Trophy
                        size={48}
                        className="text-[var(--color-accent)]"
                        style={{ margin: "0 auto" }}
                      />
                    </div>
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
    return null;
  };

  return (
    <main className="main-content main-with-stats">
      <div className="lesson-player">
        <div className="lesson-progress-bar">
          <div
            className="lesson-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="lesson-step">{renderStep()}</div>
      </div>
    </main>
  );
}

function ProfileView({
  userData,
  onSignOut,
}: {
  userData: UserData;
  onSignOut: () => void;
}) {
  const totalCompleted = useMemo(
    () => userData.totalCompleted,
    [userData.totalCompleted]
  );

  const allBadges = [
    { id: "first-lesson", name: "First Steps", icon: <CheckCircle2 size={20} className="text-current" /> },
    { id: "five-lessons", name: "Getting Started", icon: <TrendingUp size={20} className="text-current" /> },
    { id: "ten-lessons", name: "On a Roll", icon: <Flame size={20} className="text-current" /> },
    { id: "twenty-lessons", name: "Committed", icon: <Target size={20} className="text-current" /> },
    { id: "streak-7", name: "7 Day Streak", icon: <Zap size={20} className="text-current" /> },
    { id: "streak-30", name: "30 Day Streak", icon: <Trophy size={20} className="text-current" /> },
    { id: "course-complete", name: "Course Master", icon: <BookOpen size={20} className="text-current" /> },
    { id: "all-courses", name: "Finance Pro", icon: <Wallet size={20} className="text-current" /> },
  ];

  return (
    <main className="main-content main-with-stats">
      <div className="profile-header">
        <div className="profile-avatar">
          <UserIcon size={56} className="text-white" />
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Your Profile
        </h2>
        <p style={{ fontSize: 18, color: "var(--text-light)" }}>
          Keep learning every day!
        </p>
      </div>

      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.xp}</div>
          <div className="profile-stat-label">Total XP</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.level}</div>
          <div className="profile-stat-label">Level</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{userData.streak}</div>
          <div className="profile-stat-label">Day Streak</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{totalCompleted}</div>
          <div className="profile-stat-label">Lessons Completed</div>
        </div>
      </div>

      <div className="badges-section">
        <h3
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Your Badges
        </h3>
        <p style={{ color: "var(--text-light)", marginBottom: 24 }}>
          Earn badges by completing lessons and maintaining streaks
        </p>
        <div className="badges-grid">
          {allBadges.map((badge) => {
            const earned = userData.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`badge ${earned ? "earned" : "locked"}`}
              >
                <div className="badge-icon inline-flex items-center justify-center">
                  {badge.icon}
                </div>
                <div className="badge-name">{badge.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--color-danger)" }}
        >
          <LogOut size={18} className="text-current" />
          Sign Out
        </button>
      </div>
    </main>
  );
}

function LeaderboardView({ xp }: { xp: number }) {
  const leaders = useMemo(
    () =>
      [
        { name: "Thabo M.", xp: 5240 },
        { name: "Sarah K.", xp: 4890 },
        { name: "You", xp },
        { name: "John D.", xp: 3120 },
        { name: "Nomsa P.", xp: 2850 },
        { name: "Michael T.", xp: 2630 },
        { name: "Jessica R.", xp: 2410 },
        { name: "David L.", xp: 2180 },
      ].sort((a, b) => b.xp - a.xp),
    [xp]
  );

  return (
    <main className="main-content main-with-stats">
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Leaderboard
      </h2>
      <div className="leaderboard-table">
        {leaders.map((leader, index) => {
          const isYou = leader.name === "You";
          const rankClass = index < 3 ? "top" : "";
          return (
            <div
              key={leader.name}
              className="leaderboard-row"
              style={
                isYou
                  ? { background: "rgba(88, 204, 2, 0.1)" }
                  : undefined
              }
            >
              <div className={`leaderboard-rank ${rankClass}`}>
                {index + 1}
              </div>
              <div className="leaderboard-avatar">
                {leader.name[0]}
              </div>
              <div className="leaderboard-info">
                <div className="leaderboard-name">
                  {leader.name}
                  {isYou ? (
                    <span className="ml-2 inline-flex align-middle">
                      <Target size={16} className="text-current" />
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="leaderboard-xp">
                {leader.xp.toLocaleString()} XP
              </div>
            </div>
          );
        })}
      </div>
    </main>
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
  const [value, setValue] = useState(userData.dailyGoal);
  return (
    <main className="main-content main-with-stats">
      <h2
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Settings
      </h2>
      <div className="settings-section">
        <h3>Daily Goal</h3>
        <div className="setting-item">
          <div className="setting-label">XP Goal per Day</div>
          <input
            type="number"
            className="setting-input"
            value={value}
            min={10}
            max={500}
            step={10}
            onChange={(e) => setValue(Number(e.target.value))}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          onClick={() => setDailyGoal(value)}
        >
          Save Goal
        </button>
      </div>
      <div className="settings-section">
        <h3>Data Management</h3>
        <p style={{ color: "var(--text-light)", marginBottom: 16 }}>
          Warning: This will delete all your progress!
        </p>
        <button
          className="btn btn-secondary"
          style={{
            background: "var(--error-red)",
            color: "white",
            border: "none",
          }}
          onClick={resetProgress}
        >
          Reset All Progress
        </button>
      </div>
    </main>
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
              {userData.xp.toLocaleString()}
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));

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
    const { error: e } = await supabase.auth.signUp({
      email,
      password,
    });
    if (e) setError(e.message);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-gray)]">
        <div
          style={{
            background: "white",
            padding: 32,
            borderRadius: 16,
            border: "2px solid var(--border-light)",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div className="flex items-center justify-center gap-2" style={{ marginBottom: 16 }}>
            <Wallet size={22} className="text-[var(--primary-green)]" />
            <h1 style={{ fontSize: 24, fontWeight: 800, textAlign: "center" }}>
              Fundi Finance
            </h1>
          </div>
          <p
            style={{
              textAlign: "center",
              marginBottom: 24,
              color: "var(--text-light)",
            }}
          >
            Sign in to save your learning progress
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: 14,
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                fontSize: 14,
              }}
            />
            {error && (
              <p style={{ color: "var(--error-red)", fontSize: 13 }}>
                {error}
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={handleSignUp}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function Home() {
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
  } = useFundiState();

  const currentCourse =
    route.name === "course" || route.name === "lesson"
      ? CONTENT_DATA.courses.find((c) => c.id === route.courseId)
      : null;

  const handleNav = (name: Route["name"]) => {
    if (name === "learn") setRoute({ name: "learn" });
    if (name === "calculator") setRoute({ name: "calculator" });
    if (name === "profile") setRoute({ name: "profile" });
    if (name === "leaderboard") setRoute({ name: "leaderboard" });
    if (name === "settings") setRoute({ name: "settings" });
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
        completeLesson(
          currentLessonState.courseId,
          currentLessonState.lessonId,
          totalXP
        );
      }
      playSound("complete");
      setRoute({ name: "course", courseId: currentLessonState.courseId! });
    }
  };

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

  return (
    <AuthGate>
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
        <div className="pb-24 md:pb-0">
        {route.name === "learn" && (
          <LearnView
            courses={CONTENT_DATA.courses}
            isLessonCompleted={isLessonCompleted}
            goToCourse={(courseId) => setRoute({ name: "course", courseId })}
          />
        )}

        {route.name === "course" && currentCourse && (
          <CourseView
            course={currentCourse}
            isLessonCompleted={isLessonCompleted}
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
              if (!found || found.comingSoon || !found.steps) return;
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
          />
        )}

        {route.name === "profile" && (
          <ProfileView userData={userData} onSignOut={handleProfileSignOut} />
        )}

        {route.name === "leaderboard" && (
          <LeaderboardView xp={userData.xp} />
        )}

        {route.name === "settings" && (
          <SettingsView
            userData={userData}
            setDailyGoal={setDailyGoal}
            resetProgress={handleResetProgress}
          />
        )}

        {route.name === "calculator" && <CalculatorView />}

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

