import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').WorkoutEntry[]>} */
async function getAll() {
  return db.workouts.orderBy('date').toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.workouts.get(id) ?? null;
}

/** @param {string} date */
async function getByDate(date) {
  return db.workouts.where('date').equals(date).toArray();
}

/** @param {string} start @param {string} end */
async function getByDateRange(start, end) {
  return db.workouts
    .where('date')
    .between(start, end, true, true)
    .sortBy('date');
}

/** @param {Omit<import('../../types/index.js').WorkoutEntry, 'id'>} item */
async function create(item) {
  const id = generateId();
  await db.workouts.put({ ...item, id });
  return id;
}

/** @param {string} id @param {Partial<import('../../types/index.js').WorkoutEntry>} updates */
async function update(id, updates) {
  const existing = await getById(id);
  if (!existing) throw new Error('Workout entry not found');
  await db.workouts.put({ ...existing, ...updates, id });
}

/** @param {string} id */
async function remove(id) {
  await db.workouts.delete(id);
}

export const workoutRepository = {
  getAll,
  getById,
  getByDate,
  getByDateRange,
  create,
  update,
  delete: remove,
};
