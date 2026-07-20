-- Leaderboard display-name fallback: first name when no username is set.
--
-- Product decision (2026-07-12): users who haven't picked a username show
-- their FIRST name only (first word of full_name) instead of "Learner XXXX".
-- The client separately prompts these users to choose a username.
-- Surname, age_range, and the rest of the profile remain private.

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
  with ids as (
    select user_id from public.profiles
    union
    select user_id from public.user_progress
  )
  select
    i.user_id,
    -- username, falling back to first name only (never the full name):
    coalesce(
      nullif(trim(p.username), ''),
      nullif(split_part(trim(p.full_name), ' ', 1), '')
    )                                    as username,
    coalesce((up.xp)::integer, 0)        as xp,
    coalesce((up.weekly_xp)::integer, 0) as weekly_xp,
    coalesce(up.week_key, '')            as week_key
  from ids i
  left join public.profiles p       on p.user_id = i.user_id
  left join public.user_progress up on up.user_id = i.user_id
  order by coalesce((up.weekly_xp)::integer, 0) desc,
           coalesce((up.xp)::integer, 0) desc
  limit 500;
$$;

revoke execute on function public.get_leaderboard() from public, anon;
grant execute on function public.get_leaderboard() to authenticated;

comment on function public.get_leaderboard() is
  'Leaderboard roster for signed-in users. Returns username, or first name as fallback when no username is set - never full names or age ranges. Authenticated-only.';
