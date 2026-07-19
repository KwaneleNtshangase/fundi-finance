-- Coach Cosmo Tier 2 (AI chat) — consent flag + conversation log.
--
-- POPIA design:
--   • coach_ai_consent is an explicit, purpose-specific opt-in stored on the
--     user's own settings row (they can flip it off anytime; RLS already lets
--     users manage their own user_settings row).
--   • coach_ai_logs stores the conversation for the user's own history view
--     and for abuse/rate-limit checks. Rows cascade-delete with the account.
--   • The prompt sent to the AI provider contains ONLY anonymised category
--     aggregates (see src/lib/coach/summary.ts) — never names, emails,
--     merchant descriptions, or account details.

-- ── Consent flag ─────────────────────────────────────────────────────────────
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS coach_ai_consent BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Conversation log ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coach_ai_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS coach_ai_logs_user_created_idx
  ON public.coach_ai_logs (user_id, created_at DESC);

ALTER TABLE public.coach_ai_logs ENABLE ROW LEVEL SECURITY;

-- Users may READ their own conversation. All writes go through the server
-- route via the service role (no client INSERT/UPDATE/DELETE policies), so
-- users cannot forge history or dodge the daily rate limit.
DROP POLICY IF EXISTS "Users read own coach logs" ON public.coach_ai_logs;
CREATE POLICY "Users read own coach logs"
  ON public.coach_ai_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.coach_ai_logs IS
  'Coach Cosmo AI conversation log. Client: read-only own rows. Writes: service role only (server route enforces consent + daily cap).';
