-- ============================================================
-- Cross-Device Progress Sync — delta accumulation model
-- ------------------------------------------------------------
-- Root cause being fixed: every client write to user_progress sent
-- an ABSOLUTE snapshot built from one device's local state and
-- upserted it, with no server-side merge. Two devices that diverged
-- clobbered each other (last-write-wins), so lessons and XP done on
-- one device "disappeared" on the other.
--
-- New model — nobody overwrites; the server accumulates:
--   * xp           -> xp = xp + delta   (additive ledger; cross-device
--                     gains ALL count, incl. repeating a lesson on
--                     several devices — intended XP-farming behaviour)
--   * weekly_xp    -> accumulates within a week, resets on a new week
--   * completed_lessons -> set UNION (never shrinks)
--   * longest_streak    -> GREATEST
-- Because clients send DELTAS (not snapshots), divergent devices can
-- no longer clobber each other — the clobber bug is gone by construction.
--
-- Spend (buying a streak freeze) lowers the balance via its own atomic
-- decrement (spend_xp). xp_spent is kept as a lifetime audit counter.
--
-- IMPORTANT: This migration is ADDITIVE and NON-DESTRUCTIVE.
--   * Adds one column (xp_spent, default 0) — existing rows untouched.
--   * `xp` keeps its existing meaning to the app: the spendable
--     balance. No UI / leaderboard change required.
-- ============================================================

-- ── 1. Spend audit column ────────────────────────────────────
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS xp_spent INTEGER NOT NULL DEFAULT 0;


-- ── 2. apply_progress_delta ──────────────────────────────────
-- Atomically applies a delta to the user's row and returns the new row.
-- Every argument is optional: NULL / 0 means "don't change this field",
-- so each caller sends only what it changed.
--   p_xp_delta       : add to lifetime/spendable XP (can be 0)
--   p_weekly_delta   : add to this week's XP
--   p_week_key       : the week the XP was earned in (for reset logic)
--   p_completed_lessons : lessons to union in (idempotent)
--   p_longest_streak : raise the longest-streak high-water mark
--
-- SECURITY INVOKER (default): runs with the caller's rights, so RLS
-- (auth.uid() = user_id) blocks writing to anyone else's row. The
-- explicit guard below is defence in depth.
CREATE OR REPLACE FUNCTION public.apply_progress_delta(
  p_user_id           UUID,
  p_xp_delta          INTEGER DEFAULT 0,
  p_weekly_delta      INTEGER DEFAULT 0,
  p_week_key          TEXT    DEFAULT NULL,
  p_completed_lessons TEXT[]  DEFAULT NULL,
  p_longest_streak    INTEGER DEFAULT NULL
)
RETURNS public.user_progress
LANGUAGE plpgsql
AS $$
DECLARE
  result   public.user_progress;
  dxp      INTEGER := COALESCE(p_xp_delta, 0);
  dweekly  INTEGER := COALESCE(p_weekly_delta, 0);
  longest  INTEGER := GREATEST(COALESCE(p_longest_streak, 0), 0);
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot modify progress for another user';
  END IF;

  INSERT INTO public.user_progress AS up (
    user_id, xp, completed_lessons, weekly_xp, week_key, longest_streak, updated_at
  )
  VALUES (
    p_user_id,
    GREATEST(dxp, 0),
    COALESCE(p_completed_lessons, '{}'),
    GREATEST(dweekly, 0),
    p_week_key,
    longest,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    -- Additive XP ledger — never overwritten, so concurrent gains all count.
    xp = GREATEST(0, up.xp + dxp),

    -- Weekly XP: accumulate within the same week; reset to the incoming
    -- delta when a strictly newer week is reported; otherwise leave alone.
    -- Week keys ("notho-week-YYYY-MM-DD") sort lexicographically by date.
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

    -- Union of lesson arrays — de-duplicated, order-insensitive, never shrinks.
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


-- ── 3. spend_xp ──────────────────────────────────────────────
-- Authoritative atomic spend. Locks the row, checks the balance,
-- decrements xp and increments the xp_spent audit counter.
CREATE OR REPLACE FUNCTION public.spend_xp(
  p_user_id UUID,
  p_amount  INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  cur_xp    INTEGER;
  cur_spent INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot spend XP for another user';
  END IF;
  IF COALESCE(p_amount, 0) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  END IF;

  SELECT xp, xp_spent INTO cur_xp, cur_spent
  FROM public.user_progress
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_row');
  END IF;
  IF COALESCE(cur_xp, 0) < p_amount THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_xp',
                              'balance', COALESCE(cur_xp, 0));
  END IF;

  UPDATE public.user_progress
  SET xp         = cur_xp - p_amount,
      xp_spent   = COALESCE(cur_spent, 0) + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'balance', cur_xp - p_amount,
    'spent',   COALESCE(cur_spent, 0) + p_amount
  );
END;
$$;


-- ── 4. Grants ────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.apply_progress_delta(
  UUID, INTEGER, INTEGER, TEXT, TEXT[], INTEGER
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.spend_xp(UUID, INTEGER) TO authenticated;
