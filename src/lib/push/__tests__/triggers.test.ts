import { describe, it, expect } from "vitest";
import {
  yesterdayOf,
  streakAtRiskPush,
  coachAlertPush,
  leaderboardDefencePush,
  pickPush,
} from "../triggers";

describe("yesterdayOf", () => {
  it("handles normal days and month boundaries", () => {
    expect(yesterdayOf("2026-07-12")).toBe("2026-07-11");
    expect(yesterdayOf("2026-07-01")).toBe("2026-06-30");
    expect(yesterdayOf("2026-01-01")).toBe("2025-12-31");
  });
});

describe("streakAtRiskPush", () => {
  it("fires for a 3+ streak last active yesterday", () => {
    const p = streakAtRiskPush(7, "2026-07-11", "2026-07-12");
    expect(p).not.toBeNull();
    expect(p!.key).toBe("streak:2026-07-12");
    expect(p!.title).toContain("7-day streak");
  });

  it("skips short streaks", () => {
    expect(streakAtRiskPush(2, "2026-07-11", "2026-07-12")).toBeNull();
  });

  it("skips users already active today", () => {
    expect(streakAtRiskPush(7, "2026-07-12", "2026-07-12")).toBeNull();
  });

  it("skips already-broken streaks", () => {
    expect(streakAtRiskPush(7, "2026-07-09", "2026-07-12")).toBeNull();
    expect(streakAtRiskPush(7, null, "2026-07-12")).toBeNull();
  });
});

describe("coachAlertPush", () => {
  it("fires only for alert severity and reuses the insight id as key", () => {
    const p = coachAlertPush({ id: "over-budget:food:2026-07", severity: "alert", title: "Food & Groceries is over budget" });
    expect(p).not.toBeNull();
    expect(p!.key).toBe("over-budget:food:2026-07");
    expect(coachAlertPush({ id: "x", severity: "warn", title: "t" })).toBeNull();
    expect(coachAlertPush(undefined)).toBeNull();
  });
});

describe("leaderboardDefencePush", () => {
  it("fires Saturdays for competing users", () => {
    const p = leaderboardDefencePush(2, 90, "2026-W28", true);
    expect(p).not.toBeNull();
    expect(p!.key).toBe("rank:2026-W28");
    expect(p!.title).toContain("#2");
  });

  it("has a special #1 message", () => {
    const p = leaderboardDefencePush(1, 150, "2026-W28", true);
    expect(p!.body).toContain("crown");
  });

  it("skips non-Saturdays, low ranks and zero-XP users", () => {
    expect(leaderboardDefencePush(2, 90, "2026-W28", false)).toBeNull();
    expect(leaderboardDefencePush(11, 90, "2026-W28", true)).toBeNull();
    expect(leaderboardDefencePush(3, 0, "2026-W28", true)).toBeNull();
  });
});

describe("pickPush", () => {
  it("returns the first non-null candidate (priority order)", () => {
    const streak = streakAtRiskPush(5, "2026-07-11", "2026-07-12");
    const rank = leaderboardDefencePush(1, 150, "2026-W28", true);
    expect(pickPush([streak, null, rank])!.key).toBe("streak:2026-07-12");
    expect(pickPush([null, null, rank])!.key).toBe("rank:2026-W28");
    expect(pickPush([null, null, null])).toBeNull();
  });
});
