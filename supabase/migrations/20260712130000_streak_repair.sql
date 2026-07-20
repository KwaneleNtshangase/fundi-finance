-- Streak repair: restore a just-broken streak for XP (retention mechanic).
--
-- Complements streak FREEZES (which protect a streak before midnight):
-- repair is the forgiveness path AFTER the streak has lapsed. Rules:
--   • Window: last activity 2-3 SAST days ago (missed 1-2 days). Older
--     breaks can't be bought back; a live streak needs no repair.
--   • Cost: 200 XP (spendable balance must cover it).
--   • Worth protecting: streak of 3+ only.
--   • Effect: stamps last_activity_date = yesterday, so the next lesson
--     increments the streak instead of resetting it to 1.
-- Follows the same SAST + FOR UPDATE conventions as use_streak_freeze.

CREATE OR REPLACE FUNCTION public.repair_streak()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_cost CONSTANT integer := 200;
  v_streak integer;
  v_xp numeric;
  v_last date;
  sast_today     DATE := (NOW() AT TIME ZONE 'Africa/Johannesburg')::DATE;
  sast_yesterday DATE := sast_today - INTERVAL '1 day';
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_signed_in');
  END IF;

  SELECT streak, xp, last_activity_date
    INTO v_streak, v_xp, v_last
    FROM user_progress
   WHERE user_id = v_user
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_progress_row');
  END IF;

  IF v_streak < 3 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'streak_too_short', 'streak', v_streak);
  END IF;

  -- Live streak (active today or yesterday) needs no repair.
  IF v_last IS NULL OR v_last >= sast_yesterday THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'streak_not_broken', 'streak', v_streak);
  END IF;

  -- Too late: more than 2 missed days.
  IF v_last < sast_today - INTERVAL '3 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'window_expired', 'streak', v_streak);
  END IF;

  IF coalesce(v_xp, 0) < v_cost THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_enough_xp', 'xp', v_xp, 'cost', v_cost);
  END IF;

  UPDATE user_progress
     SET xp                 = xp - v_cost,
         xp_spent           = coalesce(xp_spent, 0) + v_cost,
         last_activity_date = sast_yesterday,
         updated_at         = NOW()
   WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'ok', true,
    'streak', v_streak,
    'cost', v_cost,
    'xp_left', v_xp - v_cost
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.repair_streak() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.repair_streak() TO authenticated;

COMMENT ON FUNCTION public.repair_streak() IS
  'Restores a streak broken in the last 48h for 200 XP by stamping last_activity_date = yesterday (SAST). Streaks of 3+ only.';
