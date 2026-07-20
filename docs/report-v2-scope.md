# Fundi Budget Report v2 — Scope

**From "a report that shows everything it computed" → "a coach that answers three questions."**

Every reviewer (ChatGPT, Gemini, Claude, grok) converged on the same verdict: the engine is world-class, but the *delivery* now works against behaviour change. The report is exhaustive when it should be decisive. This document scopes the redesign that turns it from a financial statement into a financial coaching product.

The guiding frame, which every page must serve:

1. **How did I do?**  2. **Why?**  3. **What should I do next?**

Everything else is an appendix.

---

## 1. What the reviewers asked for (the mandate)

| Theme | Who raised it | Essence |
|---|---|---|
| Executive-summary-first | ChatGPT, Gemini, grok, Claude | 1–2 page default (score, biggest win, biggest risk, one action); detail behind progressive disclosure. |
| Score history & trend | ChatGPT, grok, Claude | "68 → 74 → 81", "▲ +6 since last report". Trends motivate more than absolute scores. |
| Behavioural / money-personality insights | ChatGPT, grok | Patterns, not pie charts: "you spend most on Fridays", "you save right after payday", "You're a Saver". |
| What-if modelling | ChatGPT, grok, Claude | "Cut transport 10% → score 81→83, +R2,900/yr, shortfall −R5,000." |
| One challenge, opportunity scores, framing | ChatGPT, grok | End with a single mission; rank categories by leverage; loss/identity framing. |

None of this is new *computation* — it's new *sequencing, persistence, and pattern detection* on top of the engine we already trust.

---

## 2. Data foundation — what we have vs. what we need

**We have (enough to start today):**
- Full transaction history per user in `budget_entries` (date, category, amount, type, is_transfer, account) — the one active user has months of it.
- `budget_targets`, `custom_budget_categories`, `user_progress` (streaks/XP already exist).
- A deterministic, reconciling report engine: `buildReport()` → `computeReportInsights()`, runnable for **any** period via `resolvePeriod()`.

**The key unlock:** score history does **not** require new storage for v1. We can **retro-compute** a report for each of the last 6–12 months from the transactions we already have, and read the score series straight off the engine. Persistence (Phase 4) is an optimisation, not a prerequisite.

**What we don't have yet:**
- A snapshot/history table (`report_snapshots`) — no `report_history`/`health_score` migration exists.
- A shared, standalone scoring function — scoring currently lives inline inside `computeReportInsights`. It needs extracting so report + history + what-if all score identically (single source of truth).
- A behavioural-pattern module.

---

## 3. Phased plan

Ordered by (impact ÷ risk). Each phase ships independently and is deployable on its own.

### Phase 1 — Executive summary + real score history  ⭐ start here
**Why first:** biggest perceived leap, lowest risk, immediately uses the one user's data, reuses the engine wholesale.

- **Restructure the narrative** into progressive disclosure:
  - **Snapshot (1 page / first screen):** big score + trend arrow, one-line verdict ("You're building good habits, but one decision pushed you into a deficit"), the 4 key metrics, **one** biggest win, **one** biggest risk, **one** next action.
  - **Coach Cosmo (1 page):** the narrative — what happened, why, what to change first.
  - **Appendix:** the existing detail pages (full budget table, categories, merchants, month-by-month) — collapsed by default in the interactive report, moved to the back of the PDF.
- **Score history:** new `GET /api/budget/report/history` that runs `buildReport` for the last N months and returns `[{ month, healthScore, savingsRatePct, netCents, unclassifiedPct }]`. Render a sparkline + "▲ +6 vs last month" on the snapshot.
- **Transparency:** show what added/subtracted points ("Low debt +20, Cash-flow deficit −19") — reviewers all wanted the score to explain itself.
- **Effort:** M · **Risk:** Low (no engine changes; additive endpoint + layout).

### Phase 2 — Behavioural insights & money personality
**Why:** this is the differentiator — "people change patterns, not pie charts."

