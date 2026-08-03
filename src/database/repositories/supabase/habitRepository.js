import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toEntry(row) {
  return {
    id: row.id,
    date: row.date,
    water: Number(row.water),
    sleep: Number(row.sleep),
    steps: Number(row.steps),
    cardio: Boolean(row.cardio),
    workoutDone: Boolean(row.workout_done),
    mood: row.mood ?? null,
  };
}

/** @param {Partial<import('../../../types/index.js').HabitEntry>} item */
function toRow(item) {
  return {
    ...(item.date !== undefined && { date: item.date }),
    ...(item.water !== undefined && { water: item.water }),
    ...(item.sleep !== undefined && { sleep: item.sleep }),
    ...(item.steps !== undefined && { steps: item.steps }),
    ...(item.cardio !== undefined && { cardio: item.cardio }),
    ...(item.workoutDone !== undefined && { workout_done: item.workoutDone }),
    ...(item.mood !== undefined && { mood: item.mood }),
  };
}

/** @returns {Promise<import('../../../types/index.js').HabitEntry[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('habit_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  throwIfError(error, 'Failed to load habits');
  return (data ?? []).map(toEntry);
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('habit_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load habit');
  return data ? toEntry(data) : null;
}

/** @param {string} date */
async function getByDate(date) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('habit_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  throwIfError(error, 'Failed to load habit');
  return data ? toEntry(data) : null;
}

/** @param {Omit<import('../../../types/index.js').HabitEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('habit_entries').insert({
    id,
    user_id: userId,
    ...toRow(item),
    date: item.date,
  });
  throwIfError(error, 'Failed to create habit');
  return id;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').HabitEntry>} updates */
async function update(id, updates) {
  const { error } = await supabase.from('habit_entries').update(toRow(updates)).eq('id', id);
  throwIfError(error, 'Failed to update habit');
}

/** @param {string} id */
async function remove(id) {
  const { error } = await supabase.from('habit_entries').delete().eq('id', id);
  throwIfError(error, 'Failed to delete habit');
}

/** Upsert habit for a given date. */
async function upsertForDate(date, data) {
  const existing = await getByDate(date);
  if (existing) {
    await update(existing.id, data);
    return existing.id;
  }
  return create({
    date,
    water: 0,
    sleep: 0,
    steps: 0,
    cardio: false,
    workoutDone: false,
    mood: null,
    ...data,
  });
}

export const habitRepository = {
  getAll,
  getById,
  getByDate,
  create,
  update,
  delete: remove,
  upsertForDate,
};
