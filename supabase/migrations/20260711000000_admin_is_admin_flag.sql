-- ============================================================
-- Add is_admin flag to profiles
--
-- Makes the DB flag the authoritative admin check so that:
--   • Admin access can be granted/revoked without a code deploy.
--   • The email-based fallback in ADMIN_EMAILS env var is secondary.
--   • Hardcoded fallback email lists in source code can be removed
--     (fails closed instead of open on misconfiguration).
--
-- Self-escalation protection: ordinary users cannot UPDATE their own
-- is_admin column even though they may have UPDATE on other columns.
-- The REVOKE below strips that specific column permission from the
-- anon and authenticated roles. Service-role (used by admin API
-- routes) bypasses RLS and column-level grants, so admin routes
-- that write via service-role still function correctly.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Backfill the known owners so they aren't locked out on first deploy.
-- Uses user_id (the FK column) to match auth.users.id.
UPDATE public.profiles
   SET is_admin = true
 WHERE user_id IN (
   SELECT id
     FROM auth.users
    WHERE lower(email) IN (
      'kwanelebc031@gmail.com',
      'hello@fundiapp.co.za'
    )
 );

-- ── Self-escalation guard ──────────────────────────────────
-- The REVOKE below is defense-in-depth but is INSUFFICIENT on its own:
-- Postgres treats column privileges as a union with table privileges, so
-- if the authenticated role already holds a table-level UPDATE grant on
-- profiles (which Supabase grants by default), the column REVOKE is a
-- no-op and users can still set is_admin = true on their own row.
-- The real guard is the trigger below.
REVOKE UPDATE (is_admin) ON public.profiles FROM anon, authenticated;

-- Real guard: a trigger that stops end users from changing is_admin.
-- End users carry a JWT (auth.uid() is non-null); service-role and cron
-- do not (auth.uid() is null), so admin routes and migrations still work.
-- We silently preserve the old value rather than RAISE, so ordinary profile
-- updates that happen to include the column don't error.
CREATE OR REPLACE FUNCTION public.guard_profiles_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profiles_is_admin ON public.profiles;
CREATE TRIGGER trg_guard_profiles_is_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profiles_is_admin();

COMMENT ON COLUMN public.profiles.is_admin IS
  'Authoritative admin flag. '
  'Protected by trg_guard_profiles_is_admin (BEFORE UPDATE trigger): '
  'any update by a JWT-bearing session (auth.uid() IS NOT NULL) silently '
  'resets this column to its old value, preventing self-escalation. '
  'Service-role connections (auth.uid() IS NULL) bypass the trigger and '
  'can set this column directly. '
  'Column-level REVOKE is also present as defense-in-depth.';
