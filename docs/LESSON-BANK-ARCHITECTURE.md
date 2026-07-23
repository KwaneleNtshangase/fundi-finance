# Lesson Bank — Architecture

**Status:** Engine implemented · content authoring in progress
**Goal (chosen):** Both anti-memorization *and* freshness/retention → a large enough variant pool to defeat screenshot-sharing, with missed concepts resurfacing.
**Scope of this doc:** data model, selection algorithm, difficulty logging, and a phased rollout.

---

## 0. Build status (2026-07-21) — supersedes parts of §1 and §4

Two decisions changed after this doc was first written, and the engine is now built.

**Difficulty is allowed to vary.** Holding difficulty constant across variants was dropped as unrealistic. "Hard question" is now defined per-user — a question *this* learner got wrong. That removes the difficulty-invariant apparatus: the ±0.10 band check in §4 and the "same difficulty per slot" author rule are no longer requirements. The `question_attempts` table in §4 is now **optional** (keep it only if you want per-item analytics later).

**Mastery completion (new requirement).** A lesson no longer finishes on reaching the last step. A wrong answer re-queues a fresh copy of that question to the end of the session, and the lesson can only complete once every question has been answered correctly at least once. "Perfect" was redefined to *zero first-try mistakes* (otherwise every completion is perfect).

**Shipped this pass:**
- `src/lib/lessonMastery.ts` — qid tagging, re-queue, completion gate, first-try accuracy (unit-simulated, all cases pass).
- `src/lib/lessonBank.ts` — `resolveLessonSteps()` picks one variant per slot, seeded per `user+lesson+attempt`, with a local anti-repeat seen-set; `nextAttemptNo()` drives repeat variety.
- `src/data/content.ts` — `QuestionSlot` / `QuestionVariant` / `layout` types; `conceptId` on question steps.
- `src/data/banks/` + `applyBanks.ts` — bank registry merged as the last content-pipeline step.
- `src/lib/spaced-repetition.ts` — `recordConceptResult()`; a lesson miss resets the concept's SM-2 interval to 1 day so it resurfaces (wired into the answer handler).
- Pilot bank `money-basics/lesson-1`: 4 slots × 3 hand-authored SA variants; new `money-functions` concept.
- `docs/QUESTION-VOICE-GUIDE.md` — the quality bar for all authored questions.
- Full project `tsc --noEmit` passes.

**Not done yet (deliberate):**
- SR *weighting of selection* (due/weak concepts more likely to be picked). Resurface currently works through the review system + within-session re-queue; biasing selection is a clean follow-up in `resolveLessonSteps`.
- Authoring the remaining ~198 lessons into banks — the real, ongoing work.

---

## 1. The problem, stated precisely

Today every user sees the **identical questions in every lesson**. Content is static (`src/data/content*.ts`, ~199 lessons / ~1,200 answerable questions), assembled once as `CONTENT_DATA = applyReinforcement(mergeContentExtras(RAW_COURSES))` and rendered by `LessonView.tsx`. The only variation is `shuffleLessonSteps()` in `src/lib/lessonShuffle.ts`, which reorders the *options inside* a question but never changes the question itself.

We want: two users doing the same lesson rarely get the same questions, and repeating a lesson yields different questions — **without difficulty drifting**.

### Two corrections that shape the whole design

1. **"Change the values, difficulty stays constant" is not automatic.** Randomising numbers moves difficulty. `10% of R100` is mental arithmetic; `17% of R340` needs a calculator. Distractor choice moves the correct-rate more than the concept does. Difficulty invariance has to be *engineered* (constrained value ranges, round-number rules, rule-based distractors) and then *verified empirically* — it cannot be asserted.

2. **~76% of our questions have no values to change.** Only ~243 of ~1,000 question lines are numeric (contain a Rand amount or `%`). The rest are conceptual ("which is NOT a function of money?", true/false on ideas). Parameterisation does nothing for those. **The primary variety mechanism must be an authored pool of variants**, with numeric templates as a secondary mechanism for the ~24% that support it.

**Consequence:** the dominant cost here is content authoring, not code. Rough target for "rarely repeats a 5-question lesson" is ~3 variants per slot ≈ 3,000–5,000 questions total. The engineering below is the cheap part; it exists to make that authored content selectable, fresh, and measurable.

### What already exists that we reuse
- **SM-2 spaced repetition** is already built: `concept_mastery` table (`interval_days`, `ease_factor`, `repetitions`, `next_review_date`) keyed by `(user_id, concept_id)`, driven by `src/lib/spaced-repetition.ts`. **But it only feeds the standalone review cards in `concepts.ts` (`CONCEPTS[].reviewCard`) — lesson questions are not connected to it.** We connect them.
- **Seeded, resume-safe PRNG** (`FNV-1a` + `mulberry32`) already in `lessonShuffle.ts`. Reused for selection so we don't invent a second RNG.
- **`CONCEPTS[].id` slugs** (e.g. `inflation`, `compound-interest`) — the tag we hang everything off.

