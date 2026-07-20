-- Leaderboard read access
-- Users' own rows are protected by RLS. This function bypasses RLS (SECURITY
-- DEFINER) to return only the minimal public leaderboard info for every user,
-- so the leaderboard can show all registered learners — not just the current
-- user's own row.

create or replace function public.get_leaderboard()
returns table (
  user_id uuid,
  full_name text,
  age_range text,
  xp integer,
  weekly_xp integer,
  week_key text
)
language sql
security definer
set search_path = public
as $$
  -- Union: every user that has either a profile OR a progress row.
  -- Left joins so brand-new users without progress still appear.
  with ids as (
    select user_id from public.profiles
    union
    select user_id from public.user_progress
  )
  select
    i.user_id,
    p.full_name,
    p.age_range,
    coalesce((up.xp)::integer, 0)            as xp,
    coalesce((up.weekly_xp)::integer, 0)     as weekly_xp,
    coalesce(up.week_key, '')                as week_key
  from ids i
  left join public.profiles p on p.user_id = i.user_id
  left join public.user_progress up on up.user_id = i.user_id
  order by coalesce((up.weekly_xp)::integer, 0) desc,
           coalesce((up.xp)::integer, 0) desc
  limit 500;
$$;

-- Grant execute to all authenticated users (and anon, for splash previews if any)
grant execute on function public.get_leaderboard() to anon, authenticated;

comment on function public.get_leaderboard() is
  'Returns leaderboard info (minimal fields) for every registered learner. Runs as definer to bypass RLS so users can see other competitors.';
