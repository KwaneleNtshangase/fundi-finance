"use client";

import React, { useState, useEffect } from "react";
import { LearnView } from "@/components/views/LearnView";
import { CONTENT_DATA, Lesson } from "@/data/content";
import { useNotho } from "@/context/NothoContext";
import { analytics } from "@/lib/analytics";
import { shuffleLessonSteps, lessonShuffleSeed } from "@/lib/lessonShuffle";
import { assignQids, type WorkingStep } from "@/lib/lessonMastery";

export default function LearnPage() {
  const {
    userId,
    isLessonCompleted,
    setRoute,
    progressReady,
    userData,
    hearts,
    setShowNoHearts,
    setCurrentLessonState
  } = useNotho();

  const [savedProgress, setSavedProgress] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    const item = localStorage.getItem("notho-lesson-progress");
    if (item) {
      try {
        const parsed = JSON.parse(item);
        const fresh =
          typeof parsed.savedAt === "number" &&
          Date.now() - parsed.savedAt <= 7 * 24 * 60 * 60 * 1000;
        if (parsed.userId === userId && fresh) {
          setSavedProgress(parsed);
        } else if (parsed.userId === userId && !fresh) {
          // Stale save — clean it up so the resume card doesn't point at
          // a week-old position.
          localStorage.removeItem("notho-lesson-progress");
        }
      } catch (e) {
        // ignore
      }
    }
  }, [userId]);

  const resumeLesson = React.useCallback(
    (progress: any) => {
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
      const savedHasSteps = Array.isArray(progress.steps) && progress.steps.length > 0;
      if (!found || (!found.steps?.length && !savedHasSteps)) return;
      if (hearts <= 0) {
        setShowNoHearts(true);
        return;
      }
      // Prefer the persisted working steps (they carry any re-queued copies
      // from the mastery loop). Otherwise rebuild from content, tagging question
      // ids so the mastery loop tracks completion.
      const savedSteps: WorkingStep[] = savedHasSteps
        ? (progress.steps as WorkingStep[])
        : (shuffleLessonSteps(
            assignQids(found!.steps ?? []),
            lessonShuffleSeed(userId, progress.courseId, progress.lessonId)
          ) as WorkingStep[]);
      const stepIdx = Math.min(
        Math.max(0, progress.stepIndex ?? 0),
        savedSteps.length - 1
      );
      setCurrentLessonState({
        courseId: progress.courseId,
        lessonId: progress.lessonId,
        stepIndex: stepIdx,
        steps: savedSteps,
        // Restore the user's actual answers so accuracy/XP aren't understated
        // after a resume (previously reset to zero).
        answers: progress.answers ?? {},
        correctCount: progress.correctCount ?? 0,
        mistakes: progress.mistakes ?? 0,
        masteredQids: progress.masteredQids ?? [],
        mistakenQids: progress.mistakenQids ?? [],
      });
      setRoute({ name: "lesson", courseId: progress.courseId, lessonId: progress.lessonId });
      setSavedProgress(null);
      localStorage.removeItem("notho-lesson-progress");
    },
    [hearts, userId, setCurrentLessonState, setRoute, setShowNoHearts]
  );

  return (
    <LearnView
      courses={CONTENT_DATA.courses}
      isLessonCompleted={isLessonCompleted}
      goToCourse={(courseId) => {
        const c = CONTENT_DATA.courses.find((x) => x.id === courseId);
        if (c) analytics.courseOpened(courseId, c.title);
        setRoute({ name: "course", courseId });
      }}
      contentLoaded={progressReady}
      savedProgress={savedProgress}
      onResumeLesson={resumeLesson}
      userLevel={userData?.level ?? 1}
      userXP={userData?.xp ?? 0}
    />
  );
}
