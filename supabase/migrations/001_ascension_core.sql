-- Additive migration for Project Ascension.
-- Run supabase/schema.sql first on a brand-new database.
-- This file does not drop existing tables or rewrite historical nutrition values.

-- ---------------------------------------------------------------------------
-- Profile, goal locks, and preferences
-- ---------------------------------------------------------------------------

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS sex TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS activity_level TEXT NOT NULL DEFAULT 'moderately_active',
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT NOT NULL DEFAULT 'maintain',
  ADD COLUMN IF NOT EXISTS activity_source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS calorie_target_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS protein_target_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS carb_target_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fat_target_manual BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calorie_adjustment INTEGER NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS trusted_auto_logging BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goals_locked_at_migration BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_sex_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_sex_check
  CHECK (sex IS NULL OR sex IN ('male', 'female'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_activity_level_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_activity_level_check
  CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_fitness_goal_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_fitness_goal_check
  CHECK (fitness_goal IN ('cut', 'maintain', 'bulk'));

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_activity_source_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_activity_source_check
  CHECK (activity_source IN ('manual', 'healthkit'));

-- Existing accounts already chose the targets stored on this row.
-- The flag makes the update safe to re-run.
UPDATE user_settings
SET
  calorie_target_manual = true,
  protein_target_manual = true,
  carb_target_manual = true,
  fat_target_manual = true,
  onboarding_complete = true,
  goals_locked_at_migration = true
WHERE goals_locked_at_migration = false;

-- ---------------------------------------------------------------------------
-- Food log detail (historical macros stay on the row)
-- ---------------------------------------------------------------------------

ALTER TABLE food_entries
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS preparation_state TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS meal_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS confidence TEXT NOT NULL DEFAULT 'high',
  ADD COLUMN IF NOT EXISTS source_note TEXT,
  ADD COLUMN IF NOT EXISTS client_request_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE food_entries DROP CONSTRAINT IF EXISTS food_entries_preparation_state_check;
ALTER TABLE food_entries ADD CONSTRAINT food_entries_preparation_state_check
  CHECK (preparation_state IN ('raw', 'cooked', 'unknown'));

ALTER TABLE food_entries DROP CONSTRAINT IF EXISTS food_entries_source_check;
ALTER TABLE food_entries ADD CONSTRAINT food_entries_source_check
  CHECK (source IN ('usda', 'label', 'estimate', 'custom', 'user'));

ALTER TABLE food_entries DROP CONSTRAINT IF EXISTS food_entries_confidence_check;
ALTER TABLE food_entries ADD CONSTRAINT food_entries_confidence_check
  CHECK (confidence IN ('high', 'medium', 'low'));

CREATE UNIQUE INDEX IF NOT EXISTS food_entries_client_request
  ON food_entries (user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;

ALTER TABLE weight_entries
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS food_entries_updated_at ON food_entries;
CREATE TRIGGER food_entries_updated_at
  BEFORE UPDATE ON food_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS weight_entries_updated_at ON weight_entries;
CREATE TRIGGER weight_entries_updated_at
  BEFORE UPDATE ON weight_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Goal history
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS nutrition_goal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  effective_from TEXT NOT NULL,
  daily_calories INTEGER NOT NULL,
  protein_goal INTEGER NOT NULL,
  carb_goal INTEGER NOT NULL,
  fat_goal INTEGER NOT NULL,
  goal_weight NUMERIC,
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'calculator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_goal_history_user_date
  ON nutrition_goal_history (user_id, effective_from);

ALTER TABLE nutrition_goal_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own goal history" ON nutrition_goal_history;
CREATE POLICY "Users manage own goal history" ON nutrition_goal_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO nutrition_goal_history (
  user_id, effective_from, daily_calories, protein_goal, carb_goal, fat_goal, goal_weight, source
)
SELECT
  user_id,
  to_char(now(), 'YYYY-MM-DD'),
  daily_calories,
  protein_goal,
  carb_goal,
  fat_goal,
  goal_weight,
  'user'
FROM user_settings s
WHERE NOT EXISTS (
  SELECT 1 FROM nutrition_goal_history h WHERE h.user_id = s.user_id
);

-- ---------------------------------------------------------------------------
-- Training
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL DEFAULT 'other',
  aliases TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS exercises_shared_name
  ON exercises (lower(name)) WHERE user_id IS NULL;

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read exercises" ON exercises;
CREATE POLICY "Read exercises" ON exercises
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "Insert own exercises" ON exercises;
CREATE POLICY "Insert own exercises" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Update own exercises" ON exercises;
CREATE POLICY "Update own exercises" ON exercises
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Delete own exercises" ON exercises;
CREATE POLICY "Delete own exercises" ON exercises
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

INSERT INTO exercises (name, muscle_group, aliases) VALUES
  ('Bench Press', 'chest', ARRAY['barbell bench', 'flat bench']),
  ('Incline Dumbbell Press', 'chest', ARRAY['incline press']),
  ('Lat Pulldown', 'back', ARRAY['lat pull down', 'pulldown']),
  ('Cable Row', 'back', ARRAY['seated row', 'seated cable row']),
  ('Barbell Row', 'back', ARRAY['bent over row']),
  ('Pull Up', 'back', ARRAY['pullup', 'chin up']),
  ('Overhead Press', 'shoulders', ARRAY['ohp', 'shoulder press', 'military press']),
  ('Lateral Raise', 'shoulders', ARRAY['side raise']),
  ('Squat', 'legs', ARRAY['back squat', 'barbell squat']),
  ('Romanian Deadlift', 'legs', ARRAY['rdl']),
  ('Leg Press', 'legs', ARRAY[]::text[]),
  ('Leg Curl', 'legs', ARRAY['hamstring curl']),
  ('Leg Extension', 'legs', ARRAY[]::text[]),
  ('Walking Lunge', 'legs', ARRAY['lunges']),
  ('Calf Raise', 'legs', ARRAY[]::text[]),
  ('Bicep Curl', 'biceps', ARRAY['dumbbell curl', 'barbell curl']),
  ('Hammer Curl', 'biceps', ARRAY[]::text[]),
  ('Tricep Pushdown', 'triceps', ARRAY['cable pushdown']),
  ('Skull Crusher', 'triceps', ARRAY['lying tricep extension']),
  ('Plank', 'abs', ARRAY[]::text[]),
  ('Hanging Leg Raise', 'abs', ARRAY[]::text[])
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Split',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_plans_user ON workout_plans (user_id, is_active);
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own plans" ON workout_plans;
CREATE POLICY "Users manage own plans" ON workout_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  focus TEXT NOT NULL DEFAULT 'Rest',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'skipped', 'rescheduled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, weekday)
);

CREATE INDEX IF NOT EXISTS planned_workouts_user ON planned_workouts (user_id, plan_id);
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own planned workouts" ON planned_workouts;
CREATE POLICY "Users manage own planned workouts" ON planned_workouts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS planned_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planned_workout_id UUID NOT NULL REFERENCES planned_workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  sets INTEGER NOT NULL DEFAULT 3,
  target_reps TEXT NOT NULL DEFAULT '8-12',
  suggested_weight NUMERIC,
  rest_seconds INTEGER,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planned_exercises_workout ON planned_exercises (planned_workout_id, sort_order);
ALTER TABLE planned_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own planned exercises" ON planned_exercises;
CREATE POLICY "Users manage own planned exercises" ON planned_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'skipped', 'partial')),
  notes TEXT,
  planned_workout_id UUID REFERENCES planned_workouts(id) ON DELETE SET NULL,
  legacy_entry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workout_sessions_legacy
  ON workout_sessions (legacy_entry_id) WHERE legacy_entry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS workout_sessions_user_date ON workout_sessions (user_id, date);
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own sessions" ON workout_sessions;
CREATE POLICY "Users manage own sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  set_index INTEGER NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'lb' CHECK (unit IN ('lb', 'kg')),
  is_warmup BOOLEAN NOT NULL DEFAULT false,
  is_failure BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'user',
  client_request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercise_sets_session ON exercise_sets (session_id, exercise_name, set_index);
