import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').FoodEntry[]>} */
async function getAll() {
  return db.foodEntries.orderBy('date').toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.foodEntries.get(id) ?? null;
}

/** @param {string} date */
async function getByDate(date) {
  return db.foodEntries.where('date').equals(date).toArray();
}

/** @param {string} start @param {string} end */
async function getByDateRange(start, end) {
  return db.foodEntries.where('date').between(start, end, true, true).sortBy('date');
}

async function findByClientRequestId(clientRequestId) {
  if (!clientRequestId) return null;
  return db.foodEntries.where('clientRequestId').equals(clientRequestId).first() ?? null;
}

/** @param {Omit<import('../../types/index.js').FoodEntry, 'id'>} item */
async function create(item) {
  if (item.clientRequestId) {
    const existing = await findByClientRequestId(item.clientRequestId);
    if (existing) return existing.id;
  }
  const id = generateId();
  await db.foodEntries.put({
    preparationState: 'unknown',
    source: 'user',
    confidence: 'high',
    ...item,
    id,
  });
  return id;
}

/** @param {string} id @param {Partial<import('../../types/index.js').FoodEntry>} updates */
async function update(id, updates) {
  const existing = await getById(id);
  if (!existing) throw new Error('Food entry not found');
  await db.foodEntries.put({ ...existing, ...updates, id });
}

/** @param {string} id */
async function remove(id) {
  await db.foodEntries.delete(id);
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
