-- Manual streak freeze must stamp last_activity_date = yesterday (SAST)
-- so sync-streak on the next lesson sees consecutive days and increments
-- the streak instead of consuming another freeze or resetting to 1.

CREATE OR REPLACE FUNCTION use_streak_freeze(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_freezes INTEGER;
  v_streak  INTEGER;
  sast_today     DATE := (NOW() AT TIME ZONE 'Africa/Johannesburg')::DATE;
  sast_yesterday DATE := sast_today - INTERVAL '1 day';
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
         streak_freeze_used_at = NOW(),
         last_activity_date    = sast_yesterday,
         updated_at            = NOW()
   WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'ok',             true,
    'streak',         v_streak,
    'freezes_left',   v_freezes - 1
  );
END;
$$;

COMMENT ON FUNCTION use_streak_freeze IS
  'Deducts one streak freeze token and stamps last_activity_date to yesterday (SAST) so today''s lesson increments the streak via sync-streak.';
