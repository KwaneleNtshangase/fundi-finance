/** Reduced XP rate for replaying an already-completed lesson (first replay per SAST day only). */
export const REPLAY_XP_FACTOR = 0.25;

export function replayXpStorageKey(
  userId: string | null,
  lessonKey: string,
  today: string
): string {
  return `notho-replay-xp-${userId ?? "anon"}-${lessonKey}-${today}`;
}

/**
 * Compute XP to award for a lesson completion.
 * First completion: full xpEarned. Replay: reduced once per SAST day, then 0.
 */
export function computeLessonXpAward(
  xpEarned: number,
  alreadyDone: boolean,
  replayClaimedToday: boolean
): number {
  if (!alreadyDone) return xpEarned;
  if (replayClaimedToday) return 0;
  return Math.round(xpEarned * REPLAY_XP_FACTOR);
}
