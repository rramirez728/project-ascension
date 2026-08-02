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

/** @param {Omit<import('../../types/index.js').FoodEntry, 'id'>} item */
async function create(item) {
  const id = generateId();
  await db.foodEntries.put({ ...item, id });
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
  create,
  update,
  delete: remove,
};
