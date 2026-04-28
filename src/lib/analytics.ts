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

  // ── Lesson abandonment: per-step tracking ────────────────────────────────
  lessonStepViewed: (
    courseId: string,
    lessonId: string,
    stepIndex: number,
    stepType: string,
    totalSteps: number
  ) =>
    track("lesson_step_viewed", {
      courseId,
      lessonId,
      stepIndex,
      stepType,
      totalSteps,
      progressPct: Math.round(((stepIndex + 1) / totalSteps) * 100),
    }),

  // ── Calculator: solve-mode usage ─────────────────────────────────────────
  calculatorSolveModeUsed: (
    solveMode: string,
    inputs: { monthly: number; rate: number; years: number; principal: number }
  ) => track("calculator_solve_mode_used", { solveMode, ...inputs }),

  calculatorResultShared: (solveMode: string) =>
    track("calculator_result_shared", { solveMode }),

  // ── Budget: category distribution (anonymized) ────────────────────────────
  budgetEntryAdded: (category: string, entryType: "income" | "expense") =>
    track("budget_entry_added", { category, entryType }),

  // ── Time-to-first-lesson (hours from signup) ──────────────────────────────
  firstLessonCompleted: (hoursSinceSignup: number, courseId: string) =>
    track("first_lesson_completed", { hoursSinceSignup, courseId }),

  // ── Day 1 / 7 / 30 retention ping ─────────────────────────────────────────
  retentionPing: (daysSinceSignup: number, cohort: "day1" | "day7" | "day30") =>
    track("retention_ping", { daysSinceSignup, cohort }),

  // ── Daily challenge claimed ────────────────────────────────────────────────
  dailyChallengeClaimed: (challengeId: string, xp: number) =>
    track("daily_challenge_claimed", { challengeId, xp }),

  // ── Share card generated ──────────────────────────────────────────────────
  shareCardGenerated: (cardType: "lesson" | "calculator") =>
    track("share_card_generated", { cardType }),

  // ── Behavioral outcome events (real financial actions) ────────────────────
  /** User opened the budget planner immediately after completing a budget-related lesson */
  budgetOpenedPostLesson: (courseId: string, lessonId: string) =>
    track("budget_opened_post_lesson", { courseId, lessonId }),

  /** User set or updated a savings category target in the budget planner */
  savingsGoalSet: (savingsAmount: number) =>
    track("savings_goal_set", { savingsAmount }),

  /** User logged an expense entry in the budget planner */
  expenseLogged: (category: string, amount: number) =>
    track("expense_logged", { category, amount }),
};
