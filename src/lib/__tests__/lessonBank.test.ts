import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Lesson, LessonStep } from "@/data/content";
import {
  resolveLessonSteps,
  nextAttemptNo,
  peekAttemptNo,
  recordMissedVariant,
  clearMissedVariant,
} from "@/lib/lessonBank";

function makeStore() {
  const data: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
    removeItem: (k: string) => {
      delete data[k];
    },
    clear: () => {
      for (const k of Object.keys(data)) delete data[k];
    },
    _data: data,
  };
}

const mcqVariant = (variantId: string, label: string) => ({
  variantId,
  step: {
    type: "mcq" as const,
    question: label,
    options: ["a", "b", "c", "d"],
    correct: 0,
    feedback: { correct: "y", incorrect: "n" },
  },
});

const inlineInfo: LessonStep = { type: "info", title: "Intro", content: "Welcome" };

const legacyMcq = (label: string): LessonStep =>
  ({
    type: "mcq",
    question: label,
    options: ["a", "b", "c", "d"],
    correct: 0,
    feedback: { correct: "y", incorrect: "n" },
  }) as LessonStep;

const QT = new Set(["mcq", "scenario", "true-false", "fill-blank"]);

function legacyQuestions(steps: LessonStep[]): string[] {
  return steps
    .filter((s) => QT.has(s.type))
    .map((s) => (s as { question?: string; prompt?: string }).question
      ?? (s as { prompt?: string }).prompt
      ?? "");
}

function legacyFiveQuestionLesson(): Lesson {
  return {
    id: "legacy-five",
    title: "Legacy five",
    steps: [
      inlineInfo,
      legacyMcq("Q1"),
      { type: "action", title: "Do", instruction: "Try" },
      legacyMcq("Q2"),
      legacyMcq("Q3"),
      legacyMcq("Q4"),
      legacyMcq("Q5"),
    ],
  };
}

function bankLesson(): Lesson {
  return {
    id: "lesson-1",
    title: "Test",
    layout: [
      inlineInfo,
      { slot: "slot-a" },
      { slot: "slot-b" },
    ],
    slots: [
      {
        slotId: "slot-a",
        conceptId: "money-functions",
        variants: [
          mcqVariant("v-a1", "A1"),
          mcqVariant("v-a2", "A2"),
          mcqVariant("v-a3", "A3"),
        ],
      },
      {
        slotId: "slot-b",
        conceptId: "money-functions",
        variants: [mcqVariant("v-b1", "B1"), mcqVariant("v-b2", "B2")],
      },
    ],
  };
}

