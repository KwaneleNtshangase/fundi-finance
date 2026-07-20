-- Lock down cross-user reads on profiles and user_progress.
--
-- ⚠️ APPLY ONLY AFTER the client refactor is deployed (LeaderboardView using
-- get_leaderboard() RPC and isUsernameAvailable using username_taken() RPC).
-- Applying before the deploy breaks the live leaderboard and username checks.
--
-- Context: the leaderboard used to read profiles (full_name, age_range) and
-- user_progress for ALL users straight from the browser, which required
-- read-all policies. Those policies let any signed-in user enumerate every
-- user's real name — the same POPIA exposure as audit H3, via a second path.

-- ── user_progress ───────────────────────────────────────────────────────────
-- Leaky read-all policy (was needed by the old leaderboard):
drop policy if exists "Authenticated users can read all progress" on public.user_progress;
-- Superseded by the explicit policies from 20260712000000:
drop policy if exists "Users can insert own progress" on public.user_progress;
drop policy if exists "Users can update own progress" on public.user_progress;

-- ── profiles ────────────────────────────────────────────────────────────────
-- Drop every SELECT policy on profiles that is not scoped to the caller's own
-- row (i.e. whose USING clause never references auth.uid()).
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'SELECT'
      and (qual is null or qual !~ 'auth\.uid')
  loop
    execute format('drop policy %I on public.profiles', pol.policyname);
    raise notice 'Dropped leaky profiles SELECT policy: %', pol.policyname;
  end loop;
end $$;

-- Ensure users can still read their own profile row.
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = user_id);
