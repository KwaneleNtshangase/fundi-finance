/**
 * Smart push re-engagement triggers (pure logic, no I/O).
 *
 * The cron route (/api/cron/push-triggers) feeds each subscribed user's state
 * through these functions and sends at most ONE push per user per day, in
 * priority order: streak at risk > coach alert > leaderboard defence.
 * Dedupe is enforced by push_notification_log's (user_id, key) uniqueness.
 */

export type PushMessage = {
  /** Dedupe key, unique per user per occasion. */
  key: string;
  title: string;
  body: string;
  url: string;
};

/** YYYY-MM-DD for the day before the given SAST day. */
export function yesterdayOf(sastDay: string): string {
  const d = new Date(`${sastDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Streak at risk: the user has a streak worth protecting (>= 3 days), their
 * last activity was YESTERDAY (streak alive but dies at midnight), and they
 * haven't done anything today.
 */
export function streakAtRiskPush(
  streak: number,
  lastActivityDate: string | null,
  sastToday: string
): PushMessage | null {
  if (streak < 3) return null;
  if (lastActivityDate !== yesterdayOf(sastToday)) return null;
  return {
    key: `streak:${sastToday}`,
    title: `Your ${streak}-day streak ends at midnight!`,
    body: "One 3-minute lesson keeps it alive. You've come too far to stop now.",
    url: "/learn",
  };
}

/**
 * Coach alert: a category just went over budget (alert-severity insight from
 * the rules engine). The insight's stable id doubles as the dedupe key, so a
 * category only triggers one push per month.
 */
export function coachAlertPush(
  insight: { id: string; severity: string; title: string } | undefined
): PushMessage | null {
  if (!insight || insight.severity !== "alert") return null;
  return {
    key: insight.id,
    title: "Budget alert",
    body: `${insight.title}. Open Cosmo to see what changed and how to plan the rest of the month.`,
    url: "/budget",
  };
}

/**
 * Leaderboard defence: Saturdays only (the weekly ladder resets Sunday).
 * Only sent to users who are actually competing (top 10 with XP this week).
 */
export function leaderboardDefencePush(
  rank: number | null,
  weeklyXp: number,
  weekKey: string,
  isSaturday: boolean
): PushMessage | null {
  if (!isSaturday || rank === null || rank > 10 || weeklyXp <= 0) return null;
  const position =
    rank === 1
      ? "You're #1 on this week's leaderboard!"
      : `You're #${rank} on this week's leaderboard.`;
  return {
    key: `rank:${weekKey}`,
    title: position,
    body:
      rank === 1
        ? "The week resets tomorrow night. Defend your crown with one more lesson."
        : "The week resets tomorrow night. A quick lesson could move you up before it does.",
    url: "/leaderboard",
  };
}

/** Pick the single highest-priority push for a user (or null). */
export function pickPush(
  candidates: (PushMessage | null)[]
): PushMessage | null {
  for (const c of candidates) if (c) return c;
  return null;
}
