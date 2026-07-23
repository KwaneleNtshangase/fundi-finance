import type { LessonStep } from "@/data/content";

/**
 * Deterministic, seeded shuffle of answer options for option-based steps
 * (mcq / scenario).
 *
 * Why seeded instead of Math.random(): the lesson can be resumed after a
 * refresh or app kill, and saved answers are stored BY INDEX. A random
 * shuffle would reorder options between sessions and corrupt restored
 * answers. Seeding by user + lesson + step keeps the order stable for one
 * user on one lesson (so resume works and review screens stay consistent)
 * while breaking any authored position pattern across users and lessons.
 *
 * The authored data had 85% of correct answers at index 1 — a user who
 * always tapped option B passed nearly everything. After this shuffle the
 * rendered position of the correct answer is uniform regardless of how
 * content is authored, including future lessons.
 */

/** FNV-1a 32-bit hash — stable across sessions/devices. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — tiny, deterministic, good enough for shuffling 4 items. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPermutation(n: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const perm = Array.from({ length: n }, (_, i) => i);
  // Fisher–Yates
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return perm;
}

type OptionStep = Extract<LessonStep, { options: string[]; correct: number }>;

function isOptionStep(step: LessonStep): step is OptionStep {
  return (
    (step.type === "mcq" || step.type === "scenario") &&
    Array.isArray((step as OptionStep).options) &&
    typeof (step as OptionStep).correct === "number"
  );
}

/**
 * Return a NEW steps array with each option-based step's options shuffled
 * and its `correct` index remapped. Content data is never mutated.
 *
 * @param seedKey stable per user+lesson, e.g. `${userId}:${courseId}:${lessonId}`
 */
export function shuffleLessonSteps(steps: LessonStep[], seedKey: string): LessonStep[] {
  return steps.map((step, stepIndex) => {
    if (!isOptionStep(step)) return step;
    const n = step.options.length;
    if (n < 2 || step.correct < 0 || step.correct >= n) return step;
    // Per-step seed so every question in the lesson gets its own order.
    const perm = seededPermutation(n, hashSeed(`${seedKey}#${stepIndex}`));
    // perm[newIndex] = oldIndex
    const options = perm.map((oldIdx) => step.options[oldIdx]);
    const correct = perm.indexOf(step.correct);
    return { ...step, options, correct };
  });
}

/** Stable seed for a user's view of a lesson (resume-safe). */
export function lessonShuffleSeed(
  userId: string | null,
  courseId: string,
  lessonId: string
): string {
  return `${userId ?? "anon"}:${courseId}:${lessonId}`;
}
