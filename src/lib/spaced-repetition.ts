/**
 * Fundi Finance — SM-2 Spaced Repetition Engine
 *
 * Based on the SuperMemo SM-2 algorithm (Anki-style).
 *
 * Each concept tracks:
 *  - interval_days    : days until next review (starts at 1)
 *  - ease_factor      : how "easy" the card is (starts at 2.5, min 1.3)
 *  - repetitions      : how many times reviewed consecutively with quality ≥ 3
 *  - next_review_date : ISO date string when the card is due
 *  - last_reviewed_at : ISO timestamp of last review
 */

export type MasteryRecord = {
  concept_id: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_date: string; // "YYYY-MM-DD"
  last_reviewed_at: string; // ISO timestamp
};

/** Quality score from 0–5 (like SM-2):
 *  5 = perfect recall, fast
 *  4 = correct, small hesitation
 *  3 = correct after difficulty
 *  2 = wrong, but correct answer felt obvious
 *  1 = wrong, remembered correct answer when shown
 *  0 = completely forgot
 *
 * In Fundi we map: correct answer → 4, wrong answer → 1
 */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

const MIN_EASE = 1.3;

/**
 * Apply the SM-2 algorithm to an existing mastery record.
 * Returns a NEW record (immutable update).
 */
export function applyReview(
  record: MasteryRecord,
  quality: ReviewQuality
): MasteryRecord {
  const { ease_factor, repetitions, interval_days } = record;

  // New ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEase = Math.max(
    MIN_EASE,
    ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  let newInterval: number;
  let newRepetitions: number;

  if (quality < 3) {
    // Incorrect — reset repetitions, short interval
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Correct
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval_days * newEase);
    }
  }

  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    ...record,
    interval_days: newInterval,
    ease_factor: newEase,
    repetitions: newRepetitions,
    next_review_date: toDateString(nextReview),
    last_reviewed_at: now.toISOString(),
  };
}

/**
 * Create a brand-new mastery record for a concept (first exposure).
 * Scheduled for review tomorrow.
 */
export function createMasteryRecord(conceptId: string): MasteryRecord {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    concept_id: conceptId,
    interval_days: 1,
    ease_factor: 2.5,
    repetitions: 0,
    next_review_date: toDateString(tomorrow),
    last_reviewed_at: new Date().toISOString(),
  };
}

/** Returns true if the card is due for review today or overdue */
export function isDue(record: MasteryRecord): boolean {
  return record.next_review_date <= toDateString(new Date());
}

/** Format a Date as YYYY-MM-DD */
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── localStorage persistence ──────────────────────────────────────────────────

const STORAGE_KEY = "fundi-mastery";

/** Load all mastery records from localStorage */
export function loadMastery(): Record<string, MasteryRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Save a single mastery record to localStorage */
export function saveMastery(record: MasteryRecord): void {
  if (typeof window === "undefined") return;
  try {
    const all = loadMastery();
    all[record.concept_id] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage quota exceeded — silently fail
  }
}

/**
 * Schedule all concepts for a just-completed course.
 * - Creates a new record for concepts not yet seen (due tomorrow)
 * - Leaves existing records untouched (don't reset progress)
 */
export function scheduleConceptsForCourse(conceptIds: string[]): void {
  const all = loadMastery();
  let changed = false;
  for (const id of conceptIds) {
    if (!all[id]) {
      all[id] = createMasteryRecord(id);
      changed = true;
    }
  }
  if (changed && typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }
}

/** Get all due cards (today or overdue), sorted oldest-due first */
export function getDueCards(): MasteryRecord[] {
  const all = loadMastery();
  const today = toDateString(new Date());
  return Object.values(all)
    .filter((r) => r.next_review_date <= today)
    .sort((a, b) => a.next_review_date.localeCompare(b.next_review_date));
}

/** Count of due cards */
export function getDueCount(): number {
  return getDueCards().length;
}
