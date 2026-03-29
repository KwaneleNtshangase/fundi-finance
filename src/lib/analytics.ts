import posthog from "posthog-js";

const track = (event: string, props?: Record<string, unknown>) => {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    /* ignore */
  }
};

export const analytics = {
  lessonStarted: (courseId: string, lessonId: string, lessonTitle: string) =>
    track("lesson_started", { courseId, lessonId, lessonTitle }),

  lessonCompleted: (
    courseId: string,
    lessonId: string,
    lessonTitle: string,
    props: {
      xpEarned: number;
      isPerfect: boolean;
      timeSeconds: number;
      heartLost: boolean;
    }
  ) => track("lesson_completed", { courseId, lessonId, lessonTitle, ...props }),

  lessonAbandoned: (
    courseId: string,
    lessonId: string,
    stepIndex: number,
    totalSteps: number
  ) =>
    track("lesson_abandoned", {
      courseId,
      lessonId,
      stepIndex,
      totalSteps,
      completionPercent: Math.round((stepIndex / totalSteps) * 100),
    }),

  wrongAnswer: (
    courseId: string,
    lessonId: string,
    stepIndex: number,
    stepType: string
  ) => track("wrong_answer", { courseId, lessonId, stepIndex, stepType }),

  courseOpened: (courseId: string, courseTitle: string) =>
    track("course_opened", { courseId, courseTitle }),

  courseCompleted: (courseId: string, courseTitle: string, badgeName: string) =>
    track("course_completed", { courseId, courseTitle, badgeName }),

  badgeEarned: (badgeId: string, badgeName: string) =>
    track("badge_earned", { badgeId, badgeName }),

  streakUpdated: (streakDays: number) =>
    track("streak_updated", { streakDays }),

  challengeCompleted: (challengeDescription: string, bonusXP: number) =>
    track("weekly_challenge_completed", { challengeDescription, bonusXP }),

  investorQuizCompleted: (profile: string, score: number) =>
    track("investor_quiz_completed", { profile, score }),

  advisorCtaShown: (trigger: string) =>
    track("advisor_cta_shown", { trigger }),

  advisorCtaClicked: (trigger: string) =>
    track("advisor_cta_clicked", { trigger }),

  shareTriggered: (
    type: "lesson" | "badge" | "streak",
    method: "native" | "whatsapp"
  ) => track("share_triggered", { type, method }),

  pageViewed: (page: string) => track("page_viewed", { page }),
};
