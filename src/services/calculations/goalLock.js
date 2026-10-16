const TARGET_FIELDS = [
  ['dailyCalories', 'calorieTargetManual'],
  ['proteinGoal', 'proteinTargetManual'],
  ['carbGoal', 'carbTargetManual'],
  ['fatGoal', 'fatTargetManual'],
];

/**
 * Apply a calculated suggestion without silently replacing locked targets.
 * `accept: true` means the user explicitly confirmed the suggestion, which
 * writes every target and locks it.
 */
export function applyCalculatedTargets(settings, suggestion, { accept = false } = {}) {
  const next = { ...settings };
  const values = {
    dailyCalories: suggestion.calories,
    proteinGoal: suggestion.protein,
    carbGoal: suggestion.carbs,
    fatGoal: suggestion.fat,
  };

  for (const [field, flag] of TARGET_FIELDS) {
    const value = values[field];
    if (value == null || Number.isNaN(Number(value))) continue;
    if (accept || !settings[flag]) {
      next[field] = Number(value);
      if (accept) next[flag] = true;
    }
  }
  return next;
}

/** Mark targets the user edited by hand so later calculations cannot overwrite them. */
export function lockEditedTargets(previous, updates) {
  const next = { ...updates };
  for (const [field, flag] of TARGET_FIELDS) {
    if (updates[field] === undefined) continue;
    if (Number(updates[field]) !== Number(previous[field])) {
      next[flag] = true;
    }
  }
  return next;
}

export function targetsChanged(previous, updates) {
  return TARGET_FIELDS.some(([field]) => (
    updates[field] !== undefined && Number(updates[field]) !== Number(previous[field])
  )) || (
    updates.goalWeight !== undefined && Number(updates.goalWeight) !== Number(previous.goalWeight)
  );
}
