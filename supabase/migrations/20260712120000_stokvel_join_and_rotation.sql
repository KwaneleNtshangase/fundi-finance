-- Stokvel repair: working invite-code join, real display names, payout order.
--
-- Problems fixed:
--   1. Joining by code was BROKEN: the client looked up stokvels by
--      invite_code, but RLS only lets members read stokvels, so every
--      non-member join failed. Fix: SECURITY DEFINER RPC where the code
--      itself is the capability.
--   2. display_name was hardcoded 'Admin'/'Member'. Fix: RPCs resolve the
--      caller's username (or first name) server-side; backfill existing rows.
--   3. payout_position was never assigned. Fix: creator gets 1, joiners get
--      max+1; backfill existing members by join date.

-- ── Create (server-side so code generation, admin row and names are atomic) ──
CREATE OR REPLACE FUNCTION public.create_stokvel(
  p_name text,
  p_description text,
  p_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_code text;
  v_id uuid;
  v_name text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF coalesce(trim(p_name), '') = '' THEN RAISE EXCEPTION 'Name is required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Contribution amount must be positive'; END IF;

  -- Unique 6-char invite code (retry on the rare collision).
  LOOP
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM stokvels WHERE invite_code = v_code);
  END LOOP;

  SELECT coalesce(
           nullif(trim(p.username), ''),
           nullif(split_part(trim(p.full_name), ' ', 1), ''),
           'Member'
         )
    INTO v_name
    FROM profiles p WHERE p.user_id = v_user;
  v_name := coalesce(v_name, 'Member');

  INSERT INTO stokvels (name, description, contribution_amount, invite_code, created_by)
  VALUES (trim(p_name), nullif(trim(p_description), ''), p_amount, v_code, v_user)
  RETURNING id INTO v_id;

  INSERT INTO stokvel_members (stokvel_id, user_id, display_name, payout_position, is_admin)
  VALUES (v_id, v_user, v_name, 1, true);

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_stokvel(text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_stokvel(text, text, numeric) TO authenticated;

-- ── Join by invite code ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.join_stokvel_by_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_stokvel uuid;
  v_name text;
  v_next int;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT id INTO v_stokvel
    FROM stokvels
   WHERE invite_code = upper(trim(p_code));
  IF v_stokvel IS NULL THEN RAISE EXCEPTION 'Invalid invite code'; END IF;

  IF EXISTS (SELECT 1 FROM stokvel_members WHERE stokvel_id = v_stokvel AND user_id = v_user) THEN
    RAISE EXCEPTION 'You are already a member of this stokvel';
  END IF;

  SELECT coalesce(
           nullif(trim(p.username), ''),
           nullif(split_part(trim(p.full_name), ' ', 1), ''),
           'Member'
         )
    INTO v_name
    FROM profiles p WHERE p.user_id = v_user;
  v_name := coalesce(v_name, 'Member');

  SELECT coalesce(max(payout_position), 0) + 1 INTO v_next
    FROM stokvel_members WHERE stokvel_id = v_stokvel;

  INSERT INTO stokvel_members (stokvel_id, user_id, display_name, payout_position, is_admin)
  VALUES (v_stokvel, v_user, v_name, v_next, false);

  RETURN v_stokvel;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_stokvel_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_stokvel_by_code(text) TO authenticated;

-- ── Backfill: real names for existing 'Admin'/'Member' placeholders ─────────
UPDATE stokvel_members sm
   SET display_name = coalesce(
         nullif(trim(p.username), ''),
         nullif(split_part(trim(p.full_name), ' ', 1), ''),
         sm.display_name
       )
  FROM profiles p
 WHERE p.user_id = sm.user_id
   AND (sm.display_name IS NULL OR sm.display_name IN ('Admin', 'Member'));

-- ── Backfill: payout positions by join order where missing ──────────────────
WITH mx AS (
  SELECT stokvel_id, coalesce(max(payout_position), 0) AS m
    FROM stokvel_members GROUP BY stokvel_id
),
nulls AS (
  SELECT id, stokvel_id,
         row_number() OVER (PARTITION BY stokvel_id ORDER BY joined_at) AS rn
    FROM stokvel_members WHERE payout_position IS NULL
)
UPDATE stokvel_members sm
   SET payout_position = mx.m + n.rn
  FROM nulls n
  JOIN mx ON mx.stokvel_id = n.stokvel_id
 WHERE sm.id = n.id;
