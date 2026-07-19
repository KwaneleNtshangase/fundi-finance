# Data Safety & Sync Invariants

How Notho guarantees user progress is never lost, changed, or leaked —
across devices, sessions, and app updates. Enforced as of 2026-07-19
(migration `20260719090000_sync_stats_and_atomic_claims`).

## Source of truth

`user_progress` in Supabase is authoritative for everything durable: XP
(lifetime + spent), completed lessons, streaks, hearts, perfect-lesson count,
daily XP/lesson counters, weekly XP, weekly challenge progress, and claims.
localStorage is only a per-user, write-through cache plus a durable retry
queue. Any device can be wiped at any time and lose nothing but unsynced
minutes.

## Merge rules (why devices can't clobber each other)

Nothing client-side ever writes an absolute snapshot of progress. Writes are:

- **Deltas** — XP, daily/weekly XP, lessons-today, perfect count go through
  `apply_progress_delta` (`col = col + delta`). Failed writes are queued in
  localStorage (`notho-pending-xp-<uid>`) and flushed exactly once; the queue
  is claimed before the network call and re-queued on failure, and a Web Lock
  stops two tabs flushing the same queue.
- **Unions** — `completed_lessons` only grows (server-side `ARRAY_AGG(DISTINCT)`).
  A device can heal missing lessons into the DB but can never shrink it.
- **GREATEST / union merges** — `longest_streak`, weekly challenge counters
  (`merge_weekly_stats`): counters take the max, day sets take the union.
- **Atomic claims/spends** — weekly challenge rewards (`claim_weekly_challenge`)
  and XP spends (`spend_xp`) lock the row; a second device racing the same
  claim gets `already_claimed` and no XP.
- **Period rollovers** — weekly/daily counters reset only when a strictly
  NEWER week/day key arrives; stale devices can't resurrect old periods.

## Session survival

Mid-lesson position (step, answers, correct count) is saved to
`notho-lesson-progress` on every step, restored on refresh/relaunch/deep
link, honoured for 7 days, and cleared on finish. The lesson page re-inits
from content when the URL and in-memory state disagree.

A device that stays open refetches the authoritative row on focus,
visibility, and network-reconnect (throttled to 15s), so progress made on
another device appears without a restart.

## Account isolation on shared devices

Non-user-scoped legacy keys (hearts, daily counters, challenge claims,
onboarding flags, mid-lesson save) are wiped when a *different* account signs
in (`notho-last-uid` sentinel). Per-user keys (`…-<uid>`) are untouched.

## Reset actually resets

`resetProgress` clears the per-user cache, pending-delta queue, weekly stats
and ephemeral keys BEFORE zeroing the server row. Previously the stale cache
re-unioned old lessons into the DB on the next load — resets silently undid
themselves.

## App-update rules (the checklist)

1. **Migrations are additive.** No `DROP TABLE/COLUMN`, no `TRUNCATE`, no
   `DELETE` of user rows, no type narrowing. Replacing a deployed RPC must
   keep the old call shape working (new params get `DEFAULT`s; drop+create in
   one transaction).
2. **Old clients keep working.** Deployed app versions call RPCs with the old
   argument set — verify the new signature accepts it before applying.
3. **Cache parsing is tolerant.** New fields in cached JSON default safely;
   unknown fields are ignored. Never throw on old cache shapes — parse
   failures fall back to the server row, not to data loss.
4. **Local queues survive updates.** The pending-delta queue reader accepts
   the previous shape (missing fields → 0). Never rename queue/cache keys
   without a read-old-write-new migration.
5. **Lesson IDs are forever.** `completed_lessons` stores `courseId:lessonId`.
   Renaming either orphans completions. If content must be restructured, add
   an ID remap, don't rename in place.
6. **One-time local→server adoptions are gated.** Legacy device-local values
   (e.g. perfect-lesson count) are adopted only after the first server load
   and only when the server value is 0 — a second device can't inflate it.
7. **Before deploy:** `npx tsc --noEmit`, `npm run test:unit`, `npm run build`,
   `npm test` (e2e), and Supabase security advisors after any DDL.
8. **Backups:** keep Supabase PITR/daily backups enabled on the production
   project so any migration mistake is recoverable.
