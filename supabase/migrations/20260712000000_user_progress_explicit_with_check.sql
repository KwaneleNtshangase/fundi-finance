-- A7 (security review 2026-07-10) — make user_progress write policy explicit.
--
-- The original policy relied on Postgres defaulting a missing WITH CHECK to
-- the USING expression. Not exploitable, but fragile: a future edit to USING
-- silently changes write semantics too. Split read from write and make both
-- expressions explicit.

DROP POLICY IF EXISTS "Users can upsert own progress" ON public.user_progress;

CREATE POLICY "Users read own progress" ON public.user_progress
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress" ON public.user_progress
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress" ON public.user_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own progress" ON public.user_progress
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
