-- Project Ascension — run in Supabase SQL Editor (Dashboard → SQL → New query)

-- Settings (one row per user)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_weight NUMERIC NOT NULL DEFAULT 160,
  daily_calories INTEGER NOT NULL DEFAULT 2000,
  protein_goal INTEGER NOT NULL DEFAULT 150,
  carb_goal INTEGER NOT NULL DEFAULT 200,
  fat_goal INTEGER NOT NULL DEFAULT 65,
  water_goal INTEGER NOT NULL DEFAULT 8,
  steps_goal INTEGER NOT NULL DEFAULT 10000,
  sleep_goal NUMERIC NOT NULL DEFAULT 8,
  units TEXT NOT NULL DEFAULT 'lb' CHECK (units IN ('lb', 'kg')),
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  usda_api_key TEXT DEFAULT '',
  openai_api_key TEXT NOT NULL DEFAULT ''
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Weight entries
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS weight_entries_user_date ON weight_entries(user_id, date);
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weight" ON weight_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Body measurements
CREATE TABLE IF NOT EXISTS measurement_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  waist NUMERIC, chest NUMERIC, neck NUMERIC, hips NUMERIC,
  left_arm NUMERIC, right_arm NUMERIC, left_thigh NUMERIC, right_thigh NUMERIC,
  body_fat NUMERIC
);

CREATE INDEX IF NOT EXISTS measurement_entries_user_date ON measurement_entries(user_id, date);
ALTER TABLE measurement_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own measurements" ON measurement_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Food log
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fdc_id TEXT
);

CREATE INDEX IF NOT EXISTS food_entries_user_date ON food_entries(user_id, date);
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own food" ON food_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Saved foods
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories NUMERIC NOT NULL DEFAULT 0,
  protein NUMERIC NOT NULL DEFAULT 0,
  carbs NUMERIC NOT NULL DEFAULT 0,
  fat NUMERIC NOT NULL DEFAULT 0,
  fdc_id TEXT,
  brand_owner TEXT,
  serving_description TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved foods" ON saved_foods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Workouts
CREATE TABLE IF NOT EXISTS workout_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  exercise TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS workout_entries_user_date ON workout_entries(user_id, date);
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own workouts" ON workout_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily habits
CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  water INTEGER NOT NULL DEFAULT 0,
  sleep NUMERIC NOT NULL DEFAULT 0,
  steps INTEGER NOT NULL DEFAULT 0,
  cardio BOOLEAN NOT NULL DEFAULT false,
  workout_done BOOLEAN NOT NULL DEFAULT false,
  mood INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS habit_entries_user_date ON habit_entries(user_id, date);
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON habit_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Progress photos (metadata; files in Storage bucket)
CREATE TABLE IF NOT EXISTS photo_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT
);

CREATE INDEX IF NOT EXISTS photo_entries_user_date ON photo_entries(user_id, date);
ALTER TABLE photo_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own photos" ON photo_entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Storage bucket for progress photos (create in Dashboard → Storage if this fails)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