### What's missing (the actual gaps)
- **No stable question IDs.** Questions are positional (`lessonState.steps[stepIndex]`). A pool, a resume, and per-question logging all need stable IDs.
- **No per-question logging.** `user_progress` tracks lesson completion, XP, hearts, streaks — never *which question* nor *right/wrong*. Without this, "difficulty must not change" is unfalsifiable.
- **No link from lesson questions → concepts.** Needed for the spaced-repetition weighting.

---

## 2. Data model

### Principle: a *variant is a `LessonStep`*
The renderer already knows how to draw every `LessonStep` type. So a variant reuses that exact union — the selection layer resolves slots down to a plain `LessonStep[]` and everything downstream (renderer, `shuffleLessonSteps`, hearts, XP) is unchanged.

```ts
// src/data/content.ts — additive, backward compatible

/** A question position within a lesson, holding interchangeable variants. */
export type QuestionSlot = {
  slotId: string;            // stable, unique in-lesson, e.g. "money-basics/lesson-1/q3"
  conceptId?: string;        // → CONCEPTS[].id → concept_mastery (SM-2 weighting)
  difficulty: 1 | 2 | 3;     // authored band; MUST be identical for every variant in the slot
  variants: QuestionVariant[];
};

export type QuestionVariant =
  | { variantId: string; kind: "static"; step: OptionStep | TrueFalseStep | FillBlankStep }
  | { variantId: string; kind: "template"; template: NumericTemplate };

/** Lessons keep legacy `steps` OR use `slots`. Non-question steps (info/action)
 *  stay inline; only answerable positions become slots. */
export type Lesson = {
  id: string;
  title: string;
  comingSoon?: boolean;
  steps?: LessonStep[];              // legacy — still valid
  layout?: (LessonStep | { slotRef: string })[]; // new: interleave info steps + slot refs
  slots?: QuestionSlot[];            // new: the bank for this lesson
};
```

`OptionStep`, `TrueFalseStep`, `FillBlankStep` are the existing members of the `LessonStep` union (just named). Nothing in the union changes, so existing lessons compile untouched.

### Numeric templates (the ~24% case)
```ts
export type NumericTemplate = {
  variantId: string;
  difficulty: 1 | 2 | 3;                         // must equal the slot's difficulty
  params: Record<string, { min: number; max: number; step: number; nice?: boolean }>;
  build: (v: Record<string, number>) => { question: string; answer: number };
  distractors: (answer: number, v: Record<string, number>) => number[]; // rule-based, not random
  format?: (n: number) => string;               // e.g. Rand formatting
};
```
Guardrails that keep difficulty constant across draws:
- **Constrained ranges + `step`** so values stay in the same arithmetic class (e.g. percentages ∈ {5,10,15,20}, never 17).
- **`nice: true`** forces round answers where the authored intent is mental math.
- **Rule-based distractors** (e.g. "off by the interest term", "simple instead of compound") so wrong options are consistently plausible — random distractors are the single biggest difficulty leak.

### Stable IDs are Phase 0, not optional
`slotId` and `variantId` must be authored and immutable. They are the join key for logging, the anti-repeat memory, and the seed. Renaming one silently resets its difficulty history.

---

## 3. Selection algorithm

Deterministic per `(user, lesson, attempt)` so a refresh mid-lesson resolves to the *same* questions (the same reason `lessonShuffle` is seeded — its own comment notes "saved answers are stored BY INDEX", so resolution must be stable within an attempt).

```
resolveLessonSteps(lesson, { userId, attemptNo, seenBySlot, mastery }):
  seed = FNV1a(`${userId}:${lesson.id}:${attemptNo}`)
  rng  = mulberry32(seed)              // reuse lessonShuffle primitives
  for each slot in lesson.slots:
     pool = slot.variants
     # 1. anti-cheat / anti-repeat: drop variants seen in the last K attempts
     fresh = pool.filter(v => !seenBySlot[slot.slotId]?.includes(v.variantId))
     if fresh.length == 0: fresh = pool            # exhausted → allow reuse
     # 2. spaced-repetition weight (the "retention" half)
     weight(v) = slot.conceptId && isDue(mastery[slot.conceptId]) ? 2.0 : 1.0
     #   isDue = next_review_date <= today OR ease_factor < 2.0 (struggling)
     chosen = seededWeightedPick(fresh, weight, rng)
     step   = chosen.kind == "template" ? generate(chosen.template, rng) : chosen.step
     emit { ...step, __slotId, __variantId }        # carry IDs for logging
  return shuffleLessonSteps(emitted, seed)          # existing option-shuffle, unchanged
```

- **`attemptNo`** comes from a per-lesson counter (see §5). Bumping it is what makes a *repeat* look different.
- **`seenBySlot`** is a capped per-user memory of recent `variantId`s (last K attempts). Source: local per-device set reconciled from `question_attempts` on load — cheap, and screenshot-defeating without a server round-trip per question.
- **Weighting = "both equally":** freshness comes from the anti-repeat filter; retention comes from doubling the odds of a variant whose concept is *due or shaky* in `concept_mastery`. This finally connects lesson play to the SM-2 engine you already run.

