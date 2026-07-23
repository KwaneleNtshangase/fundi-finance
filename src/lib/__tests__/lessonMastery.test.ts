import { describe, it, expect } from "vitest";
import type { LessonStep } from "@/data/content";
import {
  assignQids,
  requeuedCopy,
  allQuestionsMastered,
  firstTryAccuracy,
  baseQids,
  type WorkingStep,
} from "@/lib/lessonMastery";

const info: LessonStep = { type: "info", title: "Intro", content: "text" };

const mcq = (n: number): LessonStep =>
  ({
    type: "mcq",
    question: `q${n}`,
    options: ["a", "b", "c", "d"],
    correct: 0,
    feedback: { correct: "y", incorrect: "n" },
  }) as LessonStep;

/** Mirrors the lesson page's recordAnswer mastery-loop logic for unit tests. */
function applyAnswer(
  steps: WorkingStep[],
  stepIndex: number,
  isCorrect: boolean,
  masteredQids: number[],
  mistakenQids: number[]
): { steps: WorkingStep[]; masteredQids: number[]; mistakenQids: number[] } {
  const step = steps[stepIndex];
  const qid = step?.__qid;
  if (isCorrect) {
    const nextMastered =
      qid !== undefined && !masteredQids.includes(qid)
        ? [...masteredQids, qid]
        : masteredQids;
    return { steps, masteredQids: nextMastered, mistakenQids };
  }
  const nextMistaken =
    qid !== undefined && !mistakenQids.includes(qid)
      ? [...mistakenQids, qid]
      : mistakenQids;
  return {
    steps: [...steps, requeuedCopy(step)],
    masteredQids,
    mistakenQids: nextMistaken,
  };
}

describe("lessonMastery", () => {
  it("assignQids tags only question steps", () => {
    const steps: LessonStep[] = [
      info,
      mcq(1),
      { type: "true-false", statement: "s", correct: true, feedback: { correct: "y", incorrect: "n" } },
      { type: "action", title: "t", instruction: "i" },
      mcq(2),
    ];
    const tagged = assignQids(steps);
    expect(tagged[0].__qid).toBeUndefined();
    expect(tagged[1].__qid).toBe(0);
    expect(tagged[2].__qid).toBe(1);
    expect(tagged[3].__qid).toBeUndefined();
    expect(tagged[4].__qid).toBe(2);
  });

  it("requeuedCopy keeps __qid, __slotId, and __variantId", () => {
    const step: WorkingStep = {
      ...mcq(1),
      __qid: 0,
      __slotId: "course/lesson/s1",
      __variantId: "v-a",
    };
    const copy = requeuedCopy(step);
    expect(copy.__qid).toBe(0);
    expect(copy.__slotId).toBe("course/lesson/s1");
    expect(copy.__variantId).toBe("v-a");
    expect(copy.__requeued).toBe(true);
    expect(copy).not.toBe(step);
  });

  it("a wrong answer re-queues a copy with the same __qid and grows steps", () => {
    let steps = assignQids([mcq(1), mcq(2)]) as WorkingStep[];
    expect(steps).toHaveLength(2);
    expect(baseQids(steps)).toEqual([0, 1]);

    const afterWrong = applyAnswer(steps, 0, false, [], []);
    steps = afterWrong.steps;
    expect(steps).toHaveLength(3);
    expect(steps[2].__qid).toBe(0);
    expect(steps[2].__requeued).toBe(true);
  });

  it("allQuestionsMastered stays false until every qid is answered correctly", () => {
    let steps = assignQids([mcq(1), mcq(2), mcq(3)]) as WorkingStep[];
    let mastered: number[] = [];
    let mistaken: number[] = [];

    expect(allQuestionsMastered(steps, mastered)).toBe(false);

    let r = applyAnswer(steps, 0, true, mastered, mistaken);
    steps = r.steps;
    mastered = r.masteredQids;
    mistaken = r.mistakenQids;
    expect(allQuestionsMastered(steps, mastered)).toBe(false);

    r = applyAnswer(steps, 1, false, mastered, mistaken);
    steps = r.steps;
    mastered = r.masteredQids;
    mistaken = r.mistakenQids;
    expect(allQuestionsMastered(steps, mastered)).toBe(false);

    r = applyAnswer(steps, 2, true, mastered, mistaken);
    steps = r.steps;
    mastered = r.masteredQids;
    mistaken = r.mistakenQids;
    expect(allQuestionsMastered(steps, mastered)).toBe(false);

    // Re-queued copy of qid 1 at index 3.
    r = applyAnswer(steps, 3, true, mastered, mistaken);
    mastered = r.masteredQids;
    expect(allQuestionsMastered(r.steps, mastered)).toBe(true);
  });

  it("firstTryAccuracy counts questions never missed on first try", () => {
    const steps = assignQids([mcq(1), mcq(2), mcq(3)]) as WorkingStep[];

    expect(firstTryAccuracy(steps, [])).toBe(100);
    expect(firstTryAccuracy(steps, [1])).toBe(67);
    expect(firstTryAccuracy(steps, [0, 2])).toBe(33);
    expect(firstTryAccuracy(steps, [0, 1, 2])).toBe(0);

    // Duplicate mistaken entries for the same qid do not double-count.
    expect(firstTryAccuracy(steps, [1, 1])).toBe(67);
  });
});
