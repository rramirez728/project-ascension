import { convertWeight } from '../../utils/units.js';

/** Activity multipliers applied to BMR. These are estimates, not measurements. */
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

export const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Lightly active', detail: 'Light exercise 1–3 days a week' },
  { value: 'moderately_active', label: 'Moderately active', detail: 'Moderate exercise 3–5 days a week' },
  { value: 'very_active', label: 'Very active', detail: 'Hard exercise 6–7 days a week' },
  { value: 'extremely_active', label: 'Extremely active', detail: 'Physical job or twice-daily training' },
];

export const FITNESS_GOALS = [
  { value: 'cut', label: 'Cutting', detail: 'Fat loss with a moderate deficit' },
  { value: 'maintain', label: 'Maintenance', detail: 'Estimated maintenance, including recomposition' },
  { value: 'bulk', label: 'Bulking', detail: 'Muscle gain with a moderate surplus' },
];

/**
 * Mifflin–St Jeor BMR in kcal/day.
 * @param {{ sex: 'male'|'female', weightKg: number, heightCm: number, age: number }} input
 */
export function calculateBmr({ sex, weightKg, heightCm, age }) {
  if (sex !== 'male' && sex !== 'female') return null;
  if (!weightKg || !heightCm || !age) return null;
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return Math.round(sex === 'male' ? base + 5 : base - 161);
}

/** TDEE from BMR and a single activity factor. Does not add a second activity source. */
export function calculateTdee(bmr, activityLevel) {
  if (!bmr) return null;
  const factor = ACTIVITY_FACTORS[activityLevel] ?? ACTIVITY_FACTORS.sedentary;
  return Math.round(bmr * factor);
}

/**
 * Suggested calorie target. Cutting defaults to 250 below maintenance (within 200–300).
 * @param {number|null} tdee
 * @param {'cut'|'maintain'|'bulk'} fitnessGoal
 * @param {number} [adjustment]
 */
export function suggestCalorieTarget(tdee, fitnessGoal, adjustment = 250) {
  if (!tdee) return null;
  const adj = Math.max(0, Number(adjustment) || 0);
  if (fitnessGoal === 'cut') return tdee - adj;
  if (fitnessGoal === 'bulk') return tdee + adj;
  return tdee;
}

/** Evidence-informed protein grams from body weight in kilograms. */
export function suggestProteinGrams(weightKg, fitnessGoal) {
  if (!weightKg) return null;
  const perKg = fitnessGoal === 'cut' ? 2.2 : fitnessGoal === 'bulk' ? 1.6 : 1.8;
  return Math.round(weightKg * perKg);
}

/** Fat grams: the higher of 0.8 g/kg or 25% of calories. */
export function suggestFatGrams(weightKg, calories) {
  if (!weightKg || !calories) return null;
  const byWeight = 0.8 * weightKg;
  const byCalories = (calories * 0.25) / 9;
  return Math.round(Math.max(byWeight, byCalories));
}

/** Carbohydrate grams from calories left after protein and fat. */
export function suggestCarbGrams(calories, proteinGrams, fatGrams) {
  if (calories == null || proteinGrams == null || fatGrams == null) return null;
  const remaining = calories - (proteinGrams * 4) - (fatGrams * 9);
  return Math.max(0, Math.round(remaining / 4));
}

/**
 * Full estimated target set. `weight` is in the user's display unit.
 * @param {object} profile
 */
export function buildMacroSuggestion(profile) {
  const weightKg = profile.units === 'kg'
    ? Number(profile.weight)
    : convertWeight(Number(profile.weight), 'lb', 'kg');
  const bmr = calculateBmr({
    sex: profile.sex,
    weightKg,
    heightCm: Number(profile.heightCm),
    age: Number(profile.age),
  });
  const tdee = calculateTdee(bmr, profile.activityLevel);
  const calories = suggestCalorieTarget(tdee, profile.fitnessGoal, profile.calorieAdjustment ?? 250);
  const protein = suggestProteinGrams(weightKg, profile.fitnessGoal);
  const fat = suggestFatGrams(weightKg, calories);
  const carbs = suggestCarbGrams(calories, protein, fat);
  return {
    bmr,
    tdee,
    calories,
    protein,
    carbs,
    fat,
    estimated: true,
  };
}
