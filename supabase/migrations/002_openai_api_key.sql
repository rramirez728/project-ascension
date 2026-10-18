-- Personal OpenAI keys stay on the user's own settings row.
-- This does not drop tables or rewrite existing logs.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS openai_api_key TEXT NOT NULL DEFAULT '';
