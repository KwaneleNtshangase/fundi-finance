"use client";

import React, { use } from "react";
import { LessonView } from "@/components/views/LessonView";
import { LessonSummaryView } from "@/components/views/LessonSummaryView";
import { useFundi } from "@/context/FundiContext";
import { getLessonTitle, getNextLesson } from "@/app/pageViews.types";
import { analytics } from "@/lib/analytics";

export default function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const {
    currentLessonState,
    setCurrentLessonState,
    setRoute,
    hearts,
    completeLesson,
    isLessonCompleted,
    lessonSummary,
    setLessonSummary,
  } = useFundi();

  const lessonStartTimeRef = React.useRef(Date.now());
  const isFinalizingRef = React.useRef(false);
  const lessonHeartLostRef = React.useRef(false); // To track if a heart was lost during this lesson

  // If we arrived here without state, redirect back to course page
  if (!currentLessonState || !currentLessonState.steps || currentLessonState.steps.length === 0) {
    if (typeof window !== "undefined") {
      setRoute({ name: "course", courseId });
    }
    return <div className="p-4">Loading lesson...</div>;
  }

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
      (s: any) =>
        s.type === "mcq" ||
        s.type === "true-false" ||
        s.type === "scenario" ||
        s.type === "fill-blank"
    ).length;
    const isPerfect =
      totalQuestions > 0 && currentLessonState.correctCount === totalQuestions;

    const lessonTitleDone =
      getLessonTitle(currentLessonState.courseId, currentLessonState.lessonId) ?? "";
    const alreadyCompleted = isLessonCompleted(
      currentLessonState.courseId,
      currentLessonState.lessonId
    );

    const { streak: streakAfterLesson, xpAwarded } = await completeLesson(
      currentLessonState.courseId,
      currentLessonState.lessonId,
      totalXP
    );

    analytics.lessonCompleted(
      currentLessonState.courseId,
      currentLessonState.lessonId,
      lessonTitleDone,
      {
        xpEarned: xpAwarded,
        isPerfect,
        timeSeconds: Math.round((Date.now() - lessonStartTimeRef.current) / 1000),
        heartLost: lessonHeartLostRef.current,
      }
    );

    if (typeof window !== "undefined") {
      localStorage.removeItem("fundi-lesson-progress");
    }

    if (alreadyCompleted) {
      const elapsedSeconds = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
      const accuracy =
        totalQuestions > 0
          ? Math.min(100, Math.round((currentLessonState.correctCount / totalQuestions) * 100))
          : 0;
      setLessonSummary({
        xpEarned: xpAwarded,
        timeSeconds: elapsedSeconds,
        accuracy,
        streak: streakAfterLesson,
        isPerfect,
        choice,
        nextLessonId: getNextLesson(currentLessonState.courseId, currentLessonState.lessonId)?.id ?? null,
        courseId: currentLessonState.courseId,
        lessonId: currentLessonState.lessonId,
      });
      isFinalizingRef.current = false;
      return;
    }

    if (isPerfect) {
      const prev = parseInt(localStorage.getItem("fundi-perfect-lessons") ?? "0", 10);
      const newPerfectTotal = prev + 1;
      localStorage.setItem("fundi-perfect-lessons", String(newPerfectTotal));
    }

    const elapsedSeconds = Math.round((Date.now() - lessonStartTimeRef.current) / 1000);
    const accuracy =
      totalQuestions > 0
        ? Math.min(100, Math.round((currentLessonState.correctCount / totalQuestions) * 100))
        : 0;

    setLessonSummary({
      xpEarned: xpAwarded,
      timeSeconds: elapsedSeconds,
      accuracy,
      streak: streakAfterLesson,
      isPerfect,
      choice,
      nextLessonId: getNextLesson(currentLessonState.courseId, currentLessonState.lessonId)?.id ?? null,
      courseId: currentLessonState.courseId,
      lessonId: currentLessonState.lessonId,
    });
    
    isFinalizingRef.current = false;
  };

  const handleLessonSummaryClose = () => {
    if (!lessonSummary) return;
    const { choice, nextLessonId, courseId } = lessonSummary;
    setLessonSummary(null);
    if (choice === "next" && nextLessonId) {
      setRoute({ name: "lesson", courseId, lessonId: nextLessonId });
    } else {
      setRoute({ name: "course", courseId });
    }
  };

  if (lessonSummary) {
    return (
      <LessonSummaryView
        lessonSummary={lessonSummary}
        onClose={handleLessonSummaryClose}
        onBudgetBridge={() => {
          setLessonSummary(null);
          setRoute({ name: "budget" });
        }}
      />
    );
  }

  const nextTitle = (() => {
    if (!currentLessonState.courseId || !currentLessonState.lessonId) return undefined;
    const next = getNextLesson(currentLessonState.courseId, currentLessonState.lessonId);
    return next?.title ?? undefined;
  })();

  return (
    <LessonView
      lessonState={{
        steps: currentLessonState.steps,
        stepIndex: currentLessonState.stepIndex,
        answers: currentLessonState.answers,
      }}
      completeLessonFlow={() => {}}
      nextStep={() => {
        setCurrentLessonState((prev) => ({
          ...prev,
          stepIndex: prev.stepIndex + 1,
        }));
      }}
      finalizeLesson={finalizeCurrentLesson}
      answerQuestion={(index: number) => {
        const step = currentLessonState.steps[currentLessonState.stepIndex];
        const isCorrect = step.type === "mcq" && index === step.correct;
        setCurrentLessonState((prev) => ({
          ...prev,
          answers: { ...prev.answers, [prev.stepIndex]: index },
          correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
        }));
      }}
      answerTrueFalse={(value: boolean) => {
        const step = currentLessonState.steps[currentLessonState.stepIndex];
        const isCorrect = step.type === "true-false" && value === step.correct;
        setCurrentLessonState((prev) => ({
          ...prev,
          answers: { ...prev.answers, [prev.stepIndex]: value },
          correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
        }));
      }}
      correctCount={currentLessonState.correctCount}
      hearts={hearts}
      maxHearts={5}
      goBack={() => setRoute({ name: "course", courseId })}
      courseId={courseId}
      courseAccent="#007A4D"
      nextLessonTitle={nextTitle}
      lessonTitle={getLessonTitle(courseId, lessonId) || `${courseId} ${lessonId}`}
      lessonStartTimeRef={lessonStartTimeRef}
      totalQuestions={currentLessonState.steps.filter((s: any) => s.type === "question" || s.type === "true-false" || s.type === "action-check").length}
    />
  );
}
