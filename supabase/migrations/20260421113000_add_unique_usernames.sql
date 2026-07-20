ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_username_format_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_username_format_check
CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
ON profiles (lower(username))
WHERE username IS NOT NULL;
