create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  xp integer not null default 0,
  streak integer not null default 0,
  last_activity_date date,
  completed_lessons text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

create policy "Users can read own progress" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "Users can upsert own progress" on public.user_progress
  for all using (auth.uid() = user_id);

