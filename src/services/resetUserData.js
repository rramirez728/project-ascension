import { db } from '../database/db.js';
import { supabase } from '../lib/supabase.js';
import { notifyDataChanged } from '../utils/dataEvents.js';

const LOCAL_TABLES = [
  'weightEntries',
  'measurements',
  'foodEntries',
  'workouts',
  'habits',
  'photos',
  'savedFoods',
  'goalHistory',
  'workoutPlans',
  'plannedWorkouts',
  'plannedExercises',
  'workoutSessions',
  'exerciseSets',
  'personalRecords',
  'aiConversations',
  'aiMessages',
  'aiActionLogs',
];

const CLOUD_TABLES = [
  'ai_action_logs',
  'ai_messages',
  'ai_conversations',
  'exercise_sets',
  'personal_records',
  'workout_sessions',
  'planned_exercises',
  'planned_workouts',
  'workout_plans',
  'nutrition_goal_history',
  'food_entries',
  'saved_foods',
  'weight_entries',
  'measurement_entries',
  'workout_entries',
  'habit_entries',
  'photo_entries',
];

async function clearPhotoFolder(bucket, userId) {
  const { data, error } = await supabase.storage.from(bucket).list(userId);
  if (error || !data?.length) return;
  const paths = data.filter((file) => file.name && file.id).map((file) => `${userId}/${file.name}`);
  if (!paths.length) return;
  await supabase.storage.from(bucket).remove(paths);
}

async function clearCloudData(userId) {
  for (const table of CLOUD_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) throw new Error(error.message || `Could not clear ${table}.`);
  }
  const { error: exerciseError } = await supabase.from('exercises').delete().eq('user_id', userId);
  if (exerciseError) throw new Error(exerciseError.message || 'Could not clear custom exercises.');
  await clearPhotoFolder('progress-photos', userId);
  await clearPhotoFolder('meal-photos', userId);
}

async function clearLocalData() {
  const tables = LOCAL_TABLES.map((name) => db[name]);
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()));
  });
}

/** Delete logged history. Keeps the account and the settings on the Settings page. */
export async function resetLoggedData() {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await clearCloudData(user.id);
  }
  await clearLocalData();
  notifyDataChanged();
}
