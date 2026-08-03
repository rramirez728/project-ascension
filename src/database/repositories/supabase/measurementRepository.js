import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toEntry(row) {
  return {
    id: row.id,
    date: row.date,
    waist: row.waist != null ? Number(row.waist) : null,
    chest: row.chest != null ? Number(row.chest) : null,
    neck: row.neck != null ? Number(row.neck) : null,
    hips: row.hips != null ? Number(row.hips) : null,
    leftArm: row.left_arm != null ? Number(row.left_arm) : null,
    rightArm: row.right_arm != null ? Number(row.right_arm) : null,
    leftThigh: row.left_thigh != null ? Number(row.left_thigh) : null,
    rightThigh: row.right_thigh != null ? Number(row.right_thigh) : null,
    bodyFat: row.body_fat != null ? Number(row.body_fat) : null,
  };
}

/** @param {Partial<import('../../../types/index.js').MeasurementEntry>} item */
function toRow(item) {
  return {
    ...(item.date !== undefined && { date: item.date }),
    ...(item.waist !== undefined && { waist: item.waist }),
    ...(item.chest !== undefined && { chest: item.chest }),
    ...(item.neck !== undefined && { neck: item.neck }),
    ...(item.hips !== undefined && { hips: item.hips }),
    ...(item.leftArm !== undefined && { left_arm: item.leftArm }),
    ...(item.rightArm !== undefined && { right_arm: item.rightArm }),
    ...(item.leftThigh !== undefined && { left_thigh: item.leftThigh }),
    ...(item.rightThigh !== undefined && { right_thigh: item.rightThigh }),
    ...(item.bodyFat !== undefined && { body_fat: item.bodyFat }),
  };
}

/** @returns {Promise<import('../../../types/index.js').MeasurementEntry[]>} */
async function getAll() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('measurement_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  throwIfError(error, 'Failed to load measurements');
  return (data ?? []).map(toEntry);
}

/** @param {string} id */
async function getById(id) {
  const { data, error } = await supabase.from('measurement_entries').select('*').eq('id', id).maybeSingle();
  throwIfError(error, 'Failed to load measurement');
  return data ? toEntry(data) : null;
}

/** @param {string} date */
async function getByDate(date) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('measurement_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  throwIfError(error, 'Failed to load measurement');
  return data ? toEntry(data) : null;
}

/** @param {Omit<import('../../../types/index.js').MeasurementEntry, 'id'>} item */
async function create(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('measurement_entries').insert({
    id,
    user_id: userId,
    ...toRow(item),
    date: item.date,
  });
  throwIfError(error, 'Failed to create measurement');
  return id;
}

/** @param {string} id @param {Partial<import('../../../types/index.js').MeasurementEntry>} updates */
async function update(id, updates) {
  const { error } = await supabase.from('measurement_entries').update(toRow(updates)).eq('id', id);
  throwIfError(error, 'Failed to update measurement');
}

/** @param {string} id */
async function remove(id) {
  const { error } = await supabase.from('measurement_entries').delete().eq('id', id);
  throwIfError(error, 'Failed to delete measurement');
}

export const measurementRepository = {
  getAll,
  getById,
  getByDate,
  create,
  update,
  delete: remove,
};
