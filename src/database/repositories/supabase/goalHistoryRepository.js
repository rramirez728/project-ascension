import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

function toSnapshot(row) {
  return {
    id: row.id,
    effectiveFrom: row.effective_from,
    dailyCalories: Number(row.daily_calories),
    proteinGoal: Number(row.protein_goal),
    carbGoal: Number(row.carb_goal),
    fatGoal: Number(row.fat_goal),
    goalWeight: row.goal_weight == null ? null : Number(row.goal_weight),
    source: row.source,
    createdAt: row.created_at,
  };
}

async function record(snapshot) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('nutrition_goal_history').insert({
    id,
    user_id: userId,
    effective_from: snapshot.effectiveFrom,
    daily_calories: snapshot.dailyCalories,
    protein_goal: snapshot.proteinGoal,
    carb_goal: snapshot.carbGoal,
    fat_goal: snapshot.fatGoal,
    goal_weight: snapshot.goalWeight ?? null,
    source: snapshot.source ?? 'user',
  });
  throwIfError(error, 'Failed to record goal history');
  return id;
}

async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('nutrition_goal_history')
    .select('*')
    .eq('user_id', userId)
    .order('effective_from');
  throwIfError(error, 'Failed to load goal history');
  return (data ?? []).map(toSnapshot);
}

async function getActiveOn(date) {
  const rows = await getAll();
  const applicable = rows.filter((row) => row.effectiveFrom <= date);
  return applicable.length ? applicable[applicable.length - 1] : null;
}

export const goalHistoryRepository = {
  record,
  getAll,
  getActiveOn,
};
