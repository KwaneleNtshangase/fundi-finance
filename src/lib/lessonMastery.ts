import type { LessonStep } from "@/data/content";

/**
 * Duolingo-style mastery loop.
 *
 * A lesson is not complete until every question has been answered correctly at
 * least once. When a question is answered wrong, a fresh copy of it is appended
 * to the end of the working step list (re-queued) so the learner must return to
 * it. Because answers are stored BY INDEX (see lessonShuffle.ts), a re-queued
 * copy lands at a new index and gets its own independent answer slot — the
 * original wrong answer is never overwritten or reused.
 *
 * `__qid` is a stable question identity: the copy carries the same `__qid` as
 * its origin so completion is tracked per underlying question, not per index.
 */

export type WorkingStep = LessonStep & {
  __qid?: number;
  __requeued?: boolean;
  /** Set during bank resolution — identifies which slot/variant produced this step. */
  __slotId?: string;
  __variantId?: string;
};

/** The step types that count as answerable questions (must match finalize). */
export const SCOREABLE_TYPES = new Set([
  "mcq",
  "scenario",
  "true-false",
  "fill-blank",
]);

export function isQuestionStep(step: LessonStep): boolean {
  return SCOREABLE_TYPES.has(step.type);
}

/** Tag each scoreable step with a stable question id (order among questions). */
export function assignQids(steps: LessonStep[]): WorkingStep[] {
  let q = 0;
  return steps.map((s) =>
    isQuestionStep(s) ? { ...s, __qid: q++ } : { ...s }
  );
}

/** Every distinct question id in the lesson (stable across re-queues). */
export function baseQids(steps: WorkingStep[]): number[] {
  const ids = new Set<number>();
  for (const s of steps) if (s.__qid !== undefined) ids.add(s.__qid);
  return [...ids];
}

/** A re-queued copy of a question: new array element, same underlying qid. */
export function requeuedCopy(step: WorkingStep): WorkingStep {
  return { ...step, __requeued: true };
}

/**
 * True once every question in the lesson has been mastered (answered correctly
 * at least once). This is the gate that lets the lesson finalize.
 */
export function allQuestionsMastered(
  steps: WorkingStep[],
  masteredQids: number[]
): boolean {
  const mastered = new Set(masteredQids);
  return baseQids(steps).every((id) => mastered.has(id));
}

/** First-try accuracy, 0–100: questions never missed / total questions. */
export function firstTryAccuracy(
  steps: WorkingStep[],
  mistakenQids: number[]
): number {
  const total = baseQids(steps).length;
  if (total === 0) return 100;
  const missed = new Set(mistakenQids).size;
  return Math.round(((total - missed) / total) * 100);
}
