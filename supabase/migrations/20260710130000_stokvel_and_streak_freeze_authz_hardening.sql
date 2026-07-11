-- ============================================================
-- Security Hardening: Stokvel RLS + Streak-Freeze IDOR fixes
-- Issues addressed:
--   A1 — stokvel_members INSERT lets anyone join as admin
--   A2 — use_streak_freeze has no caller-identity check (IDOR)
--   A3 — auto_apply_streak_freezes grant exposed to public/anon
--   A4 — both streak-freeze functions lack SET search_path
--   A5 — stokvel_contributions INSERT doesn't verify membership
--   A6 — "Admins can update members" policy causes RLS recursion
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- A6: SECURITY DEFINER helper to break RLS recursion
--     Checks whether the current user is an admin of a stokvel
--     without triggering stokvel_members RLS on itself.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_stokvel_admin(p_stokvel_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM stokvel_members
     WHERE stokvel_id = p_stokvel_id
       AND user_id    = auth.uid()
       AND is_admin   = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_stokvel_admin(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_stokvel_admin(uuid) FROM public, anon;

COMMENT ON FUNCTION public.is_stokvel_admin(uuid) IS
  'SECURITY DEFINER helper: returns true if the calling user is an admin of the given stokvel. '
  'Used in RLS policies to avoid recursive stokvel_members self-joins.';


-- ────────────────────────────────────────────────────────────
-- A1 (helper): SECURITY DEFINER creator check for stokvels
--     The stokvels SELECT policy only lets existing *members* read
--     a stokvel row.  During creation the creator has not been
--     inserted into stokvel_members yet, so a plain subquery under
--     the caller's RLS returns NULL — blocking the admin member
--     insert.  This SECURITY DEFINER function bypasses that RLS
--     and reads stokvels directly.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_stokvel_creator(p_stokvel_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM stokvels
     WHERE id         = p_stokvel_id
       AND created_by = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_stokvel_creator(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_stokvel_creator(uuid) FROM public, anon;

COMMENT ON FUNCTION public.is_stokvel_creator(uuid) IS
  'SECURITY DEFINER helper: returns true if the calling user created the given stokvel. '
  'Bypasses the stokvels SELECT RLS so the creator can insert themselves as admin '
  'before their stokvel_members row exists.';


-- ────────────────────────────────────────────────────────────
-- A1: Fix stokvel_members INSERT policy
--     Old policy: WITH CHECK (user_id = auth.uid())
--     — allowed any authenticated user to insert themselves
--       with is_admin = true (privilege escalation).
--     New policy: non-creators may only join as regular members;
--       only the stokvel's creator may set is_admin = true.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can join stokvels" ON stokvel_members;

CREATE POLICY "Users can join stokvels" ON stokvel_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (is_admin = false OR public.is_stokvel_creator(stokvel_id))
  );


-- ────────────────────────────────────────────────────────────
-- A6: Fix stokvel_members UPDATE policy (RLS recursion)
--     Old policy queried stokvel_members from within a
--     stokvel_members policy → infinite recursion in PostgreSQL.
--     Replace with the SECURITY DEFINER helper above.
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can update members" ON stokvel_members;

CREATE POLICY "Admins can update members" ON stokvel_members
  FOR UPDATE
  USING (public.is_stokvel_admin(stokvel_id));


-- ────────────────────────────────────────────────────────────
-- A5: Fix stokvel_contributions INSERT policy
--     Old policy: WITH CHECK (user_id = auth.uid())
--     — allowed any authenticated user to record contributions
--       for any stokvel, even one they haven't joined.
--     New policy: contributor must be an active member.
--     UPDATE/DELETE are intentionally left without a policy
--     (deny by default via RLS).
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can insert own contributions" ON stokvel_contributions;

CREATE POLICY "Users can insert own contributions" ON stokvel_contributions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM public.stokvel_members m
       WHERE m.stokvel_id = stokvel_contributions.stokvel_id
         AND m.user_id    = auth.uid()
    )
  );


-- ────────────────────────────────────────────────────────────
-- A2 + A4: Harden use_streak_freeze
--   • SET search_path = public  (A4 — prevents search_path hijack)
--   • Caller-identity guard      (A2 — prevents IDOR: user A
--     calling the function with user B's UUID to burn their freezes)
--   Body is otherwise identical to the latest version
--   (20260519120000_fix_use_streak_freeze_last_activity.sql).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.use_streak_freeze(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_freezes      INTEGER;
  v_streak       INTEGER;
  sast_today     DATE := (NOW() AT TIME ZONE 'Africa/Johannesburg')::DATE;
  sast_yesterday DATE := sast_today - INTERVAL '1 day';
BEGIN
  -- A2: Reject if caller is trying to act on a different user's row.
  -- IS DISTINCT FROM handles NULL auth.uid() (unauthenticated calls) correctly;
  -- plain <> would return NULL (not TRUE) when auth.uid() is NULL, bypassing the guard.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'forbidden');
  END IF;

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
    'ok',           true,
    'streak',       v_streak,
    'freezes_left', v_freezes - 1
  );
END;
$$;

COMMENT ON FUNCTION public.use_streak_freeze(uuid) IS
  'Deducts one streak freeze token and stamps last_activity_date to yesterday (SAST) so today''s lesson increments the streak via sync-streak. '
  'Guards against IDOR: rejects callers who pass a different user''s UUID.';


-- ────────────────────────────────────────────────────────────
-- A3 + A4: Harden auto_apply_streak_freezes
--   • SET search_path = public  (A4)
--   • Tighten grants            (A3 — cron/service-role only;
--     this function must NOT be callable by ordinary users)
--   Body is identical to latest version
--   (20260519000000_fix_auto_streak_freeze_stamps_yesterday.sql).
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.auto_apply_streak_freezes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sast_today     DATE := (NOW() AT TIME ZONE 'Africa/Johannesburg')::DATE;
  sast_yesterday DATE := sast_today - INTERVAL '1 day';
BEGIN
  UPDATE user_progress
     SET streak_freeze_count   = streak_freeze_count - 1,
         streak_freeze_used_at = NOW(),
         -- Stamp YESTERDAY so sync-streak sees consecutive days TODAY
         last_activity_date    = sast_yesterday,
         updated_at            = NOW()
   WHERE streak > 0
     AND streak_freeze_count > 0
     -- Only fire if user didn't do a lesson yesterday or earlier
     AND (last_activity_date IS NULL OR last_activity_date < sast_yesterday);
END;
$$;

COMMENT ON FUNCTION public.auto_apply_streak_freezes() IS
  'Nightly job: automatically consumes one streak freeze for any user who missed yesterday. '
  'Stamps last_activity_date = yesterday so completing a lesson today correctly increments the streak. '
  'Runs at midnight SAST (22:00 UTC) via pg_cron. Callable by service-role/cron only.';


-- ────────────────────────────────────────────────────────────
-- A3: Tighten function grants
--     use_streak_freeze  → authenticated only (not public/anon)
--     auto_apply_streak_freezes → service-role / pg_cron only
--       (revoke from public, anon, AND authenticated)
-- ────────────────────────────────────────────────────────────

-- use_streak_freeze: revoke public default, grant to authenticated only
REVOKE EXECUTE ON FUNCTION public.use_streak_freeze(uuid) FROM public, anon;
GRANT  EXECUTE ON FUNCTION public.use_streak_freeze(uuid) TO authenticated;

-- auto_apply_streak_freezes: cron/service-role only — no user role may call it
REVOKE EXECUTE ON FUNCTION public.auto_apply_streak_freezes() FROM public, anon, authenticated;
