import { supabase } from "@/lib/supabaseClient";
import { evaluateChallengeProgress } from "@/lib/challenges";

export type ChallengeEventType =
  | "lesson_started"
  | "lesson_completed"
  | "question_answered"
  | "quiz_completed"
  | "xp_earned"
  | "level_up"
  | "streak_updated"
  | "daily_login"
  | "module_unlocked"
  | "session_duration"
  | "score";

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