**Difficulty is not a selection input** — every variant in a slot shares one authored band, so any pick is equal-difficulty *by construction*. §4 verifies that construction held.

---

## 4. Difficulty logging & the invariant (do this first)

"Difficulty must not change" is an empirical claim: it is `P(correct)` across users. You measure it or you don't have it. New table:

```sql
-- supabase/migrations/XXXX_question_attempts.sql
create table public.question_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   text not null,
  lesson_id   text not null,
  slot_id     text not null,
  variant_id  text not null,
  concept_id  text,
  attempt_no  int  not null default 1,
  is_correct  boolean not null,
  answered_at timestamptz not null default now()
);
alter table public.question_attempts enable row level security;
create policy "own rows" on public.question_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.question_attempts (variant_id);
create index on public.question_attempts (user_id, lesson_id);
```
Matches existing conventions (uuid PK, RLS on, `auth.uid()` check) used across your other tables.

**Difficulty-invariant check** — a variant is out of band if its correct-rate strays from its slot's mean once it has enough samples:
```sql
select slot_id, variant_id,
       count(*)                                    as n,
       avg(is_correct::int)                        as p_correct,
       avg(is_correct::int)
         - avg(avg(is_correct::int)) over (partition by slot_id) as delta_vs_slot
from question_attempts
group by slot_id, variant_id
having count(*) >= 50;
-- Flag |delta_vs_slot| > 0.10 for re-authoring. That is the ONLY real enforcement.
```

**Author-time guard** — extend the existing `src/data/__tests__/contentQuality.test.ts`:
- every `QuestionSlot` has ≥2 variants (≥3 for free/early and RE5 lessons),
- all variants in a slot declare the **same** `difficulty`,
- every numeric template's `params` produce answers within one arithmetic class.

Ship this table + logging in Phase 0 **before** authoring variants, so real difficulty data is already accumulating when you calibrate.

---

## 5. Touch points in the current code

| Concern | Where | Change |
|---|---|---|
| Resolve slots → steps | new `src/lib/lessonBank.ts` | `resolveLessonSteps()`; called where `LessonView` first loads a lesson, *before* `shuffleLessonSteps` |
| Attempt number | `useProgress.ts` / `user_progress` | add per-lesson attempt counter (jsonb map `{lessonId: n}`), bumped on lesson start |
| Log answers | `LessonView` answer handler | insert one `question_attempts` row per answered slot (batch on lesson complete to save writes) |
| SR weighting | `src/lib/spaced-repetition.ts` | expose `isDue(conceptId)`; feed mastery map into `resolveLessonSteps` |
| Resume safety | `LessonView` saved-answer key | scope stored answers to `(lessonId, attemptNo)` so a new attempt doesn't restore stale index answers |

The **resume-key change is a correctness bug waiting to happen**: answers are keyed by step index; if a repeat resolves different variants at the same index, old answers must not restore. Scope the key to `attemptNo` (or the selection seed).

---

## 6. Phased rollout

- **Phase 0 — plumbing, no content change.** Add `slotId`/`variantId` support + `resolveLessonSteps` (pass-through for legacy `steps`). Ship `question_attempts` + logging + attempt counter. *Outcome: difficulty data starts flowing immediately; zero user-visible change.*
- **Phase 1 — pilot the pool.** Convert `money-basics` unit 1 to slots with 2–3 authored variants each, tagged with `conceptId`. Wire SR weighting. Validate freshness + resume on repeats.
- **Phase 2 — numeric templates.** Add templates with guardrails for the ~24% numeric slots (interest, inflation, budgeting %). Watch `delta_vs_slot`.
- **Phase 3 — calibrate & harden.** Use collected `p_correct` to prune/fix outlier variants. Deepen pools where screenshot-sharing hurts most (**RE5 exam prep** — largest integrity risk, likely wants 5+ variants/slot).

---

## 7. Open questions / risks

1. **Authoring throughput is the bottleneck, not code.** 3,000–5,000 questions is a program of work. Decide: hand-authored, template-generated, or LLM-assisted drafting with human review (and if LLM-assisted, every draft still needs the difficulty guard in §4).
2. **Spaced repetition vs "always different" pull in opposite directions.** Getting a hard item *again* is sometimes the point. The SR weighting resolves this deliberately — don't "fix" it by forcing pure novelty.
3. **Anti-repeat memory source** — local per-device set (cheap, resets on new device) vs querying `question_attempts` (accurate, one read per lesson load). Recommend local, reconciled on load.
4. **Concept tagging is manual.** Only some concepts have slugs today; slots need `conceptId`s authored to benefit from SR weighting.
5. **"Perfect lesson" / hearts** must key off the *resolved* attempt, not the slot definition — verify XP and perfect-streak logic after resolution.
6. **Content lives in TS, not the DB.** This design keeps it that way (only the attempt log is in Postgres). If authoring moves to a CMS/DB later, `slotId`/`variantId` remain the stable contract.
