-- Import v2: per-account labels + transfer exclusion (additive, idempotent)
-- Apply in Supabase dashboard before deploying PDF/multi-account import features.

ALTER TABLE budget_entries
  ADD COLUMN IF NOT EXISTS account_label TEXT;

ALTER TABLE budget_entries
  ADD COLUMN IF NOT EXISTS is_transfer BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE budget_import_batches
  ADD COLUMN IF NOT EXISTS account_label TEXT;
