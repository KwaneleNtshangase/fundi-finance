-- Optional profile fields from onboarding (goal + age band)
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists age_range text;
