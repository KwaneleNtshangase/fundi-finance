-- Broadcast dedupe ledger.
--
-- Every confirmed announcement send writes a row here keyed by (campaign, email).
-- The unique constraint makes broadcasts idempotent: re-running a send — whether
-- the full "Schedule send" or the targeted retry — can never email the same
-- person twice for the same campaign. Mirrors push_notification_log.

CREATE TABLE IF NOT EXISTS public.broadcast_send_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign  TEXT NOT NULL,
  email     TEXT NOT NULL,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign, email)
);

CREATE INDEX IF NOT EXISTS broadcast_send_log_campaign_idx
  ON public.broadcast_send_log (campaign, sent_at DESC);

-- Service-role only: RLS enabled with no policies denies all client access.
ALTER TABLE public.broadcast_send_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.broadcast_send_log IS
  'Dedupe ledger for admin announcement broadcasts. Written by /api/admin/broadcast via service role; no client access.';

-- Backfill the completed "budget-statement-import" campaign. All 24 confirmed
-- users already received this announcement on 13 Jul 2026, so record them now to
-- guarantee they are never re-sent it.
INSERT INTO public.broadcast_send_log (campaign, email) VALUES
  ('budget-statement-import', '1105youngeun@gmail.com'),
  ('budget-statement-import', 'jaydeeslater@gmail.com'),
  ('budget-statement-import', 'mjbaxter15@gmail.com'),
  ('budget-statement-import', 'e2e-test@fundiapp.co.za'),
  ('budget-statement-import', 'sivikelwemaci@gmail.com'),
  ('budget-statement-import', '17ntshkw@wbhs.co.za'),
  ('budget-statement-import', 'khomotso.kagiso@gmail.com'),
  ('budget-statement-import', 'kwanele0103@gmail.com'),
  ('budget-statement-import', 'mahlaolantsako12@gmail.com'),
  ('budget-statement-import', 'zuzuoliphant@gmail.com'),
  ('budget-statement-import', 'mokhomathathato@gmail.com'),
  ('budget-statement-import', 'ntuli.akhona08@gmail.com'),
  ('budget-statement-import', 'luzi.keller7@gmail.com'),
  ('budget-statement-import', 'suyontyobeka@gmail.com'),
  ('budget-statement-import', 'knontwana@icloud.com'),
  ('budget-statement-import', 'nonsindisomazibuko8@gmail.com'),
  ('budget-statement-import', '2819840@students.wits.ac.za'),
  ('budget-statement-import', 'shabalalaw20@gmail.com'),
  ('budget-statement-import', 'malatjielenda@gmail.com'),
  ('budget-statement-import', 'retlilemanamela@gmail.com'),
  ('budget-statement-import', 'sinandilesiphesihle@gmail.com'),
  ('budget-statement-import', 'ethan@123.com'),
  ('budget-statement-import', 'nicoleegerton6@gmail.com'),
  ('budget-statement-import', 'kwanelebc031@gmail.com')
ON CONFLICT (campaign, email) DO NOTHING;
