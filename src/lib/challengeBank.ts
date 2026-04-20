export type ChallengeType = "daily" | "weekly";
export type ChallengeDifficulty = "easy" | "medium" | "hard";

export type ChallengeBankItem = {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  xpReward: number;
  event?: string;
  targetValue?: number;
  multiCondition?: boolean;
};

export const DAILY_CHALLENGE_BANK: ChallengeBankItem[] = [
  { id: "complete_1_lesson", title: "First Step", description: "Complete 1 lesson today", type: "daily", difficulty: "easy", xpReward: 10, event: "lesson_completed", targetValue: 1 },
  { id: "complete_2_lessons", title: "Double Down", description: "Complete 2 lessons today", type: "daily", difficulty: "medium", xpReward: 25, event: "lesson_completed", targetValue: 2 },
  { id: "no_exit_lesson", title: "Stay Focused", description: "Finish a lesson without exiting", type: "daily", difficulty: "easy", xpReward: 10, event: "lesson_completed_no_exit", targetValue: 1 },
  { id: "lesson_under_5min", title: "Speed Reader", description: "Complete a lesson in under 5 minutes", type: "daily", difficulty: "medium", xpReward: 25, event: "lesson_fast_complete", targetValue: 1 },
  { id: "budgeting_lesson", title: "Budget Boss", description: "Complete a Budgeting lesson", type: "daily", difficulty: "easy", xpReward: 10, event: "lesson_completed_topic_budgeting", targetValue: 1 },
  { id: "investing_lesson", title: "Investor Mindset", description: "Complete an Investing lesson", type: "daily", difficulty: "easy", xpReward: 10, event: "lesson_completed_topic_investing", targetValue: 1 },
  { id: "3_correct_row", title: "On a Roll", description: "Get 3 answers correct in a row", type: "daily", difficulty: "medium", xpReward: 25, event: "streak_correct", targetValue: 3 },
  { id: "score_80", title: "Sharp Scorer", description: "Score 80% or more on a lesson", type: "daily", difficulty: "medium", xpReward: 25, event: "quiz_score_80plus", targetValue: 1 },
  { id: "perfect_quiz", title: "Flawless", description: "Get 100% on any quiz", type: "daily", difficulty: "hard", xpReward: 50, event: "quiz_score_100", targetValue: 1 },
  { id: "fix_wrong", title: "Growth Mindset", description: "Correctly answer a question you got wrong before", type: "daily", difficulty: "medium", xpReward: 25, event: "corrected_previous_wrong", targetValue: 1 },
  { id: "maintain_streak", title: "Keep It Going", description: "Maintain your daily streak", type: "daily", difficulty: "easy", xpReward: 10, event: "streak_updated", targetValue: 1 },
  { id: "login_twice", title: "Double Tap", description: "Log in 2 times today", type: "daily", difficulty: "easy", xpReward: 10, event: "daily_login", targetValue: 2 },
  { id: "2_day_row", title: "Back Again", description: "Complete a lesson 2 days in a row", type: "daily", difficulty: "medium", xpReward: 25, event: "consecutive_lesson_days", targetValue: 2 },
  { id: "recovery", title: "Comeback Kid", description: "Come back after missing a day", type: "daily", difficulty: "easy", xpReward: 10, event: "recovery_login", targetValue: 1 },
  { id: "one_sitting", title: "In the Zone", description: "Complete a lesson in one sitting", type: "daily", difficulty: "medium", xpReward: 25, event: "lesson_completed_one_sitting", targetValue: 1 },
  { id: "5q_30sec", title: "Lightning Round", description: "Answer 5 questions in under 30 seconds total", type: "daily", difficulty: "hard", xpReward: 50, event: "fast_5_questions", targetValue: 1 },
  { id: "quick_quiz", title: "Quick Fire", description: "Finish a quick quiz session", type: "daily", difficulty: "easy", xpReward: 10, event: "quick_quiz_completed", targetValue: 1 },
  { id: "earn_50xp", title: "XP Grind", description: "Earn 50 XP today", type: "daily", difficulty: "easy", xpReward: 10, event: "xp_earned", targetValue: 50 },
  { id: "earn_100xp", title: "Century Club", description: "Earn 100 XP today", type: "daily", difficulty: "medium", xpReward: 25, event: "xp_earned", targetValue: 100 },
  { id: "level_up_today", title: "Level Up", description: "Level up once today", type: "daily", difficulty: "hard", xpReward: 50, event: "level_up", targetValue: 1 },
  { id: "unlock_module", title: "Unlocked", description: "Unlock a new module today", type: "daily", difficulty: "hard", xpReward: 50, event: "module_unlocked", targetValue: 1 },
];

export const WEEKLY_CHALLENGE_BANK: ChallengeBankItem[] = [
  { id: "w_5_lessons", title: "Lesson Machine", description: "Complete 5 lessons this week", type: "weekly", difficulty: "medium", xpReward: 25, event: "lesson_completed", targetValue: 5 },
  { id: "w_3_different_days", title: "Consistent", description: "Complete lessons on 3 different days", type: "weekly", difficulty: "medium", xpReward: 25, event: "active_lesson_days", targetValue: 3 },
  { id: "w_finish_module", title: "Module Master", description: "Finish an entire module this week", type: "weekly", difficulty: "hard", xpReward: 50, event: "module_unlocked", targetValue: 1 },
  { id: "w_avg_80", title: "High Standards", description: "Maintain 80%+ average score this week", type: "weekly", difficulty: "hard", xpReward: 50, event: "weekly_avg_score_80", targetValue: 1 },
  { id: "w_3_perfect", title: "Triple Threat", description: "Get 3 perfect scores this week", type: "weekly", difficulty: "hard", xpReward: 50, event: "quiz_score_100", targetValue: 3 },
  { id: "w_5_day_streak", title: "Streak Week", description: "Maintain a 5-day streak", type: "weekly", difficulty: "hard", xpReward: 50, event: "streak_count", targetValue: 5 },
  { id: "w_open_5_days", title: "Regular", description: "Open the app 5 days this week", type: "weekly", difficulty: "medium", xpReward: 25, event: "daily_login", targetValue: 5 },
  { id: "w_1_lesson_3_days", title: "Steady Wins", description: "Complete at least 1 lesson per day for 3 days", type: "weekly", difficulty: "medium", xpReward: 25, event: "active_lesson_days", targetValue: 3 },
  { id: "w_500xp", title: "XP Farmer", description: "Gain 500 XP this week", type: "weekly", difficulty: "hard", xpReward: 50, event: "xp_earned", targetValue: 500 },
  { id: "w_level_twice", title: "Double Up", description: "Level up twice this week", type: "weekly", difficulty: "hard", xpReward: 50, event: "level_up", targetValue: 2 },
  { id: "w_2_modules", title: "Explorer", description: "Unlock 2 new modules this week", type: "weekly", difficulty: "hard", xpReward: 50, event: "module_unlocked", targetValue: 2 },
  { id: "w_mixed_1", title: "Triple Combo", description: "Complete 3 lessons + earn 100 XP", type: "weekly", difficulty: "hard", xpReward: 50, multiCondition: true },
  { id: "w_mixed_2", title: "Streak + Perfect", description: "Maintain streak + get 1 perfect score", type: "weekly", difficulty: "hard", xpReward: 50, multiCondition: true },
  { id: "w_mixed_3", title: "Full Package", description: "Finish 1 module + log in 4 days", type: "weekly", difficulty: "hard", xpReward: 50, multiCondition: true },
];
