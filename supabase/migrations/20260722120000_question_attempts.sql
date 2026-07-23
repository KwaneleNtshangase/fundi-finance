-- Per-answer difficulty/analytics log for bank-backed lesson questions.
-- Phase 0 plumbing from docs/LESSON-BANK-ARCHITECTURE.md §4.

create table if not exists public.question_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  course_id   text not null,
  lesson_id   text not null,
  slot_id     text not null,
  variant_id  text not null,
  concept_id  text,
  attempt_no  int  not null default 1,
  is_correct  boolean not null,
  answered_at timestamptz not null default now()
);

alter table public.question_attempts enable row level security;

create policy "Users read own question attempts" on public.question_attempts
  for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own question attempts" on public.question_attempts
  for insert to authenticated
  with check (auth.uid() = user_id);

create index if not exists question_attempts_variant_id_idx
  on public.question_attempts (variant_id);

create index if not exists question_attempts_user_lesson_idx
  on public.question_attempts (user_id, lesson_id);
