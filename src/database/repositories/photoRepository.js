import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').PhotoEntry[]>} */
async function getAll() {
  return db.photos.orderBy('date').reverse().toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.photos.get(id) ?? null;
}

/** @param {Omit<import('../../types/index.js').PhotoEntry, 'id'>} item */
async function create(item) {
  const id = generateId();
  await db.photos.put({ ...item, id });
  return id;
}

/** @param {string} id @param {Partial<import('../../types/index.js').PhotoEntry>} updates */
async function update(id, updates) {
  const existing = await getById(id);
  if (!existing) throw new Error('Photo not found');
  await db.photos.put({ ...existing, ...updates, id });
}

/** @param {string} id */
async function remove(id) {
  await db.photos.delete(id);
}

export const photoRepository = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
};