CREATE UNIQUE INDEX IF NOT EXISTS exercise_sets_client_request
  ON exercise_sets (user_id, client_request_id)
  WHERE client_request_id IS NOT NULL;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own sets" ON exercise_sets;
CREATE POLICY "Users manage own sets" ON exercise_sets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('max_weight', 'reps_at_weight', 'session_volume', 'estimated_1rm')),
  value NUMERIC NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  unit TEXT NOT NULL DEFAULT 'lb',
  is_estimated BOOLEAN NOT NULL DEFAULT false,
  achieved_on TEXT NOT NULL,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS personal_records_user_exercise
  ON personal_records (user_id, exercise_name, record_type);
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own records" ON personal_records;
CREATE POLICY "Users manage own records" ON personal_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Expand legacy aggregate workout rows into identical sets. Variable reps were never stored.
INSERT INTO workout_sessions (user_id, date, status, notes, legacy_entry_id)
SELECT w.user_id, w.date, 'completed', 'legacy_aggregate', w.id
FROM workout_entries w
WHERE NOT EXISTS (
  SELECT 1 FROM workout_sessions s WHERE s.legacy_entry_id = w.id
);

INSERT INTO exercise_sets (
  user_id, session_id, exercise_name, set_index, weight, reps, unit, is_warmup, source
)
SELECT
  w.user_id,
  s.id,
  w.exercise,
  g.i,
  w.weight,
  w.reps,
  COALESCE(us.units, 'lb'),
  false,
  'legacy_aggregate'
FROM workout_entries w
JOIN workout_sessions s ON s.legacy_entry_id = w.id
LEFT JOIN user_settings us ON us.user_id = w.user_id
JOIN LATERAL generate_series(1, w.sets) AS g(i) ON true
WHERE w.sets > 0
  AND NOT EXISTS (
    SELECT 1 FROM exercise_sets es WHERE es.session_id = s.id
  );

-- ---------------------------------------------------------------------------
-- AI audit trail
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_conversations_user ON ai_conversations (user_id, updated_at DESC);
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own conversations" ON ai_conversations;
CREATE POLICY "Users manage own conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_messages_conversation ON ai_messages (conversation_id, created_at);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own messages" ON ai_messages;
CREATE POLICY "Users manage own messages" ON ai_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS ai_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  tool_name TEXT NOT NULL,
  args JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('pending', 'applied', 'rejected', 'failed')),
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ai_action_logs_idempotency
  ON ai_action_logs (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_action_logs_user ON ai_action_logs (user_id, created_at DESC);
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own action logs" ON ai_action_logs;
CREATE POLICY "Users manage own action logs" ON ai_action_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own meal photos" ON storage.objects;
CREATE POLICY "Users upload own meal photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users read own meal photos" ON storage.objects;
CREATE POLICY "Users read own meal photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own meal photos" ON storage.objects;
CREATE POLICY "Users delete own meal photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
