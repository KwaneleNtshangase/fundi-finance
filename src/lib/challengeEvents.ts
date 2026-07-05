import { supabase } from "@/lib/supabaseClient";
import { evaluateChallengeProgress } from "@/lib/challenges";

export type ChallengeEventType =
  | "lesson_started"
  | "lesson_completed"
  | "question_answered"
  | "quiz_completed"
  | "quiz_score_80plus"
  | "quiz_score_100"
  | "xp_earned"
  | "level_up"
  | "streak_updated"
  | "streak_count"
  | "daily_login"
  | "module_unlocked"
  | "session_duration"
  | "score"
  | "active_lesson_days"
  | "lesson_completed_topic_budgeting"
  | "lesson_completed_topic_investing"
  | "lesson_completed_no_exit"
  | "lesson_fast_complete"
  | "lesson_completed_one_sitting"
  | "streak_correct"
  | "corrected_previous_wrong"
  | "fast_5_questions"
  | "quick_quiz_completed"
  | "consecutive_lesson_days"
  | "recovery_login"
  | "weekly_avg_score_80";

export async function trackChallengeEvent(
  eventType: ChallengeEventType,
  payload: Record<string, unknown> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("challenge_events").insert({
    user_id: user.id,
    event_type: eventType,
    payload,
  });
  await evaluateChallengeProgress(user.id, eventType, payload);
}
