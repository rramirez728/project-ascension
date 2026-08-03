import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toEntry(row) {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type,
    name: row.name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    fdcId: row.fdc_id ?? undefined,
  };
}

/** @returns {Promise<import('../../../types/index.js').FoodEntry[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  throwIfError(error, 'Failed to load food entries');
  return (data ?? []).map(toEntry);
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('food_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load food entry');
  return data ? toEntry(data) : null;
}

/** @param {string} date */
async function getByDate(date) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);
  throwIfError(error, 'Failed to load food entries');
  return (data ?? []).map(toEntry);
}

/** @param {Omit<import('../../../types/index.js').FoodEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('food_entries').insert({
    id,
    user_id: userId,
    date: item.date,
    meal_type: item.mealType,
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fdc_id: item.fdcId ?? null,
  });
  throwIfError(error, 'Failed to create food entry');
  return id;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').FoodEntry>} updates */
async function update(id, updates) {
  const row = {
    ...(updates.date !== undefined && { date: updates.date }),
    ...(updates.mealType !== undefined && { meal_type: updates.mealType }),
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.calories !== undefined && { calories: updates.calories }),
    ...(updates.protein !== undefined && { protein: updates.protein }),
    ...(updates.carbs !== undefined && { carbs: updates.carbs }),
    ...(updates.fat !== undefined && { fat: updates.fat }),
    ...(updates.fdcId !== undefined && { fdc_id: updates.fdcId ?? null }),
  };
  const { error } = await supabase.from('food_entries').update(row).eq('id', id);
  throwIfError(error, 'Failed to update food entry');
}

/** @param {string} id */
async function remove(id) {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  throwIfError(error, 'Failed to delete food entry');
}

export const foodRepository = {
  getAll,
  getById,
  getByDate,
  create,
  update,
  delete: remove,
};
