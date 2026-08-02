import { db } from './db.js';

/** Default user settings seeded on first launch. */
export const DEFAULT_SETTINGS = {
  id: 'user',
  goalWeight: 160,
  dailyCalories: 2000,
  proteinGoal: 150,
  carbGoal: 200,
  fatGoal: 65,
  waterGoal: 8,
  stepsGoal: 10000,
  sleepGoal: 8,
  units: 'lb',
  theme: 'dark',
  usdaApiKey: '',
};

/** Seed default settings if none exist. */
export async function seedDatabase() {
  const existing = await db.settings.get('user');
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS);
  } else if (existing.usdaApiKey === undefined) {
    await db.settings.put({ ...existing, usdaApiKey: '' });
  }
}
