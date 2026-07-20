CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  custom_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bank accounts"
  ON bank_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alter budget_entries to link to bank_accounts and add entry_method
ALTER TABLE budget_entries
  ADD COLUMN account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  ADD COLUMN entry_method TEXT CHECK (entry_method IN ('imported', 'manual')) DEFAULT 'manual';

-- Index for querying bank accounts by user efficiently
CREATE INDEX IF NOT EXISTS bank_accounts_user_id_idx ON bank_accounts(user_id);
