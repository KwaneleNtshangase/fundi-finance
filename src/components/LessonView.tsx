/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import React from "react";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LessonStep } from "@/data/content";
import {
  type CalcInputs,
  calcGrowth,
  formatRand,
  formatWithSpaces,
  FundiCharacter,
  ShareButton,
  ShareResultButton,
  generateShareText,
} from "@/lib/viewHelpers";

// ─── FillBlankStep ────────────────────────────────────────────────────────────

function FillBlankStep({
  step, isAnswered, isCorrect, submittedAnswer, onSubmit, onNext, isLast, correctCount, finalizeLesson, nextLessonTitle, lessonTitle,
}: {
  step: any; isAnswered: boolean; isCorrect: boolean; submittedAnswer: string | undefined;
  onSubmit: (v: string) => void; onNext: () => void; isLast: boolean; correctCount: number;
  finalizeLesson?: (choice: "next" | "course") => void;
  nextLessonTitle?: string;
  lessonTitle?: string;
}) {
  const [val, setVal] = React.useState("");

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
                      <button type="button" className="btn btn-primary"
                        style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                        onClick={() => finalizeLesson("next")}>
                        Next Lesson: {nextLessonTitle} →
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                        <Sparkles size={22} className="text-[#FFB612]" aria-hidden />
                        Course Complete!
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

// ─── LessonView ───────────────────────────────────────────────────────────────

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
  const progress = ((lessonState.stepIndex + 1) / lessonState.steps.length) * 100;
  const answered = lessonState.answers[lessonState.stepIndex] !== undefined;
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);
  const isOnLastStep = lessonState.stepIndex === lessonState.steps.length - 1;
  const isCompleted = lessonState.stepIndex >= lessonState.steps.length;

  function ExitConfirmModal() {
    if (!showExitConfirm) return null;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "var(--color-surface)", borderRadius: 20, padding: "24px 22px",
          width: "100%", maxWidth: 340, textAlign: "center", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Leave?</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 18, lineHeight: 1.5 }}>
            If you leave now, you may lose your progress for this lesson.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>
              Keep Going
            </button>
            <button className="btn btn-primary" style={{ flex: 1, background: "#E03C31", border: "none" }}
              onClick={() => { setShowExitConfirm(false); goBack?.(); }}>
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    if (!step) return null;

    if (step.type === "info") {
      return (
        <>
          <h2 className="step-title">{step.title}</h2>
          <div className="step-content" dangerouslySetInnerHTML={{ __html: step.content }} />
          <div className="lesson-actions">
            {isOnLastStep ? (
              finalizeLesson ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                  {nextLessonTitle ? (
                    <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => finalizeLesson("next")}>
                      Next Lesson: {nextLessonTitle} →
                    </button>
                  ) : null}
                  <button className="btn btn-secondary" style={{ width: "100%", background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}
                    onClick={() => finalizeLesson("course")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={18} /> Done - Back to Course
                    </span>
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
                    <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => finalizeLesson("next")}>
                      Next Lesson: {nextLessonTitle} →
                    </button>
                  ) : null}
                  <button type="button" className="btn btn-secondary"
                    style={{ width: "100%", background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}
                    onClick={() => finalizeLesson("course")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle2 size={18} /> Done - Back to Course
                    </span>
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

    if ((step as any).type === "action-check") {
      const s = step as any;
      const didAction = lessonState.answers[lessonState.stepIndex] as string | undefined;
      return (
        <div className="flex flex-col gap-4">
          <div style={{ background: "linear-gradient(135deg, #007A4D 0%, #00A86B 100%)", borderRadius: 16, padding: "20px 20px 16px", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Target size={24} className="shrink-0" />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.9 }}>Take Action</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 0 }}>{s.title}</h3>
          </div>
          <div style={{ background: "var(--color-surface)", border: "2px solid var(--color-primary)", borderRadius: 14, padding: "18px 16px" }}>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--color-text-primary)", fontWeight: 500 }}>{s.challenge}</p>
          </div>
          {!didAction ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-primary"
                style={{ flex: 2, padding: "14px 16px", fontSize: 15, fontWeight: 800 }}
                onClick={() => { (window as any).__actionCheckAnswer?.("done"); }}>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={18} aria-hidden />Done - I did it!</span>
              </button>
              <button type="button" className="btn btn-secondary"
                style={{ flex: 1, padding: "14px 12px", fontSize: 13, fontWeight: 600 }}
                onClick={() => { (window as any).__actionCheckAnswer?.("skipped"); }}>
                Skip for now
              </button>
            </div>
          ) : (
            <div style={{ borderRadius: 14, padding: "16px",
              background: didAction === "done" ? "rgba(0,122,77,0.08)" : "rgba(255,182,18,0.08)",
              border: `1.5px solid ${didAction === "done" ? "var(--color-primary)" : "#FFB612"}` }}>
              <p style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 600, color: didAction === "done" ? "var(--color-primary)" : "#8B6914" }}>
                {didAction === "done" ? s.successMessage : s.skipMessage}
              </p>
            </div>
          )}
          {didAction && (
            <div className="lesson-actions">
              {lessonState.stepIndex === lessonState.steps.length - 1 ? (
                <div style={{ textAlign: "center", width: "100%" }}>
                  <Trophy size={48} style={{ color: "#FFB612", margin: "0 auto" }} />
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
                          onClick={() => finalizeLesson("next")}>Next Lesson: {nextLessonTitle} →</button>
                      ) : (
                        <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                          <Sparkles size={22} className="text-[#FFB612]" aria-hidden /> Course Complete!
                        </div>
                      )}
                      <button type="button" className="btn btn-secondary"
                        style={{ width: "100%", padding: "12px 16px", fontSize: 15, fontWeight: 700,
                          background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}
                        onClick={() => finalizeLesson("course")}>
                        <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={18} aria-hidden /> Done - Back to Course</span>
                      </button>
                      {lessonTitle && (
                        <ShareButton
                          text={generateShareText("lesson", { lessonTitle })}
                          label="Share your result"
                          shareType="lesson"
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
          <div style={{ background: "linear-gradient(135deg, #3B7DD8 0%, #2563EB 100%)", borderRadius: 16, padding: "20px", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <BarChart2 size={22} className="shrink-0" />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.9 }}>Interactive Calculator</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, marginBottom: 6 }}>{s.title}</h3>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>{s.description}</p>
          </div>

          {!embedCalcDone ? (
            <button type="button" className="btn btn-primary"
              style={{ width: "100%", padding: "14px", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onClick={() => setEmbedCalcDone(true)}>
              <BarChart2 size={20} aria-hidden /> Calculate
            </button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Final Value", val: embedFinal.value, color: "white", bg: "var(--color-primary)" },
                  { label: "You Put In", val: embedFinal.contributions, color: "var(--color-text-primary)", bg: "var(--color-surface)" },
                  { label: "Interest Earned", val: embedFinal.interest, color: "#007A4D", bg: "var(--color-surface)" },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} style={{ flex: 1, minWidth: 120, background: bg, borderRadius: 12, padding: "14px 16px", textAlign: "center", border: bg === "var(--color-surface)" ? "1px solid var(--color-border)" : "none" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: bg === "var(--color-primary)" ? "rgba(255,255,255,0.8)" : "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color }}>{formatRand(val)}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 14, padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={embedChart} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
                    <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} width={45} />
                    <Tooltip formatter={(v) => formatRand(typeof v === "number" ? v : Number(v ?? 0))} labelFormatter={(l) => `Year ${l}`}
                      contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="Portfolio Value" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Total Contributions" stroke="#FFB612" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "rgba(0,122,77,0.06)", border: "1.5px solid rgba(0,122,77,0.2)", borderRadius: 12, padding: "14px 16px", borderLeft: "4px solid var(--color-primary)" }}>
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
      const selectedAnswer = lessonState.answers[lessonState.stepIndex] as number | undefined;
      const isCorrect = selectedAnswer === step.correct;
      return (
        <>
          <h2 className="step-title">{step.question}</h2>
          {step.content ? <div className="step-content" dangerouslySetInnerHTML={{ __html: step.content }} /> : null}
          <div className="question-options">
            {step.options.map((option: string, index: number) => {
              let optionClass = "option-button";
              if (answered) {
                if (index === selectedAnswer) optionClass += isCorrect ? " correct" : " incorrect";
                if (index === step.correct && selectedAnswer !== step.correct) optionClass += " correct";
              }
              return (
                <button key={option} className={optionClass} onClick={() => answerQuestion(index)} disabled={answered}>
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div className={`feedback ${isCorrect ? "correct" : "incorrect"}`}>
                {isCorrect ? step.feedback.correct : step.feedback.incorrect}
              </div>
              <div className="lesson-actions">
                {lessonState.stepIndex === lessonState.steps.length - 1 ? (
                  <div style={{ textAlign: "center", animation: "fade-in 0.4s ease-out", width: "100%" }}>
                    <Trophy size={48} style={{ color: "#FFB612", margin: "0 auto" }} />
                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lesson Complete!</div>
                    <div style={{ color: "var(--color-text-secondary)", marginBottom: 4 }}>+{50 + correctCount * 10} XP earned</div>
                    {finalizeLesson ? (
                      <div className="flex flex-col gap-3 mt-2" style={{ width: "100%" }}>
                        {nextLessonTitle ? (
                          <button type="button" className="btn btn-primary"
                            style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                            onClick={() => finalizeLesson("next")}>Next Lesson: {nextLessonTitle} →</button>
                        ) : (
                          <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                            <Sparkles size={22} className="text-[#FFB612]" aria-hidden /> Course Complete!
                          </div>
                        )}
                        <button type="button" className="btn btn-secondary"
                          style={{ width: "100%", padding: "12px 16px", fontSize: 15, fontWeight: 700,
                            background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}
                          onClick={() => finalizeLesson("course")}>
                          <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={18} aria-hidden /> Done - Back to Course</span>
                        </button>
                        {lessonTitle ? (
                          <ShareButton text={generateShareText("lesson", { lessonTitle })} label="Share your progress" shareType="lesson" />
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
                  <button className="btn btn-primary" onClick={nextStep}>Continue</button>
                )}
              </div>
            </>
          )}
        </>
      );
    }

    if (step.type === "true-false") {
      const selectedAnswer = lessonState.answers[lessonState.stepIndex] as boolean | undefined;
      const isCorrect = selectedAnswer === step.correct;
      return (
        <>
          <h2 className="step-title">True or False?</h2>
          <div className="step-content"><p>{step.statement}</p></div>
          <div className="question-options">
            {[true, false].map((value) => {
              let optionClass = "option-button";
              if (answered) {
                if (value === selectedAnswer) optionClass += isCorrect ? " correct" : " incorrect";
                if (value === step.correct && selectedAnswer !== step.correct) optionClass += " correct";
              }
              return (
                <button key={String(value)} className={optionClass} onClick={() => answerTrueFalse(value)} disabled={answered}>
                  {value ? "True" : "False"}
                </button>
              );
            })}
          </div>
          {answered && (
            <>
              <div className={`feedback ${isCorrect ? "correct" : "incorrect"}`}>
                {isCorrect ? step.feedback.correct : step.feedback.incorrect}
              </div>
              <div className="lesson-actions">
                {lessonState.stepIndex === lessonState.steps.length - 1 ? (
                  <div style={{ textAlign: "center", animation: "fade-in 0.4s ease-out", width: "100%" }}>
                    <FundiCharacter expression="celebrating" size={100} style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Lesson Complete!</div>
                    <div style={{ color: "var(--color-text-secondary)", marginBottom: 16 }}>+{50 + correctCount * 10} XP earned</div>
                    {finalizeLesson ? (
                      <div className="flex flex-col gap-3 mt-2" style={{ width: "100%" }}>
                        {nextLessonTitle ? (
                          <button type="button" className="btn btn-primary"
                            style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 800 }}
                            onClick={() => finalizeLesson("next")}>Next Lesson: {nextLessonTitle} →</button>
                        ) : (
                          <div className="flex items-center justify-center gap-2" style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                            <Sparkles size={22} className="text-[#FFB612]" aria-hidden /> Course Complete!
                          </div>
                        )}
                        <button type="button" className="btn btn-secondary"
                          style={{ width: "100%", padding: "12px 16px", fontSize: 15, fontWeight: 700,
                            background: "var(--color-bg)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}
                          onClick={() => finalizeLesson("course")}>
                          <span className="inline-flex items-center justify-center gap-2"><CheckCircle2 size={18} aria-hidden /> Done - Back to Course</span>
                        </button>
                        {lessonTitle ? (
                          <ShareButton text={generateShareText("lesson", { lessonTitle })} label="Share your progress" shareType="lesson" />
                        ) : null}
                      </div>
                    ) : (
                      <button className="btn btn-primary" onClick={nextStep}>Continue</button>
                    )}
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={nextStep}>Continue</button>
                )}
              </div>
            </>
          )}
        </>
      );
    }

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
            (window as any).__fillBlankSubmit?.(val, Math.abs(Number(val) - s.correct) <= (s.correct * 0.1));
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            {goBack && (
              <button onClick={() => setShowExitConfirm(true)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
                  color: "var(--color-text-secondary)", flexShrink: 0, display: "flex", alignItems: "center" }}
                aria-label="Back to course">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="lesson-progress-bar" style={{ flex: 1, margin: 0 }}>
              <div className="lesson-progress-fill"
                style={{ width: `${progress}%`, background: courseAccent ? `linear-gradient(90deg, ${courseAccent}99 0%, ${courseAccent} 100%)` : undefined }} />
            </div>
            <button onClick={() => setShowExitConfirm(true)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
                color: "var(--color-text-secondary)", flexShrink: 0, display: "flex", alignItems: "center" }}
              aria-label="Exit lesson" title="Exit lesson">
              <X size={22} />
            </button>
          </div>
          <div className="lesson-step">{renderStep()}</div>
          <div style={{ textAlign: "center", padding: "8px 16px 12px", color: "var(--color-text-secondary)",
            fontSize: 11, opacity: 0.75, borderTop: "1px solid var(--color-border)", marginTop: 4 }}>
            For educational purposes only - not financial advice. Consult a licensed financial advisor before making financial decisions.
          </div>
        </div>
      </main>
    </>
  );
}

export default LessonView;
