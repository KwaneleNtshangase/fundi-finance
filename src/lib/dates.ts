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
