import { describe, it, expect } from "vitest";
import {
  shuffleLessonSteps,
  lessonShuffleSeed,
  seededPermutation,
  hashSeed,
} from "@/lib/lessonShuffle";
import type { LessonStep } from "@/data/content";

const mcq = (options: string[], correct: number): LessonStep =>
  ({
    type: "mcq",
    question: "q",
    options,
    correct,
    feedback: { correct: "y", incorrect: "n" },
  }) as LessonStep;

describe("seededPermutation", () => {
  it("preserves correctness: remapped index points at the original correct option", () => {
    const options = ["Alpha", "Bravo", "Charlie", "Delta"];
    const originalCorrect = 1;
    const correctText = options[originalCorrect];

    for (let seed = 0; seed < 100; seed++) {
      const perm = seededPermutation(options.length, hashSeed(`perm-${seed}`));
      const shuffled = perm.map((oldIdx) => options[oldIdx]);
      const remappedCorrect = perm.indexOf(originalCorrect);
      expect(shuffled[remappedCorrect]).toBe(correctText);
    }
  });

  it("is stable for the same seed", () => {
    const seed = hashSeed("stable-perm");
    expect(seededPermutation(4, seed)).toEqual(seededPermutation(4, seed));
  });

  it("varies across different seeds", () => {
    const a = seededPermutation(4, hashSeed("seed-a"));
    const b = seededPermutation(4, hashSeed("seed-b"));
    expect(a).not.toEqual(b);
  });
});

describe("shuffleLessonSteps", () => {
  const steps: LessonStep[] = [
    { type: "info", title: "t", content: "c" } as LessonStep,
    mcq(["A", "B", "C", "D"], 1),
    mcq(["w", "x", "y", "z"], 3),
  ];

  it("is deterministic for the same seed (resume-safe)", () => {
    const a = shuffleLessonSteps(steps, "user1:c:l");
    const b = shuffleLessonSteps(steps, "user1:c:l");
    expect(a).toEqual(b);
  });

  it("remaps the correct index to the same option text", () => {
    for (let s = 0; s < 50; s++) {
      const out = shuffleLessonSteps(steps, `seed-${s}`);
      const q = out[1] as { options: string[]; correct: number };
      expect(q.options[q.correct]).toBe("B"); // original correct option
      expect([...q.options].sort()).toEqual(["A", "B", "C", "D"]);
    }
  });

  it("does not mutate the input steps", () => {
    const before = JSON.stringify(steps);
    shuffleLessonSteps(steps, "any");
    expect(JSON.stringify(steps)).toBe(before);
  });

  it("leaves non-option steps untouched", () => {
    const out = shuffleLessonSteps(steps, "seed");
    expect(out[0]).toBe(steps[0]);
  });

  it("spreads the correct answer across positions (kills index bias)", () => {
    // Author bias: correct is ALWAYS index 1 in the input. Across many
    // user seeds, the rendered position must be roughly uniform.
    const counts = [0, 0, 0, 0];
    const N = 2000;
    for (let u = 0; u < N; u++) {
      const out = shuffleLessonSteps(steps, lessonShuffleSeed(`user-${u}`, "course", "lesson"));
      counts[(out[1] as { correct: number }).correct]++;
    }
    for (const c of counts) {
      expect(c / N).toBeGreaterThan(0.15); // uniform would be 0.25
      expect(c / N).toBeLessThan(0.35);
    }
  });
});
