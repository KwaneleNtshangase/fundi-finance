/**
 * Fundi Finance - SM-2 Spaced Repetition Engine
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
import { supabase } from "@/lib/supabaseClient";

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
    // Incorrect - reset repetitions, short interval
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
  // Use local date parts to avoid UTC rollbacks that can keep cards "due" too long.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Load all mastery records from Supabase */
export async function loadMastery(): Promise<Record<string, MasteryRecord>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};
  const { data } = await supabase
    .from("concept_mastery")
    .select("concept_id,interval_days,ease_factor,repetitions,next_review_date,last_reviewed_at")
    .eq("user_id", user.id);
  const out: Record<string, MasteryRecord> = {};
  for (const row of (data ?? []) as any[]) {
    out[row.concept_id] = {
      concept_id: row.concept_id,
      interval_days: row.interval_days,
      ease_factor: row.ease_factor,
      repetitions: row.repetitions,
      next_review_date: row.next_review_date,
      last_reviewed_at: row.last_reviewed_at,
    };
  }
  return out;
}

/** Save a single mastery record to Supabase */
export async function saveMastery(record: MasteryRecord): Promise<void> {
  await syncMasteryToSupabase(record);
}

/**
 * Upsert a single mastery record to the concept_mastery table.
 * Called from saveMastery - does not block the UI.
 */
async function syncMasteryToSupabase(record: MasteryRecord): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("concept_mastery").upsert(
      {
        user_id: user.id,
        concept_id: record.concept_id,
        interval_days: record.interval_days,
        ease_factor: record.ease_factor,
        repetitions: record.repetitions,
        next_review_date: record.next_review_date,
        last_reviewed_at: record.last_reviewed_at,
      },
      { onConflict: "user_id,concept_id" }
    );
  } catch {
    // Silent fail
  }
}

/**
 * Schedule all concepts for a just-completed course.
 * - Creates a new record for concepts not yet seen (due tomorrow)
 * - Leaves existing records untouched (don't reset progress)
 */
export async function scheduleConceptsForCourse(conceptIds: string[]): Promise<void> {
  const all = await loadMastery();
  const newRecords: MasteryRecord[] = [];
  for (const id of conceptIds) {
    if (!all[id]) {
      all[id] = createMasteryRecord(id);
      newRecords.push(all[id]);
    }
  }
  if (newRecords.length > 0) {
    await Promise.all(newRecords.map((r) => syncMasteryToSupabase(r)));
  }
}

/** Get all due cards (today or overdue), sorted oldest-due first */
export async function getDueCards(): Promise<MasteryRecord[]> {
  const all = await loadMastery();
  const today = toDateString(new Date());
  return Object.values(all)
    .filter((r) => r.next_review_date <= today)
    .sort((a, b) => {
      const dueDateCmp = a.next_review_date.localeCompare(b.next_review_date);
      if (dueDateCmp !== 0) return dueDateCmp;
      const lastReviewedCmp = a.last_reviewed_at.localeCompare(b.last_reviewed_at);
      if (lastReviewedCmp !== 0) return lastReviewedCmp;
      return a.concept_id.localeCompare(b.concept_id);
    });
}

/** Count of due cards */
export async function getDueCount(): Promise<number> {
  const due = await getDueCards();
  return due.length;
}
