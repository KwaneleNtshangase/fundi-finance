"use client";

import React, { use } from "react";
import { LessonView } from "@/components/views/LessonView";
import { LessonSummaryView } from "@/components/views/LessonSummaryView";
import { useFundi } from "@/context/FundiContext";
import { getLessonTitle, getNextLesson } from "@/app/pageViews.types";
import { analytics } from "@/lib/analytics";
import { CONTENT_DATA } from "@/data/content";
import { shuffleLessonSteps, lessonShuffleSeed } from "@/lib/lessonShuffle";

/** Saved mid-lesson progress is honoured for this long after the last step. */
const SAVED_PROGRESS_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SavedMidLesson = {
  userId?: string;
  courseId?: string;
  lessonId?: string;
  stepIndex?: number;
  answers?: Record<number, unknown>;
  correctCount?: number;
  savedAt?: number;
};

function readSavedMidLesson(
  userId: string | null,
  courseId: string,
  lessonId: string
): SavedMidLesson | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem("fundi-lesson-progress");
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedMidLesson;
    if (p.userId !== userId || p.courseId !== courseId || p.lessonId !== lessonId) return null;
    if (!p.savedAt || Date.now() - p.savedAt > SAVED_PROGRESS_MAX_AGE_MS) return null;
    return p;
  } catch {
    return null;
  }
}

export default function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const {
    userId,
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

  // State is only usable when it belongs to THIS URL. A stale state from the
  // previous lesson (e.g. after "Continue to next lesson") must be re-inited,
  // or the old lesson's steps render under the new URL.
  const hasLessonState = Boolean(
    currentLessonState &&
      currentLessonState.steps &&
      currentLessonState.steps.length > 0 &&
      currentLessonState.courseId === courseId &&
      currentLessonState.lessonId === lessonId
  );

  // Arrived without matching in-memory state (page refresh, PWA relaunch,
  // deep link, or next-lesson navigation). Restore the saved mid-lesson
  // position if one exists for this exact lesson, otherwise start it fresh
  // from content; only bail to the course page when the lesson is unknown.
  // Runs in an effect — the previous version called setRoute during render,
  // which is unsafe and dumped users back to the course on every refresh.
  React.useEffect(() => {
    if (hasLessonState) return;
    const course = CONTENT_DATA.courses.find((c) => c.id === courseId);
    const lesson = course?.units
      .flatMap((u) => u.lessons)
      .find((l) => l.id === lessonId);
    if (lesson?.steps?.length) {
      const saved = readSavedMidLesson(userId, courseId, lessonId);
      const stepIdx = saved
        ? Math.min(Math.max(0, saved.stepIndex ?? 0), lesson.steps.length - 1)
        : 0;
      setCurrentLessonState({
        courseId,
        lessonId,
        stepIndex: stepIdx,
        // Same seed as startLesson → identical option order, so restored
        // answer indexes still point at the options the user actually chose.
        steps: shuffleLessonSteps(lesson.steps, lessonShuffleSeed(userId, courseId, lessonId)),
        answers: saved?.answers ?? {},
        correctCount: saved?.correctCount ?? 0,
      });
      return;
    }
    setRoute({ name: "course", courseId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLessonState, userId, courseId, lessonId]);

  if (!hasLessonState || !currentLessonState) {
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
      totalXP,
      isPerfect
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

    // Perfect-lesson count is now server-backed (perfect_lessons_total via
    // completeLesson → recordLessonStats) — no device-local counter to drift.

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
        // Scenario steps render through the same option UI but were never
        // counted (type check was mcq-only) — perfect scores were impossible
        // on lessons containing scenarios.
        const isCorrect =
          (step.type === "mcq" || step.type === "scenario") && index === step.correct;
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
      answerFillBlank={(value: string, isCorrect: boolean) => {
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
      // Was counting non-existent types ("question", "action-check") — must
      // match the scoreable set used in finalize, or accuracy is misstated.
      totalQuestions={currentLessonState.steps.filter((s: any) => s.type === "mcq" || s.type === "true-false" || s.type === "scenario" || s.type === "fill-blank").length}
    />
  );
}
