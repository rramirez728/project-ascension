import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').HabitEntry[]>} */
async function getAll() {
  return db.habits.orderBy('date').toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.habits.get(id) ?? null;
}

/** @param {string} date */
async function getByDate(date) {
  return db.habits.where('date').equals(date).first() ?? null;
}

/** @param {Omit<import('../../types/index.js').HabitEntry, 'id'>} item */
async function create(item) {
  const id = generateId();
  await db.habits.put({ ...item, id });
  return id;
}

/** @param {string} id @param {Partial<import('../../types/index.js').HabitEntry>} updates */
async function update(id, updates) {
  const existing = await getById(id);
  if (!existing) throw new Error('Habit entry not found');
  await db.habits.put({ ...existing, ...updates, id });
}

/** @param {string} id */
async function remove(id) {
  await db.habits.delete(id);
}

/** Upsert habit for a given date. */
async function upsertForDate(date, data) {
  const existing = await getByDate(date);
  if (existing) {
    await update(existing.id, data);
    return existing.id;
  }
  return create({ date, water: 0, sleep: 0, steps: 0, cardio: false, workoutDone: false, mood: null, ...data });
}

export const habitRepository = {
  getAll,
  getById,
  getByDate,
  create,
  update,
  delete: remove,
  upsertForDate,
};
