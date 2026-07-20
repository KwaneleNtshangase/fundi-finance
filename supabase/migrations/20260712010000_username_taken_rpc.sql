-- Username availability check without exposing other users' profile rows.
--
-- ProfileView / pageViews.types previously ran
--   select user_id from profiles where username = X
-- from the browser, which requires authenticated users to be able to SELECT
-- every profiles row. That broad SELECT policy is what leaks full_name /
-- age_range to any signed-in user (POPIA). This SECURITY DEFINER function
-- answers "is this username taken?" with a boolean only, so the broad
-- policy can be dropped.

create or replace function public.username_taken(
  p_username text,
  p_exclude_user uuid default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where username = p_username
      and (p_exclude_user is null or user_id <> p_exclude_user)
  );
$$;

revoke execute on function public.username_taken(text, uuid) from public, anon;
grant execute on function public.username_taken(text, uuid) to authenticated;

comment on function public.username_taken(text, uuid) is
  'Boolean username-availability check. SECURITY DEFINER so clients need no SELECT access to other users'' profiles rows.';
