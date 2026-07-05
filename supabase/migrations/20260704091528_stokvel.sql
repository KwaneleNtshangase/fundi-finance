-- Stokvel (Group Savings) Module Schema
-- NOTE: These tables already exist in the live database. This file is for version control only.

CREATE TABLE IF NOT EXISTS stokvels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  contribution_amount numeric NOT NULL,
  frequency text DEFAULT 'monthly',
  invite_code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stokvel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stokvel_id uuid REFERENCES stokvels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  display_name text,
  payout_position int,
  is_admin boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(stokvel_id, user_id)
);

CREATE TABLE IF NOT EXISTS stokvel_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stokvel_id uuid REFERENCES stokvels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  amount numeric NOT NULL,
  cycle date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Row Level Security (RLS) Policies

ALTER TABLE stokvels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stokvel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE stokvel_contributions ENABLE ROW LEVEL SECURITY;

-- Stokvels RLS
-- Members can view their stokvels
CREATE POLICY "Members can view stokvels" ON stokvels
  FOR SELECT
  USING (
    id IN (
      SELECT stokvel_id FROM stokvel_members WHERE user_id = auth.uid()
    )
  );

-- Any authenticated user can create a stokvel
CREATE POLICY "Users can create stokvels" ON stokvels
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Creators can update their stokvels
CREATE POLICY "Creators can update stokvels" ON stokvels
  FOR UPDATE
  USING (created_by = auth.uid());

-- Creators can delete their stokvels
CREATE POLICY "Creators can delete stokvels" ON stokvels
  FOR DELETE
  USING (created_by = auth.uid());


-- Stokvel Members RLS
-- Members can view other members in their stokvels
CREATE POLICY "Members can view stokvel members" ON stokvel_members
  FOR SELECT
  USING (
    stokvel_id IN (
      SELECT stokvel_id FROM stokvel_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert themselves into a stokvel (join)
CREATE POLICY "Users can join stokvels" ON stokvel_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can update members (e.g. payout position)
CREATE POLICY "Admins can update members" ON stokvel_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stokvel_members
      WHERE stokvel_id = stokvel_members.stokvel_id
      AND user_id = auth.uid()
      AND is_admin = true
    )
  );


-- Stokvel Contributions RLS
-- Members can view contributions for their stokvels
CREATE POLICY "Members can view contributions" ON stokvel_contributions
  FOR SELECT
  USING (
    stokvel_id IN (
      SELECT stokvel_id FROM stokvel_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own contributions
CREATE POLICY "Users can insert own contributions" ON stokvel_contributions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
