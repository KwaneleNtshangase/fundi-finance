-- H3 — Leaderboard RPC privacy hardening
--
-- Before: get_leaderboard() was SECURITY DEFINER and granted to `anon`, and it
-- returned full_name + age_range for every registered user. That let an
-- UNAUTHENTICATED caller enumerate real names and age ranges of all users
-- (personal information — a POPIA exposure).
--
-- After:
--   1. Return a public display handle (username) only — never real names /
--      age ranges.
--   2. Restrict execution to authenticated learners; anonymous visitors no
--      longer get the roster.
--
-- Note: the return signature changes, so we DROP then CREATE (CREATE OR REPLACE
-- cannot alter a function's return type).

drop function if exists public.get_leaderboard();

create or replace function public.get_leaderboard()
returns table (
  user_id uuid,
  username text,
  xp integer,
  weekly_xp integer,
  week_key text
)
language sql
security definer
set search_path = public
as $$
  -- Every user that has either a profile OR a progress row.
  with ids as (
    select user_id from public.profiles
    union
    select user_id from public.user_progress
  )
  select
    i.user_id,
    p.username,
    coalesce((up.xp)::integer, 0)        as xp,
    coalesce((up.weekly_xp)::integer, 0) as weekly_xp,
    coalesce(up.week_key, '')            as week_key
  from ids i
  left join public.profiles p      on p.user_id = i.user_id
  left join public.user_progress up on up.user_id = i.user_id
  order by coalesce((up.weekly_xp)::integer, 0) desc,
           coalesce((up.xp)::integer, 0) desc
  limit 500;
$$;

-- Authenticated learners only. Remove the default PUBLIC grant (which anon
-- inherits) AND any explicit anon grant, then grant to authenticated only.
-- Revoking anon alone is not enough — anon still executes via PUBLIC.
revoke execute on function public.get_leaderboard() from public, anon;
grant execute on function public.get_leaderboard() to authenticated;

comment on function public.get_leaderboard() is
  'Leaderboard roster for signed-in users. Returns a public username only - never real names or age ranges (POPIA). Authenticated-only.';