describe("lessonBank", () => {
  let store: ReturnType<typeof makeStore>;

  beforeEach(() => {
    store = makeStore();
    vi.stubGlobal("window", { localStorage: store });
    vi.stubGlobal("localStorage", store);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolveLessonSteps emits inline steps plus one step per slot ref", () => {
    const out = resolveLessonSteps(bankLesson(), { userId: "u1", attemptNo: 1 });
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual(inlineInfo);
    expect((out[1] as { __slotId?: string }).__slotId).toBe("slot-a");
    expect((out[2] as { __slotId?: string }).__slotId).toBe("slot-b");
  });

  it("returns legacy steps unchanged when no layout/slots", () => {
    const legacy: Lesson = {
      id: "legacy",
      title: "Legacy",
      steps: [inlineInfo, mcqVariant("x", "Q").step as LessonStep],
    };
    expect(resolveLessonSteps(legacy, { userId: "u1", attemptNo: 1 })).toEqual(legacy.steps);
  });

  it("anti-repeat skips recently-seen variants on the next attempt", () => {
    const lesson = bankLesson();
    const ctx = { userId: "u1", attemptNo: 1 };
    const first = resolveLessonSteps(lesson, ctx);
    const firstA = (first[1] as { __variantId?: string }).__variantId;

    const second = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 2 });
    const secondA = (second[1] as { __variantId?: string }).__variantId;

    // Slot-a has 3 variants; anti-repeat should avoid the one just seen.
    expect(secondA).not.toBe(firstA);
  });

  it("recordMissedVariant and clearMissedVariant drive resurfacing", () => {
    recordMissedVariant("u1", "slot-a", "v-a2");
    const raw = JSON.parse(store.getItem("notho-missed-variants") ?? "{}") as Record<
      string,
      string[]
    >;
    expect(raw["u1:slot-a"]).toContain("v-a2");

    // With a missed variant recorded, repeated resolves should sometimes pick it.
    const seen = new Set<string>();
    for (let attempt = 1; attempt <= 40; attempt++) {
      const out = resolveLessonSteps(bankLesson(), { userId: "u1", attemptNo: attempt });
      const vid = (out[1] as { __variantId?: string }).__variantId;
      if (vid) seen.add(vid);
    }
    expect(seen.has("v-a2")).toBe(true);

    clearMissedVariant("u1", "slot-a", "v-a2");
    const afterClear = JSON.parse(store.getItem("notho-missed-variants") ?? "{}") as Record<
      string,
      string[]
    >;
    expect(afterClear["u1:slot-a"] ?? []).not.toContain("v-a2");
  });

  it("nextAttemptNo increments per lesson and peekAttemptNo reads without incrementing", () => {
    expect(nextAttemptNo("u1", "lesson-x")).toBe(1);
    expect(peekAttemptNo("u1", "lesson-x")).toBe(1);
    expect(nextAttemptNo("u1", "lesson-x")).toBe(2);
    expect(peekAttemptNo("u1", "lesson-x")).toBe(2);

    // Different lesson keeps its own counter.
    expect(nextAttemptNo("u1", "lesson-y")).toBe(1);
    expect(peekAttemptNo("u1", "lesson-y")).toBe(1);
    expect(peekAttemptNo("u1", "lesson-x")).toBe(2);
  });

  it("is deterministic for the same user, lesson, and attempt when seen-state is fresh", () => {
    const lesson = bankLesson();
    const run = () => {
      store.clear();
      return resolveLessonSteps(lesson, { userId: "u1", attemptNo: 5 });
    };
    const a = run();
    const b = run();
    expect(a.map((s) => (s as { __variantId?: string }).__variantId)).toEqual(
      b.map((s) => (s as { __variantId?: string }).__variantId)
    );
  });

  describe("legacy lesson rotation", () => {
    it("shows 4 of 5 questions on replay with info/action steps preserved", () => {
      const lesson = legacyFiveQuestionLesson();
      const attempt1 = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 1 });
      const attempt2 = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 2 });

      expect(legacyQuestions(attempt1)).toHaveLength(4);
      expect(legacyQuestions(attempt2)).toHaveLength(4);
      expect(attempt1[0]).toEqual(inlineInfo);
      expect(attempt1.some((s) => s.type === "action")).toBe(true);
      const infoIdx = attempt1.findIndex((s) => s.type === "info");
      const actionIdx = attempt1.findIndex((s) => s.type === "action");
      expect(infoIdx).toBeLessThan(actionIdx);

      const q1 = new Set(legacyQuestions(attempt1));
      const q2 = new Set(legacyQuestions(attempt2));
      const overlap = [...q1].filter((q) => q2.has(q));
      expect(overlap.length).toBeLessThan(4);
    });

    it("leaves a 4-question legacy lesson unchanged", () => {
      const lesson: Lesson = {
        id: "legacy-four",
        title: "Legacy four",
        steps: [
          inlineInfo,
          legacyMcq("Q1"),
          legacyMcq("Q2"),
          legacyMcq("Q3"),
          legacyMcq("Q4"),
        ],
      };
      const out = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 1 });
      expect(out).toEqual(lesson.steps);
    });

    it("leaves a 50-question comprehensive lesson unchanged", () => {
      const steps: LessonStep[] = [inlineInfo];
      for (let i = 1; i <= 50; i++) steps.push(legacyMcq(`Q${i}`));
      const lesson: Lesson = { id: "re5-mock", title: "Mock exam", steps };
      const out = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 1 });
      expect(out).toEqual(steps);
    });

    it("is resume-stable for the same user, lesson, and attempt", () => {
      const lesson = legacyFiveQuestionLesson();
      store.clear();
      const a = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 3 });
      store.clear();
      const b = resolveLessonSteps(lesson, { userId: "u1", attemptNo: 3 });
      expect(legacyQuestions(a)).toEqual(legacyQuestions(b));
      expect(a).toEqual(b);
    });
  });
});
