alter table public.user_progress
  add column if not exists weekly_completions jsonb not null default '{}'::jsonb;

comment on column public.user_progress.weekly_completions is
  'Per challenge id: { completedAt: ISO8601, bonusXP: number }';
