/**
 * Date helpers that always use South Africa Standard Time (UTC+2, no DST).
 *
 * Every calendar-day localStorage key and daily/weekly comparison MUST go
 * through these helpers. Using new Date().toISOString() gives a UTC date
 * which rolls over at 22:00 SA time - causing streaks, daily XP, and
 * daily challenges to reset two hours early every evening.
 */

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000; // UTC+2, no daylight saving

/**
 * Returns today's date string in SAST as "YYYY-MM-DD".
 * Use wherever you would otherwise write `new Date().toISOString().slice(0, 10)`.
 */
export function sastToday(): string {
  return new Date(Date.now() + SAST_OFFSET_MS).toISOString().split("T")[0];
}

/**
 * Returns a date offset by `days` from today in SAST.
 * E.g. sastOffset(-1) = yesterday in SAST.
 */
export function sastOffset(days: number): string {
  return new Date(Date.now() + SAST_OFFSET_MS + days * 86_400_000)
    .toISOString()
    .split("T")[0];
}

/**
 * Returns "fundi-week-YYYY-MM-DD" anchored to the most recent Sunday in SAST.
 * Used for weekly XP keys and leaderboard week boundaries.
 */
export function sastWeekKey(): string {
  const now = new Date(Date.now() + SAST_OFFSET_MS);
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday in the shifted time
  const sunday = new Date(now.getTime() - dayOfWeek * 86_400_000);
  const y = sunday.getUTCFullYear();
  const m = String(sunday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(sunday.getUTCDate()).padStart(2, "0");
  return `fundi-week-${y}-${m}-${d}`;
}

/**
 * Returns "YYYY-MM-DD" of the most recent Sunday in SAST.
 * Used as the weekly challenge seed / storage key anchor.
 */
export function sastSundayDate(): string {
  const now = new Date(Date.now() + SAST_OFFSET_MS);
  const dayOfWeek = now.getUTCDay();
  const sunday = new Date(now.getTime() - dayOfWeek * 86_400_000);
  const y = sunday.getUTCFullYear();
  const m = String(sunday.getUTCMonth() + 1).padStart(2, "0");
  const d = String(sunday.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the number of days between two SAST date strings (YYYY-MM-DD).
 * e.g., if dateA is tomorrow and dateB is today, returns 1.
 */
export function sastDateDiffDays(dateA: string, dateB: string): number {
  const tA = new Date(dateA).getTime();
  const tB = new Date(dateB).getTime();
  return Math.round((tA - tB) / 86_400_000);
}

/**
 * Reconciles the user's streak based on the current date and their last activity.
 * Consumes freezes for missed days. If not enough freezes, streak resets to 0.
 * Returns the updated streak, freezeCount, and the effectively "caught up" lastActivityDate
 * (which will be yesterday if freezes were used, so they still need to play today to extend it).
 */
export function evaluateStreak(
  streak: number,
  freezeCount: number,
  lastActivityDate: string | null,
  currentDate: string = sastToday()
): { streak: number; freezeCount: number; lastActivityDate: string | null } {
  if (!lastActivityDate) {
    return { streak, freezeCount, lastActivityDate };
  }
  
  const gap = sastDateDiffDays(currentDate, lastActivityDate);
  
  // They played today or yesterday - streak is fine, no freezes needed.
  if (gap <= 1) {
    return { streak, freezeCount, lastActivityDate };
  }
  
  // Missed days = gap - 1
  const missedDays = gap - 1;
  
  if (freezeCount >= missedDays) {
    return {
      streak,
      freezeCount: freezeCount - missedDays,
      // Advance lastActivityDate to yesterday so we don't double-charge freezes on next load
      lastActivityDate: sastOffset(-1)
    };
  } else {
    // Not enough freezes to cover the gap. Streak is lost.
    return {
      streak: 0,
      freezeCount, // keeping any remaining freezes since they weren't enough
      lastActivityDate
    };
  }
}
