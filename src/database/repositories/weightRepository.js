import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').WeightEntry[]>} */
async function getAll() {
  return db.weightEntries.orderBy('date').toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.weightEntries.get(id) ?? null;
}

/** @param {string} start @param {string} end */
async function getByDateRange(start, end) {
  return db.weightEntries
    .where('date')
    .between(start, end, true, true)
    .sortBy('date');
}

/** @param {Omit<import('../../types/index.js').WeightEntry, 'id'>} item */
async function create(item) {
  const id = generateId();
  await db.weightEntries.put({ ...item, id });
  return id;
}

/** @param {string} id @param {Partial<import('../../types/index.js').WeightEntry>} updates */
async function update(id, updates) {
  const existing = await getById(id);
  if (!existing) throw new Error('Weight entry not found');
  await db.weightEntries.put({ ...existing, ...updates, id });
}

/** @param {string} id */
async function remove(id) {
  await db.weightEntries.delete(id);
}

/** @returns {Promise<import('../../types/index.js').WeightEntry|null>} */
async function getLatest() {
  const entries = await db.weightEntries.orderBy('date').reverse().limit(1).toArray();
  return entries[0] ?? null;
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
