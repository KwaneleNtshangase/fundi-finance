import { describe, expect, it } from "vitest";
import { REPLAY_XP_FACTOR, computeLessonXpAward, replayXpStorageKey } from "../lessonXp";

describe("computeLessonXpAward", () => {
  const fullXp = 80;

  it("first completion awards full XP", () => {
    expect(computeLessonXpAward(fullXp, false, false)).toBe(fullXp);
  });

  it("same-day replay awards reduced XP once", () => {
    const reduced = Math.round(fullXp * REPLAY_XP_FACTOR);
    expect(computeLessonXpAward(fullXp, true, false)).toBe(reduced);
    expect(reduced).toBe(20);
  });

  it("second same-day replay of the same lesson awards 0", () => {
    expect(computeLessonXpAward(fullXp, true, true)).toBe(0);
  });

  it("next SAST day can award reduced replay XP again", () => {
    const reduced = Math.round(fullXp * REPLAY_XP_FACTOR);
    expect(computeLessonXpAward(fullXp, true, false)).toBe(reduced);
  });
});

describe("replayXpStorageKey", () => {
  it("scopes replay gate per user, lesson, and SAST day", () => {
    expect(replayXpStorageKey("user-1", "course:lesson", "2026-05-19")).toBe(
      "fundi-replay-xp-user-1-course:lesson-2026-05-19"
    );
    expect(replayXpStorageKey("user-1", "course:lesson", "2026-05-20")).not.toBe(
      replayXpStorageKey("user-1", "course:lesson", "2026-05-19")
    );
  });
});
