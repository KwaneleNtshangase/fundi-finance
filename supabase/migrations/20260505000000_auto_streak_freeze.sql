-- ============================================================
-- Auto Streak Freeze — nightly cron at 23:55 SAST (21:55 UTC)
--
-- For every user who:
--   • Has an active streak (streak > 0)
--   • Has at least 1 freeze token available
--   • Has NOT done a lesson today (last_activity_date < today in SAST)
--
-- We automatically consume 1 freeze token and stamp last_activity_date
-- to today so the streak survives to tomorrow.
-- Users never need to manually tap "Use Freeze" on a day they miss.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_apply_streak_freezes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sast_today DATE := (NOW() AT TIME ZONE 'Africa/Johannesburg')::DATE;
BEGIN
  UPDATE user_progress
     SET streak_freeze_count   = streak_freeze_count - 1,
         streak_freeze_used_at = NOW(),
         -- Stamp today's date so sync-streak sees consecutive days tomorrow
         last_activity_date    = sast_today,
         updated_at            = NOW()
   WHERE streak > 0
     AND streak_freeze_count > 0
     AND (last_activity_date IS NULL OR last_activity_date < sast_today);
END;
$$;

COMMENT ON FUNCTION auto_apply_streak_freezes IS
  'Nightly job: automatically consumes one streak freeze for any user who missed today but still has freeze tokens. Runs at 23:55 SAST via pg_cron.';

-- Schedule: 21:55 UTC = 23:55 SAST (UTC+2), fires every night
SELECT cron.schedule(
  'auto-streak-freeze-nightly',
  '55 21 * * *',
  $$SELECT auto_apply_streak_freezes()$$
);
