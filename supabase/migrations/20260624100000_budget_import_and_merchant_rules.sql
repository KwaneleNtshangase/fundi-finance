-- Budget statement import + merchant learning (additive only)
-- Verify live budget_entries / budget_targets columns before applying (see docs/supabase/budget-schema-snapshot.md)

-- ── Extend budget_entries for imports ───────────────────────────────────────
ALTER TABLE budget_entries
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS import_batch_id UUID,
  ADD COLUMN IF NOT EXISTS dedupe_hash TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'budget_entries_source_check'
  ) THEN
    ALTER TABLE budget_entries
      ADD CONSTRAINT budget_entries_source_check
      CHECK (source IN ('manual', 'import'));
  END IF;
END $$;

-- Lookup + enforce idempotent re-import per user (distinct hashes via balance / FITID / occurrence ordinal)
DROP INDEX IF EXISTS budget_entries_user_dedupe_hash_idx;
CREATE UNIQUE INDEX IF NOT EXISTS budget_entries_user_dedupe_hash_uniq
  ON budget_entries (user_id, dedupe_hash)
  WHERE dedupe_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS budget_entries_import_batch_idx
  ON budget_entries (import_batch_id)
  WHERE import_batch_id IS NOT NULL;

-- ── Import batch metadata (no raw file stored) ───────────────────────────────
CREATE TABLE IF NOT EXISTS budget_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('csv', 'ofx', 'pdf')),
  txn_count INTEGER NOT NULL DEFAULT 0,
  imported_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  reconciled BOOLEAN NOT NULL DEFAULT false,
  reconciliation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE budget_import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own import batches" ON budget_import_batches;
CREATE POLICY "Users manage own import batches"
  ON budget_import_batches
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Per-user merchant categorisation rules ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_pattern TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, merchant_pattern)
);

ALTER TABLE user_merchant_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own merchant rules" ON user_merchant_rules;
CREATE POLICY "Users manage own merchant rules"
  ON user_merchant_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