- New pure module `src/lib/budget/report/behaviour.ts` (same POPIA/FAIS constraints as `insights.ts`: local, deterministic, educational, no product advice). Detects, with confidence gating so it never fabricates from thin data:
  - spending-by-weekday concentration; end-of-month spikes; save-after-income timing; category volatility month-to-month; subscription creep vs. eating-out; transport↔business correlation.
- **Money personality** derived only from *stable* signals across ≥3 months (Saver / Planner / Builder / Impulse Spender / Income-Maximiser), always shown with its evidence.
- **Effort:** M–L · **Risk:** Medium — reliability with sparse data. Mitigation: hard confidence thresholds; hide personality until enough history; "we're still learning your patterns" empty state. Refines automatically as more users/months arrive (exactly the "refine later" the brief anticipates).

### Phase 3 — What-if modelling (interactive report)
**Why:** the "wow" that no budgeting app does well.

- Extract scoring into a shared pure `scoreHealth(core)` (used by report, history, and here — one source of truth).
- Add a pure `simulate(model, changes)` that re-derives score, savings rate and 12-month effect from adjusted category amounts.
- In the interactive report: sliders on the top few *flexible* categories → live deltas ("Transport −10% → score +2, +R2,900/yr, shortfall −R5,000").
- **Effort:** M · **Risk:** Low–Medium (mostly the scoring extraction, which we want regardless).

### Phase 4 — Snapshots, streaks & challenges (persistence)
**Why:** makes trends cheap and unlocks habit mechanics.

- `report_snapshots` table (`user_id`, `period_start/end`, `metrics jsonb`, `created_at`) written when a report is viewed/generated.
- Enables: trends without recompute; "green-month streak"; "score up 3 reports running"; **monthly challenge tracking** — did they complete last period's single challenge? (ties into existing `user_progress`/XP for reward).
- **Effort:** M · **Risk:** Low.

---

## 4. Cross-cutting decisions

- **Single scoring source:** extract `scoreHealth()` before Phase 3 so report/history/what-if can never disagree. (Also fixes the class of "page A and page B use different definitions" bugs reviewers keep finding.)
- **PDF vs. app split:** PDF becomes the polished **2-page executive summary + appendix**; the rich, drill-down, what-if experience lives in the interactive report. The PDF is one output of the system, not the system.
- **PII (still open):** stokvel members' and lenders' real names appear in merchant lists. Recommend a "mask names when sharing/exporting" toggle (default off in-app, on for shared PDFs). Cheap to add; worth deciding before we market the shareable report.
- **Partial-month handling:** the exec summary should default to "last complete month" or an annualised view so an unsynced current month never leads with zeros.

---

## 5. Rough sizing & sequence

| Phase | Deliverable | Effort | Risk | Depends on |
|---|---|---|---|---|
| 1 | Exec summary + score-history endpoint + trend | M | Low | — |
| 3 | Shared `scoreHealth` + what-if sliders | M | Low–Med | scoring extraction |
| 2 | Behaviour module + money personality | M–L | Med | ≥3 months data |
| 4 | Snapshots + streaks + challenge tracking | M | Low | — |

**Recommended order: 1 → 3 → 2 → 4.** (History first for the visible leap; what-if next for the wow; personality once it's reliable; persistence last to make it all cheap and habit-forming.)

---

## 6. What we are deliberately NOT doing (yet)

- Peer/cohort comparison ("users like you save X%") — needs many users; revisit post-launch.
- Net-worth projection — needs asset/liability data we don't collect.
- AI-generated narrative — the deterministic engine is the trust anchor; keep AI to the optional chat tier.

---

## 7. Recommended first step

Build **Phase 1** against the existing user's data: the score-history endpoint (retro-computed from their transactions) plus the executive-summary restructure of the interactive report and PDF. It's low-risk, reuses everything we've validated, and delivers the single change reviewers rated highest — a report that leads with *how you did and what to do*, and shows your score **moving over time**.
