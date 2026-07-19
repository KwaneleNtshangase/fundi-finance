import { describe, it, expect } from "vitest";
import { CONTENT_DATA } from "@/data/content";
import type { LessonStep } from "@/data/content";

/**
 * Content quality guards — keep answer patterns out of the question bank.
 *
 * Background (July 2026 audit): 85% of correct answers sat at index 1 and 82%
 * of correct answers were the uniquely longest option (chance: 25%), with the
 * worst offenders 3-5x longer than every distractor. Rendering now shuffles
 * option POSITIONS per user (see src/lib/lessonShuffle.ts), so index bias in
 * the authored data no longer reaches users and is not tested here. LENGTH
 * bias cannot be fixed at render time — these tests stop it regressing.
 *
 * The thresholds are RATCHETS set just above the current measured state.
 * When you fix more content, lower them. Never raise them.
 */

type OptionQ = {
  course: string;
  lesson: string;
  options: string[];
  correct: number;
};

function collect() {
  const optionQs: OptionQ[] = [];
  let tfTrue = 0;
  let tfTotal = 0;
  const lessonIds: string[] = [];
  for (const course of CONTENT_DATA.courses) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        lessonIds.push(`${course.id}:${lesson.id}`);
        for (const s of (lesson.steps ?? []) as LessonStep[]) {
          if (
            (s.type === "mcq" || s.type === "scenario") &&
            Array.isArray((s as { options?: string[] }).options) &&
            typeof (s as { correct?: number }).correct === "number"
          ) {
            const q = s as unknown as { options: string[]; correct: number };
            optionQs.push({ course: course.id, lesson: lesson.id, options: q.options, correct: q.correct });
          }
          if (s.type === "true-false") {
            tfTotal++;
            if (s.correct === true) tfTrue++;
          }
        }
      }
    }
  }
  return { optionQs, tfTrue, tfTotal, lessonIds };
}

function lengthStats(q: OptionQ) {
  const lens = q.options.map((o) => (o ?? "").length);
  const max = Math.max(...lens);
  const uniquelyLongest = lens[q.correct] === max && lens.filter((l) => l === max).length === 1;
  const sorted = [...lens].sort((a, b) => b - a);
  const marginPct = sorted[1] ? Math.round((100 * (sorted[0] - sorted[1])) / sorted[1]) : 0;
  return { uniquelyLongest, marginPct };
}

describe("content quality — answer patterns", () => {
  const { optionQs, tfTrue, tfTotal, lessonIds } = collect();

  it("has a valid correct index on every option question", () => {
    for (const q of optionQs) {
      expect(q.correct, `${q.course}/${q.lesson}`).toBeGreaterThanOrEqual(0);
      expect(q.correct, `${q.course}/${q.lesson}`).toBeLessThan(q.options.length);
    }
  });

  it("no question's correct answer dwarfs its distractors (flagrant length bias)", () => {
    // RATCHET: worst measured margin after rewrite pass 2 is 185%.
    // New/edited questions must not push above it. Lower this as passes continue.
    const MAX_MARGIN_PCT = 190;
    const offenders = optionQs
      .map((q) => ({ q, s: lengthStats(q) }))
      .filter(({ s }) => s.uniquelyLongest && s.marginPct >= MAX_MARGIN_PCT);
    expect(
      offenders.map(({ q, s }) => `${q.course}/${q.lesson} (+${s.marginPct}%)`),
      "Correct answer is flagrantly longer than every distractor. Tighten it or strengthen the distractors."
    ).toEqual([]);
  });

  it("keeps the correct-is-longest rate from regressing", () => {
    // RATCHET: 79% after pass 2 (chance would be ~25%). Do not let it climb;
    // lower it as more content is rebalanced.
    const MAX_LONGEST_RATE = 0.8;
    const longest = optionQs.filter((q) => lengthStats(q).uniquelyLongest).length;
    expect(longest / optionQs.length).toBeLessThanOrEqual(MAX_LONGEST_RATE);
  });

  it("keeps the flagrant (>=40% margin) count from regressing", () => {
    // RATCHET: 273 after pass 2 (was 444 pre-audit, 364 after pass 1).
    const MAX_FLAGRANT = 273;
    const flagrant = optionQs.filter((q) => {
      const s = lengthStats(q);
      return s.uniquelyLongest && s.marginPct >= 40;
    }).length;
    expect(flagrant).toBeLessThanOrEqual(MAX_FLAGRANT);
  });

  it("keeps true/false answers roughly balanced", () => {
    // Was 70% "true" before the July 2026 rebalance; now ~58%. Keep it in a
    // band a pattern-spotter cannot exploit.
    const share = tfTrue / tfTotal;
    expect(share).toBeGreaterThanOrEqual(0.4);
    expect(share).toBeLessThanOrEqual(0.62);
  });

  it("lesson ids are unique (completed_lessons keys depend on them)", () => {
    const dupes = lessonIds.filter((id, i) => lessonIds.indexOf(id) !== i);
    expect([...new Set(dupes)]).toEqual([]);
  });
});
