-- ============================================================
-- Retire the Supabase edge-function email crons.
--
-- Lifecycle emails (welcome, d1, d7/d14/d30) now run from the Next.js app:
--   - welcome  -> POST /api/welcome-email (called from onboarding)
--   - d1 + d7/d14/d30 -> Vercel Cron GET /api/cron/lifecycle (daily)
--
-- Unscheduling the old jobs stops the legacy send-email edge function from
-- firing so users only get the new, branded emails (no double-sends).
-- Idempotent: safe to run even if the jobs are already gone.
-- ============================================================

DO $$ BEGIN
  PERFORM cron.unschedule('drip-milestone-emails');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('d1-retention-emails');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
