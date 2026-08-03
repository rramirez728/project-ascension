import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toEntry(row) {
  return {
    id: row.id,
    name: row.name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    fdcId: row.fdc_id ?? undefined,
    brandOwner: row.brand_owner ?? undefined,
    servingDescription: row.serving_description ?? undefined,
    savedAt: row.saved_at,
  };
}

/** @returns {Promise<import('../../../types/index.js').SavedFood[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('saved_foods')
    .select('*')
    .eq('user_id', userId)
    .order('name');
  throwIfError(error, 'Failed to load saved foods');
  return (data ?? []).map(toEntry);
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('saved_foods').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load saved food');
  return data ? toEntry(data) : null;
}

/** @param {Omit<import('../../../types/index.js').SavedFood, 'id' | 'savedAt'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('saved_foods').insert({
    id,
    user_id: userId,
    name: item.name,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fdc_id: item.fdcId ?? null,
    brand_owner: item.brandOwner ?? null,
    serving_description: item.servingDescription ?? null,
  });
  throwIfError(error, 'Failed to save food');
  return id;
}

/** @param {string} id */
async function remove(id) {
  const { error } = await supabase.from('saved_foods').delete().eq('id', id);
  throwIfError(error, 'Failed to delete saved food');
}

/** Save or skip if identical fdcId/name already exists. */
async function saveIfNew(item) {
  const existing = await getAll();
  const duplicate = existing.find(
    (f) => (item.fdcId && f.fdcId === item.fdcId) || f.name.toLowerCase() === item.name.toLowerCase()
  );
  if (duplicate) return duplicate.id;
  return create(item);
}

export const savedFoodRepository = {
  getAll,
  getById,
  create,
  delete: remove,
  saveIfNew,
};
