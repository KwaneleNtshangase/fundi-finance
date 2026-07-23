# Notho — Lesson Banks Work: Handoff for Next Chat

Paste this whole file into a new chat to continue. It is self-contained.

## What this project is
**Notho** (Vercel project `fundi-finance`) — a Duolingo-style South African
personal-finance learning app. **Next.js (App Router) + Supabase.**
Working folder: `/Users/KwaneleNtshangase/Developer/notho`.

## The goal of this work stream
Give **every lesson a "lesson bank"** so:
- Two users doing the same lesson rarely get identical questions, and repeating a
  lesson yields different questions (like Duolingo).
- All questions are **premium, hand-written**, SA-accurate, in a plain concrete
  voice — **no AI-lazy filler**, plausible distractors, one defensible answer.
- Spaced repetition resurfaces hard/missed questions; a lesson isn't complete
  until every question is answered correctly (mastery loop).
- **Uniform premium coverage — every lesson is a bank, no gaps/holes.**

## Architecture (key files)
- **Bank data:** `src/data/banks/*.ts` — one file per course, plus
  `<course>-extra.ts` for that course's extra lessons. Each exports
  `{COURSE}_BANKS: Record<"courseId::lessonId", { layout, slots }>`.
  All registered in `src/data/banks/index.ts` (import + spread into `LESSON_BANKS`).
- **Types** (`src/data/content.ts`): a bank lesson has `layout`
  (`LessonLayoutItem[]` = `info` steps + `{ slot: slotId }` refs) and `slots`
  (`QuestionSlot[]`, each `{ slotId, conceptId, variants: [{ variantId, step }] }`).
  `step` is an mcq / scenario / true-false / fill-blank (fill-blank answer is numeric).
- **`src/data/applyBanks.ts`**: attaches `layout`+`slots` to any lesson whose
  `${course.id}::${lesson.id}` key matches a bank. Runs last in the content pipeline
  (`applyBanks(applyReinforcement(mergeContentExtras(ALL_COURSES)))`).
- **`src/lib/lessonBank.ts`** (Cursor's file — don't edit): `resolveLessonSteps()`
  picks one variant per slot (seeded, anti-repeat). Also `resolveLegacyLessonSteps()`
  — legacy (non-bank) lessons with 5–10 questions show a seeded **4-of-N per attempt**
  (LEGACY_SHOW=4, LEGACY_MAX=10), so no lesson shows identical questions on replay.
  Lessons with >10 questions (the 2 RE5 mock exams) are left whole.
