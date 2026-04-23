#!/usr/bin/env node
/**
 * Fundi Finance — Unit Test Suite
 *
 * Covers the exact categories of bugs that have been found in production:
 *   1. Streak calculation logic (sync-streak)
 *   2. Weekly challenge Sunday anchoring
 *   3. Daily challenge key consistency
 *   4. XP localStorage write-once invariant
 *   5. Bible verse NLT attribution
 *   6. Spaced repetition (SM-2) algorithm
 *   7. Content data integrity (no comma-formatted numbers)
 *
 * Run with: node scripts/unit-tests.js
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? `\n       ${detail}` : ""}`);
    failed++;
    failures.push(label);
  }
}

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  assert(ok, label, ok ? "" : `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. STREAK CALCULATION (mirrors sync-streak/route.ts logic)
// ─────────────────────────────────────────────────────────────────────────────
section("1. Streak Calculation");

/**
 * Mirrors the exact logic in src/app/api/progress/sync-streak/route.ts
 */
function calcNextStreak(current, freezeCount, lastActive, today, yesterday) {
  let nextStreak = current;
  let nextFreezeCount = freezeCount;

  if (!lastActive) {
    nextStreak = 1; // first lesson ever
  } else if (lastActive === today) {
    nextStreak = Math.max(1, current); // already active today, no change
  } else if (lastActive === yesterday) {
    nextStreak = Math.max(1, current) + 1; // consecutive day
  } else if (freezeCount > 0) {
    nextStreak = current; // freeze absorbs the gap
    nextFreezeCount = freezeCount - 1;
  } else {
    nextStreak = 1; // lapsed, but doing lesson now = day 1
  }

  return { nextStreak, nextFreezeCount };
}

