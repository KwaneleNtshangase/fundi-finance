ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS hearts integer NOT NULL DEFAULT 5 CHECK (hearts >= 0 AND hearts <= 5);
