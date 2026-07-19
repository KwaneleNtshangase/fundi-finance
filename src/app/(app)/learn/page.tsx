"use client";

import React, { useState, useEffect } from "react";
import { LearnView } from "@/components/views/LearnView";
import { CONTENT_DATA, Lesson } from "@/data/content";
import { useFundi } from "@/context/FundiContext";
import { analytics } from "@/lib/analytics";
import { shuffleLessonSteps, lessonShuffleSeed } from "@/lib/lessonShuffle";

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
        const fresh =
          typeof parsed.savedAt === "number" &&
          Date.now() - parsed.savedAt <= 7 * 24 * 60 * 60 * 1000;
        if (parsed.userId === userId && fresh) {
          setSavedProgress(parsed);
        } else if (parsed.userId === userId && !fresh) {
          // Stale save — clean it up so the resume card doesn't point at
          // a week-old position.
          localStorage.removeItem("fundi-lesson-progress");
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
        // Same seed as startLesson → same option order, so restored answer
        // indexes stay valid.
        steps: shuffleLessonSteps(
          found.steps,
          lessonShuffleSeed(userId, progress.courseId, progress.lessonId)
        ),
        // Restore the user's actual answers so accuracy/XP aren't understated
        // after a resume (previously reset to zero).
        answers: progress.answers ?? {},
        correctCount: progress.correctCount ?? 0,
      });
      setRoute({ name: "lesson", courseId: progress.courseId, lessonId: progress.lessonId });
      setSavedProgress(null);
      localStorage.removeItem("fundi-lesson-progress");
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
      showQuestSections={true}
      weeklyChallenge={weeklyChallenge}
      weeklyProgress={weeklyProgress}
      challengeProgress={challengeProgress}
      challengeComplete={challengeComplete}
      challengeRewardClaimed={challengeRewardClaimed}
      claimChallengeReward={claimChallengeReward}
      streak={userData?.streak ?? 0}
      userLevel={userData?.level ?? 1}
      userXP={userData?.xp ?? 0}
      addXP={addXP}
    />
  );
}
