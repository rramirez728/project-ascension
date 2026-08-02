import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').MeasurementEntry[]>} */
async function getAll() {
  return db.measurements.orderBy('date').toArray();
}

/** @param {string} id */
async function getById(id) {
  return db.measurements.get(id) ?? null;
}

/** @param {string} date */
async function getByDate(date) {
  return db.measurements.where('date').equals(date).first() ?? null;
}

/** @param {Omit<import('../../types/index.js').MeasurementEntry, 'id'>} item */
async function create(item) {
  const id = generateId();
  await db.measurements.put({ ...item, id });
  return id;
}

/** @param {string} id @param {Partial<import('../../types/index.js').MeasurementEntry>} updates */
async function update(id, updates) {
  const existing = await getById(id);
  if (!existing) throw new Error('Measurement entry not found');
  await db.measurements.put({ ...existing, ...updates, id });
}

/** @param {string} id */
async function remove(id) {
  await db.measurements.delete(id);
}

export const measurementRepository = {
  getAll,
  getById,
  getByDate,
  create,
  update,
  delete: remove,
};
