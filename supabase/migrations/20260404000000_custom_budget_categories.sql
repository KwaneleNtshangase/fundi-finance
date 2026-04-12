-- Custom budget categories per user
CREATE TABLE IF NOT EXISTS custom_budget_categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#9E9E9E',
  icon_name   TEXT        NOT NULL DEFAULT 'MoreHorizontal',
  type        TEXT        NOT NULL CHECK (type IN ('expense', 'income')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom categories"
  ON custom_budget_categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
