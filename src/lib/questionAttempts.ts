import { supabase } from "@/lib/supabaseClient";

export type QuestionAttemptPayload = {
  userId: string;
  courseId: string;
  lessonId: string;
  slotId: string;
  variantId: string;
  conceptId?: string | null;
  attemptNo: number;
  isCorrect: boolean;
};

/**
 * Fire-and-forget insert into question_attempts. Never throws into callers
 * and never blocks the lesson UI.
 */
export function logQuestionAttempt(payload: QuestionAttemptPayload): void {
  void (async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== payload.userId) return;

      await supabase.from("question_attempts").insert({
        user_id: payload.userId,
        course_id: payload.courseId,
        lesson_id: payload.lessonId,
        slot_id: payload.slotId,
        variant_id: payload.variantId,
        concept_id: payload.conceptId ?? null,
        attempt_no: payload.attemptNo,
        is_correct: payload.isCorrect,
      });
    } catch {
      /* best-effort analytics */
    }
  })();
}