- **`src/lib/lessonMastery.ts`** (Cursor's): Duolingo re-queue / mastery.
- **`src/data/concepts.ts`**: `CONCEPTS` with `reviewCard`s (spaced-repetition). Every
  slot's `conceptId` must exist here.
- **Logging:** `src/lib/questionAttempts.ts` + migration
  `supabase/migrations/20260722120000_question_attempts.sql` (table + RLS **live on
  remote**; migration history is drifted — fix with
  `npx supabase migration repair --status applied 20260722120000`).

## Hard rules (enforced by `src/data/__tests__/contentQuality.test.ts`)
- Every `slotId` and `variantId` **globally unique**. Use a per-file variantId
  prefix (e.g. `mbx-` for money-basics-extra).
- Every slot has a `conceptId` that **exists in CONCEPTS**, and **≥2 variants** (use 3).
- Every lesson has **>3 questions** (banks use 4 slots → 4 questions).
- Voice: plain, concrete, SA context (rands, SARS, local names/examples), empathetic;
  distractors plausible; exactly one defensible correct answer. Option **positions are
  shuffled at render**, so `correct: 0` in data is fine (don't worry about index bias);
  but avoid making the correct option the longest.

## Accuracy mandate — verify EVERY SA figure
Source of truth: **`docs/SA-REGULATORY-FIGURES.md`** (web-verified July 2026, 2026/27).
Current figures to use:
- TFSA **R46,000/yr**, **R500,000 lifetime**; over-contribution penalty 40%.
- RA/retirement deduction **27.5%**, annual cap **R430,000** (2027 tax year, from
  1 Mar 2026; was R350k for 2026 — **use R430k**).
- Income-tax threshold (under 65) **R99,000**; primary rebate R17,820.
- CGT: **40%** inclusion, **R50,000** annual exclusion, **R3,000,000** primary-residence
  exclusion, ~18% effective max.
- Estate duty **20%** to R30m / **25%** above; **R3.5m** abatement (portable to R7m);
  executor fee max 3.5%+VAT; donations-tax annual exemption R100k.
- Two-pot: 1/3 Savings, 2/3 Retirement; **R2,000** min withdrawal, once per tax year,
  taxed as income. Company tax **27%**; dividends withholding **20%**; VAT **15%**,
  compulsory reg > **R1,000,000** turnover; provisional tax if non-salary income > R30,000.
- Foreign employment exemption (s10(1)(o)(ii)) **R1.25m** (183/60-day rule); residence-based
  worldwide taxation; s6quat credits.
- Reg 28 offshore limit **45%**; personal SDA **R2m/yr** + FIA **R10m/yr** (SARS clearance).
- FAIS Ombud award cap **R3.5m** (from 1 Jul 2024); complaint: FSP 6 weeks, then 6 months to
  Ombud, 3-year prescription. FICA records 5 years; no tipping off.
- Debit-order dispute window **60 days** (from 13 Apr 2026). Ombud = **National Financial
  Ombud (NFO)**, 0860 800 900 (the old Banking/Credit/Insurance ombudsmen are outdated).
- Medical scheme fees credit **R376** member / **R376** first dependant / **R254** each more.
- SBC (small business corp) tax table: **flagged unverified** — do NOT quote the exact
  R95,750 0% band; describe SBC as "reduced graduated rates, turnover < R20m" instead.

## Verification workflow (this sandbox can't run build/vitest — they OOM)
- Run `npx tsc --noEmit` after each batch.
- Run a tsx audit (recreate the pattern used all session): checks orphan bank keys,
  broken slot-refs, duplicate slot/variant IDs, conceptId existence, ≥2 variants,
  under-4-question lessons, and legacy lessons still <5 questions.
- **Cursor** runs the real `npm run build` + `npx vitest run` (currently **240/240 pass**).
- **AG** does read-only QA.

## Division of labour
- **Content agent (you):** author `src/data/banks/**` + `src/data/concepts.ts` and edit
  content data files. Reuse existing concepts; add new ones as needed.
- **Cursor:** owns `src/lib/**` (lessonBank, lessonMastery), tests, page.tsx, migration —
  has the working build/test env. Don't edit its files.
- **AG:** read-only QA reviews.

## Progress so far (end of this chat)
- **22 courses fully bank-backed** (all core lessons): **119 premium bank lessons, 476
  slots, ~130 concepts, 1,428 hand-written variants.**
- Legacy rotation live → no lesson shows identical questions on replay anywhere.
- 2 RE5 mock exams (50Q each) intentionally whole.
- All green: tsc ✅, audit ✅ (0 orphan/broken/dup/bad-concept), Cursor build ✅ +
  vitest 240/240 ✅. `question_attempts` table + RLS live on remote.
- Fixed this session: RA cap made uniform **R430k** everywhere (was inconsistent R350k/R430k);
  2 weak-distractor slots tightened (`sa-investing/lesson-3/fica`,
  `property/lesson-1/affordability-first`).

## REMAINING WORK — the task to finish
**Upgrade the ~84 remaining "extra" lessons to premium banks** (they currently work via
rotation but aren't premium). **Done: money-basics (8) → `src/data/banks/money-basics-extra.ts`.**

Remaining by course (create `<course>-extra.ts`, register, verify per batch):
- **salary-payslip (7):** lesson-13th-cheque, lesson-ctc, lesson-tax-return-employee,
  lesson-salary-tax-efficiency, lesson-payslip-errors, lesson-medical-aid-payslip,
  lesson-applied-read-payslip
- **banking-debit (5):** lesson-savings-accounts-sa, lesson-credit-vs-debit-cards,
  lesson-bank-switching, lesson-overdraft, lesson-international-transfers
- **credit-debt (10):** lesson-debt-avalanche, lesson-credit-score-building,
  lesson-debt-counselling, lesson-reckless-lending, lesson-car-finance, lesson-home-loan-debt,
  lesson-buy-now-pay-later, lesson-credit-score-mechanics, lesson-rebuild-credit-score,
  lesson-applied-loan-trap
- **emergency-fund (1):** lesson-applied-emergency-fund-build
- **investing-basics (9):** lesson-etfs-deep-dive, lesson-unit-trusts, lesson-dollar-cost-averaging,
  lesson-investment-scams, lesson-property-as-investment, lesson-investment-fees,
  lesson-bonds-mechanics, lesson-bond-interest-rate-risk, lesson-applied-thabo-investment
- **sa-investing (2):** lesson-asset-allocation, lesson-rebalancing
- **property (1):** lesson-applied-buy-or-rent
- **taxes (5):** lesson-irp5-tax-certificates, lesson-donations-estate-tax, lesson-tax-on-investments,
  lesson-efiling-walkthrough, lesson-applied-sars-assessment
- **scams-fraud (4):** lesson-advance-fee-fraud, lesson-vishing-scams, lesson-whatsapp-scams,
  lesson-applied-whatsapp-scheme
- **bible-money (8):** lesson-contentment, lesson-planning-proverbs, lesson-work-ethic,
  lesson-avoiding-surety, lesson-tithing, lesson-wealth-eternity, lesson-financial-integrity,
  lesson-generosity-kingdom  (verify NLT scripture verbatim, as done for the core Bible course)
- **money-psychology (7):** lesson-hedonic-adaptation, lesson-mental-accounting-2,
  lesson-confirmation-bias, lesson-loss-aversion, lesson-mental-accounting,
  lesson-overconfidence-recency, lesson-applied-sunk-cost-investing
- **retirement (5):** lesson-ra-vs-pension-comparison, lesson-retirement-age, lesson-annuity-types,
  lesson-post-retirement-healthcare, lesson-estate-planning-retirement
- **rand-economy (8):** lesson-offshore-investing-mechanics, lesson-petrol-price-rand,
  lesson-how-to-hedge-rand, lesson-sarb-intervention, lesson-sa-trade-balance,
  lesson-repo-rate-explained, lesson-mpc-and-inflation, lesson-applied-repo-rate-impact
- **crypto-basics (5):** lesson-blockchain-explained, lesson-bitcoin-vs-ethereum,
  lesson-sa-crypto-exchanges, lesson-defi-risks, lesson-crypto-sars-tax
- **business-finance (7):** lesson-cash-flow-business, lesson-invoicing-debtors,
  lesson-business-bank-accounts, lesson-cipc-registration, lesson-business-insurance,
  lesson-growth-financing, lesson-applied-cashflow-profit

## Recipe to bank a course's extras
1. **Read the source content** for those lessons: `src/data/content-extra.ts` (arrays like
   `SALARY_EXTRA`, `CREDIT_DEBT_EXTRA`, `PSYCHOLOGY_EXTRA`, `BIBLE_MONEY_EXTRA`, etc.),
   `src/data/content-applied.ts` (the `lesson-applied-*` lessons), and rand-economy also
   uses `REPO_RATE_LESSONS` + `APPLIED_RAND_ECONOMY_LESSONS`. Match each new bank to the
   lesson's existing sub-topics and difficulty.
2. **Create `src/data/banks/<course>-extra.ts`.** Copy the helper pattern from
   `money-basics-extra.ts` (`info()` + `L()` helpers). Per lesson: **4 slots × 3 variants**,
   varied types (mcq/true-false/scenario, + a numeric fill-blank where natural). Reuse
   existing concepts; add new ones to `concepts.ts`. Use a unique variantId prefix per file.
3. Key each bank exactly `"<courseId>::<lessonId>"` (the ids listed above).
4. **Register** in `src/data/banks/index.ts` (import + spread).
5. **Verify:** `npx tsc --noEmit` + the tsx audit. Fix dup ids / missing concepts.
6. For figure-heavy courses (taxes, retirement, rand-economy, crypto, business-finance)
   verify every number against `docs/SA-REGULATORY-FIGURES.md` or a live search.
7. Note: banking a lesson **supersedes** its legacy steps at render, so any stale figure in
   the legacy step no longer shows — but keep the bank itself correct.

## Deploy (Cursor prompt — I can't push from the sandbox)
```
On the notho repo (main), the working tree has ~31 uncommitted files: all lesson-bank
content (src/data/banks/**, applyBanks.ts, concepts.ts, content-*.ts), src/lib
(lessonBank/lessonMastery/questionAttempts), tests, docs, and the question_attempts
migration. tsc + build + vitest (240/240) all pass on this tree. Please:
  git add -A
  git commit -m "feat(content): premium lesson banks for 22 courses + legacy rotation + question_attempts logging"
  git push origin main
This triggers the fundi-finance Vercel production deploy. Confirm it goes green.
If the CI 'health check branding assertion' fails (it did on commit 0c8042f), report the
error — do NOT revert the content to fix it.
```

## Handy commands
- tsc: `npx tsc --noEmit`
- audit: recreate the tsx script (see any prior message) — checks orphan keys, broken
  slot-refs, dup slot/variant ids, conceptId existence, ≥2 variants, question counts.
- coverage snapshot: count `LESSON_BANKS` keys vs total lessons in `CONTENT_DATA`.
