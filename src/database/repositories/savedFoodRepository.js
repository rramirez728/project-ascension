import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').SavedFood[]>} */
async function getAll() {
  return db.savedFoods.orderBy('name').toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.savedFoods.get(id) ?? null;
}

/** @param {Omit<import('../../types/index.js').SavedFood, 'id' | 'savedAt'>} item */
async function create(item) {
  const id = generateId();
  await db.savedFoods.put({
    ...item,
    id,
    savedAt: new Date().toISOString(),
  });
  return id;
}

/** @param {string} id */
async function remove(id) {
  await db.savedFoods.delete(id);
}

/** Save or skip if identical fdcId/name already exists. */
async function saveIfNew(item) {
  const existing = await db.savedFoods.toArray();
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