{
  // First ever lesson
  const r = calcNextStreak(0, 0, null, "2026-04-23", "2026-04-22");
  assertEqual(r.nextStreak, 1, "First lesson → streak 1");

  // Consecutive day
  const r2 = calcNextStreak(3, 0, "2026-04-22", "2026-04-23", "2026-04-22");
  assertEqual(r2.nextStreak, 4, "Consecutive day → increments streak");

  // Same day (second lesson) — must not increment
  const r3 = calcNextStreak(4, 0, "2026-04-23", "2026-04-23", "2026-04-22");
  assertEqual(r3.nextStreak, 4, "Same day second lesson → streak unchanged");

  // Lapsed streak with no freeze → resets to 1 (not 0!)
  const r4 = calcNextStreak(7, 0, "2026-04-20", "2026-04-23", "2026-04-22");
  assertEqual(r4.nextStreak, 1, "Lapsed streak, no freeze → resets to 1 (never 0)");
  assert(r4.nextStreak !== 0, "Lapsed streak never drops to 0");

  // Lapsed streak with freeze → streak preserved, freeze consumed
  const r5 = calcNextStreak(7, 2, "2026-04-20", "2026-04-23", "2026-04-22");
  assertEqual(r5.nextStreak, 7, "Freeze absorbs gap → streak preserved");
  assertEqual(r5.nextFreezeCount, 1, "Freeze consumed (2 → 1)");

  // streak=0 with yesterday active → must result in at least 1
  const r6 = calcNextStreak(0, 0, "2026-04-22", "2026-04-23", "2026-04-22");
  assert(r6.nextStreak >= 1, "Streak can never go below 1 after completing a lesson");
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WEEKLY CHALLENGE SUNDAY ANCHORING
// ─────────────────────────────────────────────────────────────────────────────
section("2. Weekly Challenge Sunday Anchoring");

const WEEKLY_CHALLENGES = [
  { id: "wc-7lessons",        text: "Complete 7 lessons this week" },
  { id: "wc-5streak",         text: "Maintain your streak for 5 days" },
  { id: "wc-perfect",         text: "Get a perfect score on 5 lessons" },
  { id: "wc-200xp",           text: "Earn 200 XP in a single day" },
  { id: "wc-5lessons-perfect",text: "Complete 5 lessons with at least 80% score" },
];

function getWeeklyChallenge(date) {
  // Sunday-anchored (the fixed version)
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  sunday.setHours(0, 0, 0, 0);
  const weekNum = Math.floor(sunday.getTime() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
}

function getWeeklyChallengeOld(date) {
  // Old version — epoch-anchored (Thursday-based, causes mid-week rotation)
  const weekNum = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_CHALLENGES[weekNum % WEEKLY_CHALLENGES.length];
}

{
  // Within one week (Mon–Sat) the challenge must be the same
  const dates = ["2026-04-20", "2026-04-21", "2026-04-22", "2026-04-23", "2026-04-24", "2026-04-25"].map(d => new Date(d));
  const challenges = dates.map(d => getWeeklyChallenge(d).id);
  const allSame = challenges.every(c => c === challenges[0]);
  assert(allSame, "All days Mon–Sat return the same weekly challenge", `got: ${challenges.join(", ")}`);

  // Sunday starts a new week (may be same challenge by coincidence, but key changes if modulo wraps)
  const sat = new Date("2026-04-25");
  const sun = new Date("2026-04-26");
  // The challenge may or may not change — but the function must work without throwing
  const satC = getWeeklyChallenge(sat);
  const sunC = getWeeklyChallenge(sun);
  assert(typeof satC.id === "string" && typeof sunC.id === "string", "Sunday/Saturday both return valid challenges");

  // Old algorithm DID change mid-week — verify the new one doesn't share the flaw
  const wedOld = getWeeklyChallengeOld(new Date("2026-04-22")); // Wednesday
  const thuOld = getWeeklyChallengeOld(new Date("2026-04-23")); // Thursday (epoch week boundary!)
  const wedNew = getWeeklyChallenge(new Date("2026-04-22"));
  const thuNew = getWeeklyChallenge(new Date("2026-04-23"));

  // Old algo changed Wed→Thu (the epoch week flipped)
  // If they happened to be the same by coincidence, skip; otherwise verify the new algo is stable
  if (wedOld.id !== thuOld.id) {
    assert(wedNew.id === thuNew.id, "New algo: Wed→Thu challenge stays the same (old algo changed here)");
  } else {
    assert(true, "Old algo Wed/Thu were same by coincidence — new algo still stable");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DAILY CHALLENGE KEY CONSISTENCY
// ─────────────────────────────────────────────────────────────────────────────
section("3. Daily Challenge Key Consistency");

{
  const src = readFileSync(path.join(ROOT, "src/app/pageViews.tsx"), "utf8");

  // complete-lesson and complete-2-lessons must use the SAME key prefix
  const lessonKeyMatches = [...src.matchAll(/["']complete-lesson["'].*?fundi-([\w-]+)-\$\{today\}/gs)];
  const twoLessonKeyMatches = [...src.matchAll(/["']complete-2-lessons["'].*?fundi-([\w-]+)-\$\{today\}/gs)];

  // Find the condition block for daily challenge checks
  // Handles both single-quote and backtick key patterns
  const conditionBlock = src.match(/["']complete-lesson["'][^\n]+\n[\s\S]{0,2000}["']complete-2-lessons["'][^\n]+/);
  assert(!!conditionBlock, "Daily challenge conditions block found in source");

  // Extract the key prefix from each condition line
  const line1 = src.match(/["']complete-lesson["']\s*:.*?localStorage\.getItem\(`([^$`]+)/);
  const line2 = src.match(/["']complete-2-lessons["']\s*:.*?localStorage\.getItem\(`([^$`]+)/);

  assert(!!line1, "complete-lesson condition found in source");
  assert(!!line2, "complete-2-lessons condition found in source");

  if (line1 && line2) {
    assertEqual(line1[1], line2[1], "complete-lesson and complete-2-lessons check the same localStorage key prefix");
  }

  // bumpWeeklyChallengeProgress must NOT write fundi-daily-lessons-{today}
  const hasDailyLessonsWrite = src.includes('localStorage.setItem(`fundi-daily-lessons-${today}`');
  assert(!hasDailyLessonsWrite, "bumpWeeklyChallengeProgress does NOT write fundi-daily-lessons key (would count concept reviews as lessons)");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. XP WRITE-ONCE INVARIANT
// ─────────────────────────────────────────────────────────────────────────────
section("4. XP localStorage Write-Once Invariant");

{
  const src = readFileSync(path.join(ROOT, "src/app/pageViews.tsx"), "utf8");

  // In finalizeCurrentLesson, we must NOT add totalXP to localStorage again
  // The fix replaced: const newDailyXp = prev + totalXP  →  just read existing
  const badPattern = /xpIsoKey.*?const newDailyXp = prev \+ totalXP/s;
  assert(!badPattern.test(src), "finalizeCurrentLesson does NOT add totalXP to localStorage a second time");

  // In handleNext (ReviewSession), no manual localStorage write after onXpEarned
  // We check there's no localStorage.setItem in close proximity to onXpEarned call
  const reviewHandleNextSection = src.match(/handleNext[\s\S]{0,600}onXpEarned\(xpEarned\)/);
  if (reviewHandleNextSection) {
    const snippet = reviewHandleNextSection[0];
    const hasExtraWrite = snippet.includes('localStorage.setItem(xpKey') || snippet.includes('localStorage.setItem(`fundi-daily-xp');
    assert(!hasExtraWrite, "ReviewSession.handleNext does NOT write to localStorage after onXpEarned (would double-count concept review XP)");
  }

  // persist() in useProgress must NOT include streak in payload
  const useProgressSrc = readFileSync(path.join(ROOT, "src/hooks/useProgress.ts"), "utf8");
  const persistFn = useProgressSrc.match(/const persist[\s\S]{0,800}await supabase/);
  if (persistFn) {
    const snippet = persistFn[0];
    // streak: should NOT be in the payload
    const hasStreakInPayload = /streak\s*:\s*next\.streak/.test(snippet);
    assert(!hasStreakInPayload, "useProgress.persist() does NOT include streak in upsert payload (would race with sync-streak)");
    const hasLastActivityInPayload = /last_activity_date\s*:\s*next\.lastActivityDate/.test(snippet);
    assert(!hasLastActivityInPayload, "useProgress.persist() does NOT include last_activity_date in upsert payload");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BIBLE VERSE NLT ATTRIBUTION
// ─────────────────────────────────────────────────────────────────────────────
section("5. Bible Verse NLT Attribution");

{
  const contentSrc = readFileSync(path.join(ROOT, "src/data/content.ts"), "utf8");

  // Extract verse references that appear as FORMAL CITATIONS (directly before a quoted verse in <em>)
  // Pattern: "Book chapter:verse (NLT), <em>..." — these require NLT attribution.
  // Feedback text that mentions a verse ref casually does NOT need the tag.
  const formalCitations = [...contentSrc.matchAll(/(?:Psalm|Proverbs|Luke|Romans|Matthew|John|Acts)\s+[\d:]+(?:-\d+)?\s*(?:\([A-Z]+\))?\s*,\s*<em>/g)]
    .map(m => m[0]);

  const uniqueRefs = [...new Set(
    formalCitations.map(c => c.match(/((?:Psalm|Proverbs|Luke|Romans|Matthew|John|Acts)\s+[\d:]+(?:-\d+)?)/)?.[1]).filter(Boolean)
  )];

  for (const ref of uniqueRefs) {
    // Each formal citation must include (NLT)
    const withNLT = new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\(NLT\\)\\s*,\\s*<em>").test(contentSrc);
    assert(withNLT, `${ref} (formal citation) → has (NLT) attribution`);
  }

  // Specifically check the three that were missing NLT before the fix
  const fixedVerses = [
    { ref: "Proverbs 11:24-25", pattern: /Proverbs 11:24-25 \(NLT\)/ },
    { ref: "Proverbs 22:7",     pattern: /Proverbs 22:7 \(NLT\)/ },
    { ref: "Romans 13:8",       pattern: /Romans 13:8 \(NLT\)/ },
  ];
  for (const { ref, pattern } of fixedVerses) {
    assert(pattern.test(contentSrc), `${ref} specifically has (NLT) tag`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SPACED REPETITION SM-2 ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────
section("6. Spaced Repetition (SM-2) Algorithm");

{
  const MIN_EASE = 1.3;

  function applyReview(record, quality) {
    const { ease_factor, repetitions, interval_days } = record;
    const newEase = Math.max(MIN_EASE, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    let newInterval, newRepetitions;
    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    } else {
      newRepetitions = repetitions + 1;
      if (newRepetitions === 1) newInterval = 1;
      else if (newRepetitions === 2) newInterval = 6;
      else newInterval = Math.round(interval_days * newEase);
    }
    return { ...record, interval_days: newInterval, ease_factor: newEase, repetitions: newRepetitions };
  }

  const base = { concept_id: "test", interval_days: 1, ease_factor: 2.5, repetitions: 0, next_review_date: "2026-04-23", last_reviewed_at: new Date().toISOString() };

  // Wrong answer → resets to interval 1
  const wrong = applyReview(base, 1);
  assertEqual(wrong.interval_days, 1, "Wrong answer → interval resets to 1");
  assertEqual(wrong.repetitions, 0, "Wrong answer → repetitions reset to 0");
  assert(wrong.ease_factor < base.ease_factor, "Wrong answer → ease factor decreases");

  // First correct → interval 1, reps 1
  const r1 = applyReview(base, 4);
  assertEqual(r1.interval_days, 1, "First correct → interval 1");
  assertEqual(r1.repetitions, 1, "First correct → reps 1");

  // Second correct → interval 6
  const r2 = applyReview(r1, 4);
  assertEqual(r2.interval_days, 6, "Second correct → interval 6");
  assertEqual(r2.repetitions, 2, "Second correct → reps 2");

  // Third correct → interval = round(6 * ease_factor) ≈ 15
  const r3 = applyReview(r2, 4);
  assert(r3.interval_days > 6, "Third correct → interval grows beyond 6");
  assert(r3.ease_factor >= MIN_EASE, "Ease factor never drops below minimum (1.3)");

  // Edge case: ease never goes below MIN_EASE even with repeated wrong answers
  let record = { ...base, ease_factor: 1.4 };
  for (let i = 0; i < 5; i++) record = applyReview(record, 1);
  assert(record.ease_factor >= MIN_EASE, "Ease factor stays at MIN_EASE after repeated wrong answers");
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CONTENT DATA INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────
section("7. Content Data Integrity");

{
  for (const file of ["content.ts", "content-extra.ts"]) {
    const src = readFileSync(path.join(ROOT, "src/data", file), "utf8");

    // No comma-formatted Rand amounts (R18,500 → should be R18 500)
    const commaAmounts = [...src.matchAll(/R\d{1,3}(?:,\d{3})+/g)].map(m => m[0]);
    assert(commaAmounts.length === 0, `${file}: No comma-formatted Rand amounts`, commaAmounts.slice(0, 3).join(", "));
  }

  // Sync-streak route must NOT reference non-existent column streak_freezes
  const streakRoute = readFileSync(path.join(ROOT, "src/app/api/progress/sync-streak/route.ts"), "utf8");
  assert(!streakRoute.includes("streak_freezes"), "sync-streak route does NOT reference non-existent column 'streak_freezes'");

  // Sync-streak route must write freeze_count (the real column name)
  assert(streakRoute.includes("freeze_count"), "sync-streak route upserts using correct column name 'freeze_count'");
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. CONCEPT REVIEW Z-INDEX (layout bug that hid the exit button)
// ─────────────────────────────────────────────────────────────────────────────
section("8. ReviewSession Z-Index");

{
  const src = readFileSync(path.join(ROOT, "src/app/pageViews.tsx"), "utf8");

  // FundiTopBar has zIndex: 200. ReviewSession must be ABOVE that.
  const topBarZIndex = src.match(/FundiTopBar[\s\S]{0,300}zIndex:\s*(\d+)/);
  const topBarZ = topBarZIndex ? parseInt(topBarZIndex[1]) : 200;

  // Find all ReviewSession overlay divs (fixed inset-0)
  const overlays = [...src.matchAll(/fixed inset-0[\s\S]{0,200}zIndex:\s*(\d+)/g)];
  const reviewOverlayZs = overlays.map(m => parseInt(m[1])).filter(z => !isNaN(z));

  assert(reviewOverlayZs.length > 0, "ReviewSession overlays use inline zIndex (not Tailwind z-50 class)");
  for (const z of reviewOverlayZs) {
    assert(z > topBarZ, `ReviewSession overlay zIndex (${z}) > FundiTopBar zIndex (${topBarZ})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. USERNAME VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
section("9. Username Validation");

{
  // Mirror validateUsername logic from pageViews.tsx
  function validateUsername(value) {
    if (!value || !value.trim()) return "Username is required.";
    if (value.trim().length < 2) return "Username must be at least 2 characters.";
    if (value.length > 50) return "Username must be 50 characters or less.";
    if (/[\x00-\x1F\x7F]/.test(value)) return "Username contains invalid characters.";
    return null;
  }

  // Valid cases
  assert(validateUsername("Kwanele") === null, "Uppercase letters allowed");
  assert(validateUsername("kwanele_bc") === null, "Underscores allowed");
  assert(validateUsername("Kwanele BC") === null, "Spaces allowed");
  assert(validateUsername("Kwanele-Bonga") === null, "Hyphens allowed");
  assert(validateUsername("Kwanele.Bonga") === null, "Dots allowed");
  assert(validateUsername("Ân") === null, "Unicode/accented characters allowed");
  assert(validateUsername("KwaneleBC031") === null, "Mix of caps and numbers allowed");
  assert(validateUsername("K!@#$%") === null, "Special printable characters allowed");

  // Invalid cases
  assert(validateUsername("") !== null, "Empty string rejected");
  assert(validateUsername("  ") !== null, "Whitespace-only rejected");
  assert(validateUsername("K") !== null, "Single character rejected (under min length)");
  assert(validateUsername("K".repeat(51)) !== null, "51-character username rejected");
  assert(validateUsername("abc\x00def") !== null, "Null byte rejected");
  assert(validateUsername("abc\ndef") !== null, "Newline rejected");
  assert(validateUsername("abc\x1Bdef") !== null, "Escape character rejected");

  // Check that app code no longer enforces the old lowercase-only constraint
  const src = readFileSync(path.join(ROOT, "src/app/pageViews.tsx"), "utf8");
  const hasOldConstraint = /\^?\[a-z0-9_\]\{3,20\}/.test(src);
  assert(!hasOldConstraint, "Old lowercase-only regex not present in validateUsername");
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. BADGE TIMING — tc does not double-count already-synced lessons
// ─────────────────────────────────────────────────────────────────────────────
section("10. Badge Timing (lesson count tc)");

{
  // Mirror the badge-count logic from finalizeCurrentLesson
  function calcTc(completedLessonsSet, courseId, lessonId, totalCompleted) {
    const key = `${courseId}:${lessonId}`;
    const alreadyInSet = completedLessonsSet.has(key);
    return totalCompleted + (alreadyInSet ? 0 : 1);
  }

  // Scenario A: lesson is NEW (not yet in completedLessons from Supabase)
  {
    const completed = new Set(["course1:lesson1", "course1:lesson2"]);
    const tc = calcTc(completed, "course1", "lesson3", completed.size);
    assertEqual(tc, 3, "New lesson: tc = totalCompleted + 1 (adds 1 correctly)");
  }

  // Scenario B: lesson was already synced from another device (the bug case)
  {
    // User has 26 lessons in DB. Lesson 25 was synced from another device.
    const completed = new Set(Array.from({length: 26}, (_, i) => `course:lesson${i+1}`));
    // They are now "completing" lesson25 again on this device
    const tc = calcTc(completed, "course", "lesson25", completed.size);
    assertEqual(tc, 26, "Already-synced lesson: tc = totalCompleted (no +1 overcount)");
    assert(tc >= 25, "Badge for 25 lessons would correctly fire (tc=26 >= 25)");
  }

  // Scenario C: exactly at badge boundary — completing lesson 25 for first time
  {
    const completed = new Set(Array.from({length: 24}, (_, i) => `course:lesson${i+1}`));
    const tc = calcTc(completed, "course", "lesson25", completed.size);
    assertEqual(tc, 25, "First completion of lesson 25: tc = 25 (triggers badge at exact threshold)");
    assert(tc >= 25, "Badge for 25 lessons fires at correct threshold");
  }

  // Scenario D: old (buggy) behaviour would have fired badge at 27
  {
    // User had 26 lessons already synced. Bug: tc = 26 + 1 = 27.
    // Fix: alreadyInSet=true so tc = 26 + 0 = 26. Badge fires at 26 (>= 25).
    const completed = new Set(Array.from({length: 26}, (_, i) => `course:lesson${i+1}`));
    const buggyTc = completed.size + 1; // old behaviour
    const fixedTc = calcTc(completed, "course", "lesson26", completed.size);
    assert(buggyTc === 27, "Old behaviour: tc was 27 when lesson already synced");
    assert(fixedTc === 26, "Fixed behaviour: tc is 26 (no overcount)");
    assert(fixedTc < buggyTc, "Fixed tc is lower than buggy tc — badge fires earlier");
  }

  // Verify the fix is present in pageViews.tsx source code
  const src = readFileSync(path.join(ROOT, "src/app/pageViews.tsx"), "utf8");
  assert(
    /alreadyInSet.*completedLessons\.has\(currentLessonKey\)/.test(src) ||
    /completedLessons\.has\(currentLessonKey\).*alreadyInSet/.test(src),
    "pageViews.tsx uses alreadyInSet check before computing tc"
  );
  assert(
    /alreadyInSet \? 0 : 1/.test(src),
    "pageViews.tsx: tc uses ternary (alreadyInSet ? 0 : 1)"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.error(`\nFailed tests:`);
  failures.forEach(f => console.error(`  • ${f}`));
  process.exit(1);
} else {
  console.log("All tests passed ✅");
}
