import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

function toSnapshot(row) {
  return {
    id: row.id,
    effectiveFrom: row.effectiveFrom,
    dailyCalories: Number(row.dailyCalories),
    proteinGoal: Number(row.proteinGoal),
    carbGoal: Number(row.carbGoal),
    fatGoal: Number(row.fatGoal),
    goalWeight: row.goalWeight == null ? null : Number(row.goalWeight),
    source: row.source ?? 'user',
    createdAt: row.createdAt,
  };
}

async function record(snapshot) {
  const id = generateId();
  const row = {
    id,
    effectiveFrom: snapshot.effectiveFrom,
    dailyCalories: snapshot.dailyCalories,
    proteinGoal: snapshot.proteinGoal,
    carbGoal: snapshot.carbGoal,
    fatGoal: snapshot.fatGoal,
    goalWeight: snapshot.goalWeight ?? null,
    source: snapshot.source ?? 'user',
    createdAt: new Date().toISOString(),
  };
  await db.goalHistory.put(row);
  return id;
}

async function getAll() {
  const rows = await db.goalHistory.orderBy('effectiveFrom').toArray();
  return rows.map(toSnapshot);
}

async function getActiveOn(date) {
  const rows = await getAll();
  const applicable = rows.filter((row) => row.effectiveFrom <= date);
  return applicable.length ? applicable[applicable.length - 1] : null;
}

export const goalHistoryRepository = {
  record,
  getAll,
  getActiveOn,
};
