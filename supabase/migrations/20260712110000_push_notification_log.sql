-- Push re-engagement dedupe log.
--
-- Every smart push (streak-at-risk, coach alert, leaderboard defence) writes
-- a row here keyed by (user_id, key) BEFORE sending. The unique constraint
-- makes sends idempotent: re-running the cron can never double-notify.
-- Keys look like: "streak:2026-07-12", "over-budget:food:2026-07",
-- "rank:2026-W28".

CREATE TABLE IF NOT EXISTS public.push_notification_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS push_notification_log_user_idx
  ON public.push_notification_log (user_id, sent_at DESC);

-- Service-role only: RLS enabled with no policies denies all client access.
ALTER TABLE public.push_notification_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.push_notification_log IS
  'Dedupe ledger for smart push notifications. Written by the push-triggers cron via service role; no client access.';
