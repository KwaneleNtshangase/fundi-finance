-- Report snapshots (report v2, Phase 4).
--
-- One row per (user, report period), upserted every time a report is
-- generated or viewed. Powers:
--   * score history / trends without recomputing every month,
--   * green-month and score-up streaks,
--   * "last report's mission" follow-through (did the top action's metric
--     actually move?).
--
-- `metrics` is the JSONB ReportSnapshotMetrics shape (see
-- src/lib/budget/report/types.ts). It embeds an entries/targets fingerprint;
-- when the underlying transactions change (recategorised, deleted, imported),
-- the fingerprint stops matching and the month is recomputed - a snapshot can
-- never serve stale numbers.

CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  metrics      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS report_snapshots_user_period_idx
  ON public.report_snapshots (user_id, period_end DESC);

-- Service-role only: RLS enabled with no policies denies all client access.
-- Reads and writes happen exclusively in the report API routes.
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.report_snapshots IS
  'Per-period report metric snapshots (health score, savings rate, top action). Written by /api/budget/report and /api/budget/report/history via service role; no client access.';
