/** Sum macro totals from food entries. */
export function sumMacros(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

/** Calculate remaining macros against goals. */
export function calculateRemaining(consumed, goals) {
  return {
    calories: Math.max(0, goals.dailyCalories - consumed.calories),
    protein: Math.max(0, goals.proteinGoal - consumed.protein),
    carbs: Math.max(0, goals.carbGoal - consumed.carbs),
    fat: Math.max(0, goals.fatGoal - consumed.fat),
  };
}

/** Percentage of goal consumed (0–100+). */
export function percentOfGoal(consumed, goal) {
  if (!goal) return 0;
  return Math.min(100, Math.round((consumed / goal) * 100));
}
