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
  displayName: '',
  age: null,
  sex: null,
  heightCm: null,
  activityLevel: 'moderately_active',
  fitnessGoal: 'maintain',
  activitySource: 'manual',
  calorieTargetManual: false,
  proteinTargetManual: false,
  carbTargetManual: false,
  fatTargetManual: false,
  onboardingComplete: false,
  calorieAdjustment: 250,
  trustedAutoLogging: false,
};

/** Seed default settings if none exist. */
export async function seedDatabase() {
  const existing = await db.settings.get('user');
  if (!existing) {
    await db.settings.put(DEFAULT_SETTINGS);
    return;
  }

  const migrated = { ...DEFAULT_SETTINGS, ...existing, id: 'user' };
  if (existing.onboardingComplete === undefined) {
    migrated.onboardingComplete = true;
    migrated.calorieTargetManual = true;
    migrated.proteinTargetManual = true;
    migrated.carbTargetManual = true;
    migrated.fatTargetManual = true;
  }
  if (existing.usdaApiKey === undefined) migrated.usdaApiKey = '';
  await db.settings.put(migrated);
}
