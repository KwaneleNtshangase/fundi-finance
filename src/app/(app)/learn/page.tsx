"use client";

import React, { useState, useEffect } from "react";
import { LearnView } from "@/components/views/LearnView";
import { CONTENT_DATA, Lesson } from "@/data/content";
import { useFundi } from "@/context/FundiContext";
import { analytics } from "@/lib/analytics";

export default function LearnPage() {
  const {
    userId,
    isLessonCompleted,
    setRoute,
    progressReady,
    weeklyChallenge,
    weeklyProgress,
    challengeProgress,
    challengeComplete,
    challengeRewardClaimed,
    claimChallengeReward,
    userData,
    addXP,
    hearts,
    setShowNoHearts,
    setCurrentLessonState
  } = useFundi();

  const [savedProgress, setSavedProgress] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    const item = localStorage.getItem("fundi-lesson-progress");
    if (item) {
      try {
        const parsed = JSON.parse(item);
        if (parsed.userId === userId) {
          setSavedProgress(parsed);
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
      if (!found?.steps?.length) return;
      if (hearts <= 0) {
        setShowNoHearts(true);
        return;
      }
      const stepIdx = Math.min(
        Math.max(0, progress.stepIndex),
        found.steps.length - 1
      );
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
      showQuestSections={true}
      weeklyChallenge={weeklyChallenge}
      weeklyProgress={weeklyProgress}
      challengeProgress={challengeProgress}
      challengeComplete={challengeComplete}
      challengeRewardClaimed={challengeRewardClaimed}
      claimChallengeReward={claimChallengeReward}
      streak={userData?.streak ?? 0}
      addXP={addXP}
    />
  );
}
