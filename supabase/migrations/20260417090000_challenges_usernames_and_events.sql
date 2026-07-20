alter table public.profiles
  add column if not exists username text;

update public.profiles
set username = lower(regexp_replace(coalesce(split_part(full_name, ' ', 1), 'fundi_user') || '_' || substr(user_id::text, 1, 4), '[^a-zA-Z0-9_]', '', 'g'))
where username is null;

alter table public.profiles
  add constraint profiles_username_format_chk
  check (username ~ '^[A-Za-z0-9_]{3,20}$');

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username));

create table if not exists public.challenge_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists challenge_events_user_id_idx on public.challenge_events(user_id, occurred_at desc);
create index if not exists challenge_events_type_idx on public.challenge_events(event_type);

create table if not exists public.user_challenge_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null check (period_type in ('daily','weekly')),
  period_key text not null,
  challenge_code text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  target_value integer not null,
  xp_reward integer not null,
  rerolled_from text,
  completed_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, period_type, period_key, challenge_code)
);

create table if not exists public.user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.user_challenge_assignments(id) on delete cascade,
  current_value integer not null default 0,
  target_value integer not null,
  is_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(assignment_id)
);

alter table public.user_progress
  add column if not exists level integer not null default 1,
  add column if not exists quiz_history jsonb not null default '[]'::jsonb,
  add column if not exists module_unlocks jsonb not null default '{}'::jsonb,
  add column if not exists challenge_rerolls_date date,
  add column if not exists challenge_rerolls_used integer not null default 0;

alter table public.challenge_events enable row level security;
alter table public.user_challenge_assignments enable row level security;
alter table public.user_challenge_progress enable row level security;

create policy "Users can read own challenge events" on public.challenge_events
  for select using (auth.uid() = user_id);

create policy "Users can write own challenge events" on public.challenge_events
  for insert with check (auth.uid() = user_id);

create policy "Users can read own challenge assignments" on public.user_challenge_assignments
  for select using (auth.uid() = user_id);

create policy "Users can write own challenge assignments" on public.user_challenge_assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read own challenge progress" on public.user_challenge_progress
  for select using (
    exists (
      select 1
      from public.user_challenge_assignments a
      where a.id = assignment_id
      and a.user_id = auth.uid()
    )
  );

create policy "Users can write own challenge progress" on public.user_challenge_progress
  for all using (
    exists (
      select 1
      from public.user_challenge_assignments a
      where a.id = assignment_id
      and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.user_challenge_assignments a
      where a.id = assignment_id
      and a.user_id = auth.uid()
    )
  );
