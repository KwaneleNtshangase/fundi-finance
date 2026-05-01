-- ============================================================
-- Streak Freeze Migration
-- Gives every user 2 freeze tokens per week.
-- A freeze token keeps the streak alive for one missed day.
-- Weekly reset happens via pg_cron every Sunday at 00:00 SAST (22:00 UTC Sat).
-- ============================================================

-- Add freeze columns to user_progress
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS streak_freeze_count   INTEGER NOT NULL DEFAULT 2
                                                 CHECK (streak_freeze_count >= 0 AND streak_freeze_count <= 2),
  ADD COLUMN IF NOT EXISTS streak_freeze_used_at TIMESTAMPTZ DEFAULT NULL;

-- ── Weekly pg_cron reset ─────────────────────────────────────
-- Resets streak_freeze_count to 2 every Sunday at 22:00 UTC (= Monday 00:00 SAST).
-- This gives users a fresh pair of freezes at the start of each SA week.
SELECT cron.schedule(
  'streak-freeze-weekly-reset',
  '0 22 * * 0',
  $$
  UPDATE user_progress
     SET streak_freeze_count = 2
   WHERE streak_freeze_count < 2;
  $$
);

-- ── RPC: use_streak_freeze ───────────────────────────────────
-- Called from the client when a user taps "Use Freeze".
-- Validates: user has at least 1 freeze token available.
-- Deducts 1 token, records usage timestamp, keeps streak intact.
CREATE OR REPLACE FUNCTION use_streak_freeze(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_freezes INTEGER;
  v_streak  INTEGER;
BEGIN
  SELECT streak_freeze_count, streak
    INTO v_freezes, v_streak
    FROM user_progress
   WHERE user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_progress_row');
  END IF;

  IF v_freezes <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_freezes_left', 'streak', v_streak);
  END IF;

  UPDATE user_progress
     SET streak_freeze_count   = streak_freeze_count - 1,
         streak_freeze_used_at = NOW()
   WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'ok',             true,
    'streak',         v_streak,
    'freezes_left',   v_freezes - 1
  );
END;
$$;

COMMENT ON FUNCTION use_streak_freeze IS
  'Deducts one streak freeze token from the user, keeping their streak alive for a missed day. Resets weekly via pg_cron.';
