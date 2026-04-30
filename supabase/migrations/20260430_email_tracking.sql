-- ============================================================
-- Email Tracking Migration
-- Adds last_lesson_at to user_progress for D+1 retention email.
-- Sets up hourly pg_cron job that calls the send-email edge function.
-- ============================================================

-- Track the exact timestamp of a user's most recent lesson completion.
-- Updated by the app whenever completeLesson() fires.
-- Used by the D+1 email cron: send retention email if NOW() - last_lesson_at > 20h
-- and 'd1' is not already in profiles.retention_fired.
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS last_lesson_at TIMESTAMPTZ DEFAULT NULL;

-- ── Hourly cron job ──────────────────────────────────────────
-- Calls the send-email edge function with {"type":"d1-batch"}.
-- Requires: pg_cron + pg_net extensions (both enabled by default on Supabase).
-- The edge function URL is: https://bcwoyhypupuezgcbwqfy.supabase.co/functions/v1/send-email
-- The Authorization header uses the service role key (set as SUPABASE_SERVICE_ROLE_KEY env var).
-- ─────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'd1-retention-emails',   -- job name (unique)
  '0 * * * *',              -- every hour on the hour
  $$
  SELECT net.http_post(
    url     := 'https://bcwoyhypupuezgcbwqfy.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{"type":"d1-batch"}'::jsonb
  );
  $$
);

-- NOTE: After applying this migration, set the Postgres config variable:
--   ALTER DATABASE postgres SET app.service_role_key = '<your-service-role-key>';
-- OR store the service role key in Supabase Vault and reference it here.
-- The edge function itself also reads SUPABASE_SERVICE_ROLE_KEY from env vars (set in dashboard).
