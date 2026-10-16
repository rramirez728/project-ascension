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
    brand: row.brand ?? undefined,
    quantity: row.quantity == null ? null : Number(row.quantity),
    unit: row.unit ?? undefined,
    preparationState: row.preparation_state ?? 'unknown',
    mealTime: row.meal_time ?? undefined,
    source: row.source ?? 'user',
    confidence: row.confidence ?? 'high',
    sourceNote: row.source_note ?? undefined,
    clientRequestId: row.client_request_id ?? undefined,
  };
}

function foodRow(item, userId, id) {
  return {
    ...(id ? { id } : {}),
    ...(userId ? { user_id: userId } : {}),
    ...(item.date !== undefined && { date: item.date }),
    ...(item.mealType !== undefined && { meal_type: item.mealType }),
    ...(item.name !== undefined && { name: item.name }),
    ...(item.calories !== undefined && { calories: item.calories }),
    ...(item.protein !== undefined && { protein: item.protein }),
    ...(item.carbs !== undefined && { carbs: item.carbs }),
    ...(item.fat !== undefined && { fat: item.fat }),
    ...(item.fdcId !== undefined && { fdc_id: item.fdcId ?? null }),
    ...(item.brand !== undefined && { brand: item.brand ?? null }),
    ...(item.quantity !== undefined && { quantity: item.quantity ?? null }),
    ...(item.unit !== undefined && { unit: item.unit ?? null }),
    ...(item.preparationState !== undefined && { preparation_state: item.preparationState }),
    ...(item.mealTime !== undefined && { meal_time: item.mealTime ?? null }),
    ...(item.source !== undefined && { source: item.source }),
    ...(item.confidence !== undefined && { confidence: item.confidence }),
    ...(item.sourceNote !== undefined && { source_note: item.sourceNote ?? null }),
    ...(item.clientRequestId !== undefined && { client_request_id: item.clientRequestId ?? null }),
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

/** @param {string} start @param {string} end */
async function getByDateRange(start, end) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date');
  throwIfError(error, 'Failed to load food entries');
  return (data ?? []).map(toEntry);
}

/** @param {Omit<import('../../../types/index.js').FoodEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  if (item.clientRequestId) {
    const existing = await findByClientRequestId(item.clientRequestId);
    if (existing) return existing.id;
  }
  const id = generateId();
  const { error } = await supabase.from('food_entries').insert(foodRow(item, userId, id));
  if (error?.code === '23505' && item.clientRequestId) {
    const existing = await findByClientRequestId(item.clientRequestId);
    if (existing) return existing.id;
  }
  throwIfError(error, 'Failed to create food entry');
  return id;
}

async function findByClientRequestId(clientRequestId) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('client_request_id', clientRequestId)
    .maybeSingle();
  throwIfError(error, 'Failed to load food entry');
  return data ? toEntry(data) : null;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').FoodEntry>} updates */
async function update(id, updates) {
  const { error } = await supabase.from('food_entries').update(foodRow(updates)).eq('id', id);
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
  getByDateRange,
  findByClientRequestId,
  create,
  update,
  delete: remove,
};
