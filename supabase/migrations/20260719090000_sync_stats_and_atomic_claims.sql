-- ============================================================
-- Server-backed stats + atomic weekly-challenge claims
-- ------------------------------------------------------------
-- Fixes three cross-device sync gaps:
--   1. perfect_lessons_total / daily_xp / daily_lessons existed as columns
--      but the client only ever wrote localStorage. They are now part of
--      the same additive-delta model as XP (apply_progress_delta).
--   2. Weekly challenge claims were localStorage-only, so the same reward
--      could be claimed once PER DEVICE. claim_weekly_challenge makes the
--      claim atomic and server-authoritative (row lock + jsonb key check).
--   3. Weekly challenge progress counters were never persisted anywhere.
--      merge_weekly_stats stores them in weekly_challenge_progress with
--      merge-not-clobber semantics (GREATEST for counters, union for
--      day sets), so divergent devices can never lower each other.
--
-- ADDITIVE + NON-DESTRUCTIVE:
--   * No columns dropped, no data rewritten, no rows deleted.
--   * apply_progress_delta is dropped+recreated IN THIS SINGLE
--     TRANSACTION with extra DEFAULTed params, so already-deployed
--     clients calling it with the original six named arguments keep
--     working unchanged (PostgREST fills the defaults).
-- ============================================================

-- ── 1. apply_progress_delta: extended with perfect + daily deltas ──
-- Old signature must be dropped first (CREATE OR REPLACE with more args
-- would create an ambiguous overload for PostgREST named-arg dispatch).
DROP FUNCTION IF EXISTS public.apply_progress_delta(UUID, INTEGER, INTEGER, TEXT, TEXT[], INTEGER);

