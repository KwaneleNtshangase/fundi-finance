alter table public.user_progress
  add column if not exists daily_rerolls_used integer not null default 0,
  add column if not exists rerolls_used_date date;
