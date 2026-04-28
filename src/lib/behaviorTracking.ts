/**
 * behaviorTracking.ts
 *
 * Tracks real financial behavior actions (not just lesson completions)
 * and persists running counts to Supabase user_progress.behavior_events.
 *
 * Events:
 *  - budget_opened_post_lesson  : user opened budget planner after a budget-related lesson
 *  - savings_goal_set           : user set/updated a savings category target in budget planner
 *  - expense_logged             : user logged an expense entry in budget planner
 */

import { supabase } from "@/lib/supabaseClient";

// ── Course / lesson IDs considered "budget-related" ───────────────────────────
// All content-extra budget lessons merge into money-basics, so courseId check is enough.
export const BUDGET_RELATED_COURSE_IDS = new Set([
  "money-basics",
]);

export type BehaviorEventKey =
  | "budget_opened_post_lesson"
  | "savings_goal_set"
  | "expense_logged";

/**
 * Increments a behavior event counter in user_progress.behavior_events.
 * Uses a read-modify-write since Supabase JS client doesn't expose jsonb increment directly.
 * Fire-and-forget — wrapped in void so callers don't need to await.
 */
export async function trackBehaviorEvent(
  eventKey: BehaviorEventKey,
  props?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Read current counts
    const { data } = await supabase
      .from("user_progress")
      .select("behavior_events")
      .eq("user_id", user.id)
      .single();

    const current = (data?.behavior_events as Record<string, number> | null) ?? {};
    const updated: Record<string, number> = {
      ...current,
      [eventKey]: (current[eventKey] ?? 0) + 1,
    };

    await supabase
      .from("user_progress")
      .upsert(
        { user_id: user.id, behavior_events: updated, ...(props ?? {}) },
        { onConflict: "user_id" }
      );
  } catch {
    // Non-critical — never throw, never block UI
  }
}