CREATE FUNCTION public.apply_progress_delta(
  p_user_id             UUID,
  p_xp_delta            INTEGER DEFAULT 0,
  p_weekly_delta        INTEGER DEFAULT 0,
  p_week_key            TEXT    DEFAULT NULL,
  p_completed_lessons   TEXT[]  DEFAULT NULL,
  p_longest_streak      INTEGER DEFAULT NULL,
  p_perfect_delta       INTEGER DEFAULT 0,
  p_daily_xp_delta      INTEGER DEFAULT 0,
  p_daily_lessons_delta INTEGER DEFAULT 0,
  p_day_key             TEXT    DEFAULT NULL
)
RETURNS public.user_progress
LANGUAGE plpgsql
AS $$
DECLARE
  result    public.user_progress;
  dxp       INTEGER := COALESCE(p_xp_delta, 0);
  dweekly   INTEGER := COALESCE(p_weekly_delta, 0);
  dperfect  INTEGER := LEAST(GREATEST(COALESCE(p_perfect_delta, 0), 0), 50);
  ddailyxp  INTEGER := LEAST(GREATEST(COALESCE(p_daily_xp_delta, 0), 0), 10000);
  ddailyles INTEGER := LEAST(GREATEST(COALESCE(p_daily_lessons_delta, 0), 0), 100);
  longest   INTEGER := GREATEST(COALESCE(p_longest_streak, 0), 0);
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot modify progress for another user';
  END IF;

  INSERT INTO public.user_progress AS up (
    user_id, xp, completed_lessons, weekly_xp, week_key, longest_streak,
    perfect_lessons_total, daily_xp_today, daily_xp_date,
    daily_lessons_today, daily_lessons_date, updated_at
  )
  VALUES (
    p_user_id,
    GREATEST(dxp, 0),
    COALESCE(p_completed_lessons, '{}'),
    GREATEST(dweekly, 0),
    -- week_key is NOT NULL DEFAULT ''. Passing NULL here made the INSERT
    -- branch fail for users with no row yet (first lesson on a new account
    -- called with p_week_key = NULL) — lessons silently never reached the DB.
    COALESCE(p_week_key, ''),
    longest,
    dperfect,
    ddailyxp,
    COALESCE(p_day_key, ''),
    ddailyles,
    COALESCE(p_day_key, ''),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- Additive XP ledger — never overwritten, so concurrent gains all count.
    xp = GREATEST(0, up.xp + dxp),

    -- Weekly XP: accumulate within the same week; reset to the incoming
    -- delta on a strictly newer week; ignore stale weeks.
    weekly_xp = CASE
      WHEN p_week_key IS NULL                       THEN up.weekly_xp
      WHEN p_week_key = up.week_key                 THEN up.weekly_xp + dweekly
      WHEN p_week_key > COALESCE(up.week_key, '')   THEN GREATEST(dweekly, 0)
      ELSE up.weekly_xp
    END,
    week_key = CASE
      WHEN p_week_key IS NOT NULL AND p_week_key > COALESCE(up.week_key, '')
        THEN p_week_key
      ELSE up.week_key
    END,

    -- Lifetime perfect-lesson counter: additive, never lowered.
    perfect_lessons_total = COALESCE(up.perfect_lessons_total, 0) + dperfect,

    -- Daily counters: accumulate on the same SAST day, reset on a strictly
    -- newer day, ignore deltas stamped with an older day (stale device).
    daily_xp_today = CASE
      WHEN p_day_key IS NULL                             THEN up.daily_xp_today
      WHEN p_day_key = COALESCE(up.daily_xp_date, '')    THEN COALESCE(up.daily_xp_today, 0) + ddailyxp
      WHEN p_day_key > COALESCE(up.daily_xp_date, '')    THEN ddailyxp
      ELSE up.daily_xp_today
    END,
    daily_xp_date = CASE
      WHEN p_day_key IS NOT NULL AND p_day_key > COALESCE(up.daily_xp_date, '')
        THEN p_day_key
      ELSE up.daily_xp_date
    END,
    daily_lessons_today = CASE
      WHEN p_day_key IS NULL                                 THEN up.daily_lessons_today
      WHEN p_day_key = COALESCE(up.daily_lessons_date, '')   THEN COALESCE(up.daily_lessons_today, 0) + ddailyles
      WHEN p_day_key > COALESCE(up.daily_lessons_date, '')   THEN ddailyles
      ELSE up.daily_lessons_today
    END,
    daily_lessons_date = CASE
      WHEN p_day_key IS NOT NULL AND p_day_key > COALESCE(up.daily_lessons_date, '')
        THEN p_day_key
      ELSE up.daily_lessons_date
    END,

    -- Union of lesson arrays — de-duplicated, never shrinks.
    completed_lessons = (
      SELECT COALESCE(ARRAY_AGG(DISTINCT l), '{}')
      FROM UNNEST(up.completed_lessons || COALESCE(p_completed_lessons, '{}')) AS l
    ),

    longest_streak = GREATEST(up.longest_streak, longest),
    updated_at = NOW()
  RETURNING up.* INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_progress_delta(
  UUID, INTEGER, INTEGER, TEXT, TEXT[], INTEGER, INTEGER, INTEGER, INTEGER, TEXT
) TO authenticated;


-- ── 2. claim_weekly_challenge: atomic once-per-week claim ────
-- Claims are keyed "<sunday-date>:<challenge-id>" inside weekly_completions.
-- Legacy entries (keyed by challenge id only) are honoured when their
-- completedAt falls inside the claimed week, so nobody gets a double
-- reward during the transition. XP is granted server-side ONLY when the
-- claim wins the race, so two devices claiming concurrently can never
-- both be paid.
CREATE OR REPLACE FUNCTION public.claim_weekly_challenge(
  p_user_id      UUID,
  p_week_key     TEXT,               -- Sunday anchor 'YYYY-MM-DD'
  p_challenge_id TEXT,
  p_xp           INTEGER,
  p_xp_week_key  TEXT DEFAULT NULL   -- 'notho-week-YYYY-MM-DD' ledger key
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  claim_key   TEXT;
  cur         public.user_progress;
  legacy      JSONB;
  legacy_at   TIMESTAMPTZ;
  grant_xp    INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot claim for another user';
  END IF;
  IF p_week_key IS NULL OR p_week_key !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_week_key');
  END IF;
  IF p_challenge_id IS NULL OR p_challenge_id !~ '^[a-z0-9\-]{1,64}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_challenge');
  END IF;
  -- Reward is client-reported; hard cap bounds what a tampered client can mint.
  grant_xp := LEAST(GREATEST(COALESCE(p_xp, 0), 0), 500);

  claim_key := p_week_key || ':' || p_challenge_id;

  -- Ensure the row exists, then lock it for the check-and-set.
  INSERT INTO public.user_progress (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO cur FROM public.user_progress
  WHERE user_id = p_user_id FOR UPDATE;

  IF cur.weekly_completions ? claim_key THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  -- Legacy claim (pre-migration clients stored plain challenge id).
  legacy := cur.weekly_completions -> p_challenge_id;
  IF legacy IS NOT NULL THEN
    BEGIN
      legacy_at := (legacy ->> 'completedAt')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
      legacy_at := NULL;
    END;
    IF legacy_at IS NOT NULL AND legacy_at >= p_week_key::DATE THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
    END IF;
  END IF;

  UPDATE public.user_progress SET
    xp = GREATEST(0, xp + grant_xp),
    weekly_xp = CASE
      WHEN p_xp_week_key IS NULL                      THEN weekly_xp
      WHEN p_xp_week_key = week_key                   THEN weekly_xp + grant_xp
      WHEN p_xp_week_key > COALESCE(week_key, '')     THEN grant_xp
      ELSE weekly_xp
    END,
    week_key = CASE
      WHEN p_xp_week_key IS NOT NULL AND p_xp_week_key > COALESCE(week_key, '')
        THEN p_xp_week_key
      ELSE week_key
    END,
    weekly_completions = weekly_completions || jsonb_build_object(
      claim_key, jsonb_build_object('completedAt', NOW(), 'bonusXP', grant_xp)
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'xp_granted', grant_xp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_weekly_challenge(
  UUID, TEXT, TEXT, INTEGER, TEXT
) TO authenticated;


-- ── 3. merge_weekly_stats: merge-not-clobber weekly counters ─
-- Stored shape in weekly_challenge_progress:
--   { "weekKey": "YYYY-MM-DD", "lessonsCompleted": n, "xpEarned": n,
--     "perfectLessons": n, "advancedLessons": n, "days": ["YYYY-MM-DD"...],
--     "budgetDays": [...], "calculatorDays": [...], "lastLessonDay": "..." }
-- Same week  -> counters take GREATEST, day sets take the union.
-- Newer week -> incoming replaces stored. Older week -> ignored.
CREATE OR REPLACE FUNCTION public.merge_weekly_stats(
  p_user_id  UUID,
  p_week_key TEXT,
  p_stats    JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  cur         JSONB;
  cur_week    TEXT;
  merged      JSONB;
  in_stats    JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot modify stats for another user';
  END IF;
  IF p_week_key IS NULL OR p_week_key !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_week_key');
  END IF;

  -- Sanitise incoming stats: clamp counters, validate + cap day arrays.
  in_stats := jsonb_build_object(
    'weekKey',          p_week_key,
    'lessonsCompleted', LEAST(GREATEST(COALESCE((p_stats->>'lessonsCompleted')::INT, 0), 0), 1000),
    'xpEarned',         LEAST(GREATEST(COALESCE((p_stats->>'xpEarned')::INT, 0), 0), 100000),
    'perfectLessons',   LEAST(GREATEST(COALESCE((p_stats->>'perfectLessons')::INT, 0), 0), 1000),
    'advancedLessons',  LEAST(GREATEST(COALESCE((p_stats->>'advancedLessons')::INT, 0), 0), 1000),
    'lastLessonDay',    COALESCE(NULLIF(p_stats->>'lastLessonDay', ''), ''),
    'days',             (SELECT COALESCE(jsonb_agg(DISTINCT d), '[]'::JSONB) FROM (
                          SELECT jsonb_array_elements_text(COALESCE(p_stats->'days', '[]'::JSONB)) AS d
                        ) s WHERE d ~ '^\d{4}-\d{2}-\d{2}$' AND d >= p_week_key),
    'budgetDays',       (SELECT COALESCE(jsonb_agg(DISTINCT d), '[]'::JSONB) FROM (
                          SELECT jsonb_array_elements_text(COALESCE(p_stats->'budgetDays', '[]'::JSONB)) AS d
                        ) s WHERE d ~ '^\d{4}-\d{2}-\d{2}$' AND d >= p_week_key),
    'calculatorDays',   (SELECT COALESCE(jsonb_agg(DISTINCT d), '[]'::JSONB) FROM (
                          SELECT jsonb_array_elements_text(COALESCE(p_stats->'calculatorDays', '[]'::JSONB)) AS d
                        ) s WHERE d ~ '^\d{4}-\d{2}-\d{2}$' AND d >= p_week_key)
  );

  SELECT weekly_challenge_progress INTO cur FROM public.user_progress
  WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_progress (user_id, weekly_challenge_progress)
    VALUES (p_user_id, in_stats)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN jsonb_build_object('ok', true, 'stats', in_stats);
  END IF;

  cur_week := COALESCE(cur->>'weekKey', '');

  IF cur_week = '' OR p_week_key > cur_week THEN
    merged := in_stats;                          -- new week: replace
  ELSIF p_week_key < cur_week THEN
    RETURN jsonb_build_object('ok', true, 'stats', cur);  -- stale device: keep server
  ELSE
    merged := jsonb_build_object(                -- same week: merge
      'weekKey',          p_week_key,
      'lessonsCompleted', GREATEST(COALESCE((cur->>'lessonsCompleted')::INT, 0), (in_stats->>'lessonsCompleted')::INT),
      'xpEarned',         GREATEST(COALESCE((cur->>'xpEarned')::INT, 0), (in_stats->>'xpEarned')::INT),
      'perfectLessons',   GREATEST(COALESCE((cur->>'perfectLessons')::INT, 0), (in_stats->>'perfectLessons')::INT),
      'advancedLessons',  GREATEST(COALESCE((cur->>'advancedLessons')::INT, 0), (in_stats->>'advancedLessons')::INT),
      'lastLessonDay',    GREATEST(COALESCE(cur->>'lastLessonDay', ''), in_stats->>'lastLessonDay'),
      'days',             (SELECT COALESCE(jsonb_agg(DISTINCT d), '[]'::JSONB) FROM (
                            SELECT jsonb_array_elements_text(COALESCE(cur->'days', '[]'::JSONB)) AS d
                            UNION
                            SELECT jsonb_array_elements_text(in_stats->'days')
                          ) s),
      'budgetDays',       (SELECT COALESCE(jsonb_agg(DISTINCT d), '[]'::JSONB) FROM (
                            SELECT jsonb_array_elements_text(COALESCE(cur->'budgetDays', '[]'::JSONB)) AS d
                            UNION
                            SELECT jsonb_array_elements_text(in_stats->'budgetDays')
                          ) s),
      'calculatorDays',   (SELECT COALESCE(jsonb_agg(DISTINCT d), '[]'::JSONB) FROM (
                            SELECT jsonb_array_elements_text(COALESCE(cur->'calculatorDays', '[]'::JSONB)) AS d
                            UNION
                            SELECT jsonb_array_elements_text(in_stats->'calculatorDays')
                          ) s)
    );
  END IF;

  UPDATE public.user_progress
  SET weekly_challenge_progress = merged, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'stats', merged);
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_weekly_stats(UUID, TEXT, JSONB) TO authenticated;


-- ── 4. Pin search_path (Supabase advisor 0011) ───────────────
ALTER FUNCTION public.apply_progress_delta(UUID, INTEGER, INTEGER, TEXT, TEXT[], INTEGER, INTEGER, INTEGER, INTEGER, TEXT)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.claim_weekly_challenge(UUID, TEXT, TEXT, INTEGER, TEXT)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.merge_weekly_stats(UUID, TEXT, JSONB)
  SET search_path = public, pg_temp;
