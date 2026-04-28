-- ============================================================
-- Cross-Device Sync Migration
-- Adds user_settings table + extends user_progress & profiles
-- so all meaningful app state lives in Supabase.
-- ============================================================

-- ── 1. user_settings ─────────────────────────────────────────
-- Stores device-preference data that should follow the user
-- across devices: sound, dark mode, daily XP goal, saved
-- calculator projection.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN     DEFAULT TRUE,
  dark_mode     BOOLEAN     DEFAULT NULL,   -- NULL = follow system preference
  daily_goal    INTEGER     DEFAULT 50,
  calc_saved    JSONB       DEFAULT NULL,   -- saved compound-growth calculator inputs
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON user_settings;
CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. Extend user_progress ──────────────────────────────────
-- Add columns for data that was previously localStorage-only.
-- All columns are nullable / have safe defaults so existing
-- rows are not affected.
-- ─────────────────────────────────────────────────────────────

-- Hearts regeneration tracking
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS last_heart_lost_at BIGINT DEFAULT NULL;

-- Perfect-lesson lifetime counter (for badge & profile display)
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS perfect_lessons_total INTEGER DEFAULT 0;

-- Daily lesson counter (resets each day, tracked by date)
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS daily_lessons_today INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_lessons_date  DATE    DEFAULT NULL;

-- Daily perfect-score counter
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS perfect_today      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS perfect_today_date DATE    DEFAULT NULL;

-- Budget planner daily tracking
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS expense_today      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expense_today_date DATE    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS budget_visited_date DATE   DEFAULT NULL;

-- Weekly challenge in-progress state
-- Structure: { "wc-7lessons": { lessonsCompleted, xpEarned, perfectLessons, dailyXp, completed } }
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS weekly_challenge_progress JSONB DEFAULT '{}';

-- One-shot analytics flags (prevent double-firing across devices)
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS first_lesson_fired  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS milestone_cta_shown BOOLEAN DEFAULT FALSE;

-- ── 3. Extend profiles ───────────────────────────────────────
-- Retention-ping tracking so events don't re-fire on a new device.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_ts        BIGINT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_fired  TEXT   DEFAULT '';
