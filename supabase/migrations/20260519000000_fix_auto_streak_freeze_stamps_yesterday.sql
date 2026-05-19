-- ============================================================
-- Fix: auto_apply_streak_freezes was stamping last_activity_date = TODAY
--
-- Bug: The nightly cron at midnight SAST stamped last_activity_date = sast_today
-- (the new day, e.g. May 19). So when a user completed a lesson later that
-- same day, sync-streak saw lastActive === today → streak stayed frozen.
-- The streak only incremented the NEXT day, making it appear stuck for days.
--
-- Fix:
--   1. Condition: only fire if last_activity_date < sast_today - 1
--      (user missed YESTERDAY, not just "hasn't done a lesson yet today")
--   2. Stamp: last_activity_date = sast_today - 1 (yesterday)
--      so sync-streak sees "consecutive days" and increments today.
-- ============================================================

CREATE OR REPLACE FUNCTION auto_apply_streak_freezes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sast_today     DATE := (NOW() AT TIME ZONE 'Africa/Johannesburg')::DATE;
  sast_yesterday DATE := sast_today - INTERVAL '1 day';
BEGIN
  UPDATE user_progress
     SET streak_freeze_count   = streak_freeze_count - 1,
         streak_freeze_used_at = NOW(),
         -- Stamp YESTERDAY so sync-streak sees consecutive days TODAY
         -- (the freeze covers the missed day, not the current new day)
         last_activity_date    = sast_yesterday,
         updated_at            = NOW()
   WHERE streak > 0
     AND streak_freeze_count > 0
     -- Only fire if user didn't do a lesson yesterday or earlier
     AND (last_activity_date IS NULL OR last_activity_date < sast_yesterday);
END;
$$;

COMMENT ON FUNCTION auto_apply_streak_freezes IS
  'Nightly job: automatically consumes one streak freeze for any user who missed yesterday. Stamps last_activity_date = yesterday so completing a lesson today correctly increments the streak. Runs at midnight SAST (22:00 UTC) via pg_cron.';
