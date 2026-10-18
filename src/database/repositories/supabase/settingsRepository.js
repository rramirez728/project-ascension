import { supabase } from '../../../lib/supabase.js';
import { DEFAULT_SETTINGS } from '../../seed.js';
import { getUserId, throwIfError } from './helpers.js';

/** @param {Record<string, unknown>} row */
function toSettings(row) {
  return {
    id: row.user_id,
    goalWeight: Number(row.goal_weight),
    dailyCalories: Number(row.daily_calories),
    proteinGoal: Number(row.protein_goal),
    carbGoal: Number(row.carb_goal),
    fatGoal: Number(row.fat_goal),
    waterGoal: Number(row.water_goal),
    stepsGoal: Number(row.steps_goal),
    sleepGoal: Number(row.sleep_goal),
    units: row.units,
    theme: row.theme,
    usdaApiKey: row.usda_api_key ?? '',
    openaiApiKey: row.openai_api_key ?? '',
    displayName: row.display_name ?? '',
    age: row.age == null ? null : Number(row.age),
    sex: row.sex ?? null,
    heightCm: row.height_cm == null ? null : Number(row.height_cm),
    activityLevel: row.activity_level ?? 'moderately_active',
    fitnessGoal: row.fitness_goal ?? 'maintain',
    activitySource: row.activity_source ?? 'manual',
    calorieTargetManual: Boolean(row.calorie_target_manual),
    proteinTargetManual: Boolean(row.protein_target_manual),
    carbTargetManual: Boolean(row.carb_target_manual),
    fatTargetManual: Boolean(row.fat_target_manual),
    onboardingComplete: Boolean(row.onboarding_complete),
    calorieAdjustment: row.calorie_adjustment == null ? 250 : Number(row.calorie_adjustment),
    trustedAutoLogging: Boolean(row.trusted_auto_logging),
  };
}

/** @param {Partial<import('../../../types/index.js').UserSettings>} updates @param {string} userId */
function toRow(updates, userId) {
  return {
    user_id: userId,
    ...(updates.goalWeight !== undefined && { goal_weight: updates.goalWeight }),
    ...(updates.dailyCalories !== undefined && { daily_calories: updates.dailyCalories }),
    ...(updates.proteinGoal !== undefined && { protein_goal: updates.proteinGoal }),
    ...(updates.carbGoal !== undefined && { carb_goal: updates.carbGoal }),
    ...(updates.fatGoal !== undefined && { fat_goal: updates.fatGoal }),
    ...(updates.waterGoal !== undefined && { water_goal: updates.waterGoal }),
    ...(updates.stepsGoal !== undefined && { steps_goal: updates.stepsGoal }),
    ...(updates.sleepGoal !== undefined && { sleep_goal: updates.sleepGoal }),
    ...(updates.units !== undefined && { units: updates.units }),
    ...(updates.theme !== undefined && { theme: updates.theme }),
    ...(updates.usdaApiKey !== undefined && { usda_api_key: updates.usdaApiKey }),
    ...(updates.openaiApiKey !== undefined && { openai_api_key: updates.openaiApiKey }),
    ...(updates.displayName !== undefined && { display_name: updates.displayName }),
    ...(updates.age !== undefined && { age: updates.age }),
    ...(updates.sex !== undefined && { sex: updates.sex }),
    ...(updates.heightCm !== undefined && { height_cm: updates.heightCm }),
    ...(updates.activityLevel !== undefined && { activity_level: updates.activityLevel }),
    ...(updates.fitnessGoal !== undefined && { fitness_goal: updates.fitnessGoal }),
    ...(updates.activitySource !== undefined && { activity_source: updates.activitySource }),
    ...(updates.calorieTargetManual !== undefined && { calorie_target_manual: updates.calorieTargetManual }),
    ...(updates.proteinTargetManual !== undefined && { protein_target_manual: updates.proteinTargetManual }),
    ...(updates.carbTargetManual !== undefined && { carb_target_manual: updates.carbTargetManual }),
    ...(updates.fatTargetManual !== undefined && { fat_target_manual: updates.fatTargetManual }),
    ...(updates.onboardingComplete !== undefined && { onboarding_complete: updates.onboardingComplete }),
    ...(updates.calorieAdjustment !== undefined && { calorie_adjustment: updates.calorieAdjustment }),
    ...(updates.trustedAutoLogging !== undefined && { trusted_auto_logging: updates.trustedAutoLogging }),
  };
}

async function seedSettings(userId) {
  const row = {
    user_id: userId,
    goal_weight: DEFAULT_SETTINGS.goalWeight,
    daily_calories: DEFAULT_SETTINGS.dailyCalories,
    protein_goal: DEFAULT_SETTINGS.proteinGoal,
    carb_goal: DEFAULT_SETTINGS.carbGoal,
    fat_goal: DEFAULT_SETTINGS.fatGoal,
    water_goal: DEFAULT_SETTINGS.waterGoal,
    steps_goal: DEFAULT_SETTINGS.stepsGoal,
    sleep_goal: DEFAULT_SETTINGS.sleepGoal,
    units: DEFAULT_SETTINGS.units,
    theme: DEFAULT_SETTINGS.theme,
    usda_api_key: DEFAULT_SETTINGS.usdaApiKey ?? '',
    openai_api_key: DEFAULT_SETTINGS.openaiApiKey ?? '',
    display_name: DEFAULT_SETTINGS.displayName,
    age: DEFAULT_SETTINGS.age,
    sex: DEFAULT_SETTINGS.sex,
    height_cm: DEFAULT_SETTINGS.heightCm,
    activity_level: DEFAULT_SETTINGS.activityLevel,
    fitness_goal: DEFAULT_SETTINGS.fitnessGoal,
    activity_source: DEFAULT_SETTINGS.activitySource,
    calorie_target_manual: DEFAULT_SETTINGS.calorieTargetManual,
    protein_target_manual: DEFAULT_SETTINGS.proteinTargetManual,
    carb_target_manual: DEFAULT_SETTINGS.carbTargetManual,
    fat_target_manual: DEFAULT_SETTINGS.fatTargetManual,
    onboarding_complete: DEFAULT_SETTINGS.onboardingComplete,
    calorie_adjustment: DEFAULT_SETTINGS.calorieAdjustment,
    trusted_auto_logging: DEFAULT_SETTINGS.trustedAutoLogging,
  };
  const { error } = await supabase.from('user_settings').upsert(row);
  throwIfError(error, 'Failed to seed settings');
}

/** @returns {Promise<import('../../../types/index.js').UserSettings>} */
async function getSettings() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throwIfError(error, 'Failed to load settings');
  if (!data) {
    await seedSettings(userId);
    return getSettings();
  }
  return toSettings(data);
}

/** @param {Partial<import('../../../types/index.js').UserSettings>} updates */
async function updateSettings(updates) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('user_settings')
    .upsert({ ...toRow(updates, userId), user_id: userId });
  throwIfError(error, 'Failed to update settings');
}

export const settingsRepository = {
  get: getSettings,
  update: updateSettings,
};
