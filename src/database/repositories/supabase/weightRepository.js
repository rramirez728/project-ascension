import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toEntry(row) {
  return {
    id: row.id,
    date: row.date,
    weight: Number(row.weight),
    note: row.note ?? undefined,
  };
}

/** @returns {Promise<import('../../../types/index.js').WeightEntry[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  throwIfError(error, 'Failed to load weight entries');
  return (data ?? []).map(toEntry);
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('weight_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load weight entry');
  return data ? toEntry(data) : null;
}

/** @param {string} start @param {string} end */
async function getByDateRange(start, end) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date');
  throwIfError(error, 'Failed to load weight entries');
  return (data ?? []).map(toEntry);
}

/** @param {Omit<import('../../../types/index.js').WeightEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('weight_entries').insert({
    id,
    user_id: userId,
    date: item.date,
    weight: item.weight,
    note: item.note ?? null,
  });
  throwIfError(error, 'Failed to create weight entry');
  return id;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').WeightEntry>} updates */
async function update(id, updates) {
  const { error } = await supabase.from('weight_entries').update({
    ...(updates.date !== undefined && { date: updates.date }),
    ...(updates.weight !== undefined && { weight: updates.weight }),
    ...(updates.note !== undefined && { note: updates.note ?? null }),
  }).eq('id', id);
  throwIfError(error, 'Failed to update weight entry');
}

/** @param {string} id */
async function remove(id) {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id);
  throwIfError(error, 'Failed to delete weight entry');
}

/** @returns {Promise<import('../../../types/index.js').WeightEntry|null>} */
async function getLatest() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwIfError(error, 'Failed to load latest weight');
  return data ? toEntry(data) : null;
}

export const weightRepository = {
  getAll,
  getById,
  getByDateRange,
  create,
  update,
  delete: remove,
  getLatest,
};
