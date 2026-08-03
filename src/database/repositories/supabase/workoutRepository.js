import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toEntry(row) {
  return {
    id: row.id,
    date: row.date,
    exercise: row.exercise,
    sets: Number(row.sets),
    reps: Number(row.reps),
    weight: Number(row.weight),
  };
}

/** @returns {Promise<import('../../../types/index.js').WorkoutEntry[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  throwIfError(error, 'Failed to load workouts');
  return (data ?? []).map(toEntry);
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('workout_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load workout');
  return data ? toEntry(data) : null;
}

/** @param {string} date */
async function getByDate(date) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);
  throwIfError(error, 'Failed to load workouts');
  return (data ?? []).map(toEntry);
}

/** @param {string} start @param {string} end */
async function getByDateRange(start, end) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date');
  throwIfError(error, 'Failed to load workouts');
  return (data ?? []).map(toEntry);
}

/** @param {Omit<import('../../../types/index.js').WorkoutEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('workout_entries').insert({
    id,
    user_id: userId,
    date: item.date,
    exercise: item.exercise,
    sets: item.sets,
    reps: item.reps,
    weight: item.weight,
  });
  throwIfError(error, 'Failed to create workout');
  return id;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').WorkoutEntry>} updates */
async function update(id, updates) {
  const row = {
    ...(updates.date !== undefined && { date: updates.date }),
    ...(updates.exercise !== undefined && { exercise: updates.exercise }),
    ...(updates.sets !== undefined && { sets: updates.sets }),
    ...(updates.reps !== undefined && { reps: updates.reps }),
    ...(updates.weight !== undefined && { weight: updates.weight }),
  };
  const { error } = await supabase.from('workout_entries').update(row).eq('id', id);
  throwIfError(error, 'Failed to update workout');
}

/** @param {string} id */
async function remove(id) {
  const { error } = await supabase.from('workout_entries').delete().eq('id', id);
  throwIfError(error, 'Failed to delete workout');
}

export const workoutRepository = {
  getAll,
  getById,
  getByDate,
  getByDateRange,
  create,
  update,
  delete: remove,
};
