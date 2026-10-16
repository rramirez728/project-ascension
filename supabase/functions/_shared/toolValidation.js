const HYPOTHETICAL = /\b(thinking about|thinking of|considering|maybe i('|’)ll|might add|what if|should i|planning to|hypothetically|not sure if)\b/i;
const CORRECTION = /\b(actually|instead of|change the|correct the|make that|update the|i meant|not \d+)\b/i;

const FOOD_UNITS = new Set(['g', 'kg', 'oz', 'lb', 'ml', 'cup', 'cups', 'tbsp', 'tsp', 'piece', 'pieces', 'slice', 'slices', 'serving', 'servings']);
const SET_UNITS = new Set(['lb', 'kg']);

/** True when the user is discussing food or training they have not done. */
export function isHypotheticalUtterance(text) {
  return HYPOTHETICAL.test(String(text || ''));
}

/** True when the user is changing an entry that should already exist. */
export function isCorrectionUtterance(text) {
  return CORRECTION.test(String(text || ''));
}

function fail(error) {
  return { ok: false, error };
}

function requireNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fail(`${field} must be a number`);
  return { ok: true, value: number };
}

/**
 * Validate a tool call before any database write.
 * @param {string} name
 * @param {object} args
 * @param {{ userText?: string, existingRequestIds?: string[] }} [context]
 */
export function validateToolCall(name, args = {}, context = {}) {
  const userText = context.userText || '';
  const writeTools = new Set([
    'add_food_entry',
    'update_food_entry',
    'delete_food_entry',
    'log_body_weight',
    'log_exercise_sets',
    'update_exercise_set',
    'skip_planned_workout',
  ]);

  if (writeTools.has(name) && isHypotheticalUtterance(userText)) {
    return fail('hypothetical_not_logged');
  }

  if (name === 'add_food_entry' && isCorrectionUtterance(userText)) {
    return fail('correction_requires_update');
  }

  if (name === 'log_exercise_sets' && isCorrectionUtterance(userText)) {
    return fail('correction_requires_set_update');
  }

  if (context.existingRequestIds?.includes(args.clientRequestId)) {
    return fail('duplicate_request');
  }

  switch (name) {
    case 'add_food_entry':
      return validateFoodAdd(args);
    case 'update_food_entry':
      return validateFoodUpdate(args);
    case 'delete_food_entry':
      if (!args.entryId) return fail('entryId is required');
      return { ok: true };
    case 'log_body_weight': {
      const weight = requireNumber(args.weight, 'weight');
      if (!weight.ok) return weight;
      if (weight.value <= 0) return fail('weight must be positive');
      if (!args.date) return fail('date is required');
      if (args.unit && !SET_UNITS.has(args.unit)) return fail('unit must be lb or kg');
      if (args.confirmed !== true) return fail('confirmation_required');
      return { ok: true };
    }
    case 'log_exercise_sets':
      return validateSets(args);
    case 'update_exercise_set':
      if (!args.setId) return fail('setId is required');
      if (args.reps != null && (!Number.isFinite(Number(args.reps)) || Number(args.reps) < 0)) {
        return fail('reps must be a non-negative number');
      }
      if (args.weight != null && (!Number.isFinite(Number(args.weight)) || Number(args.weight) < 0)) {
        return fail('weight must be a non-negative number');
      }
      return { ok: true };
    case 'skip_planned_workout':
      if (!args.date) return fail('date is required');
      return { ok: true };
    case 'search_foods':
    case 'calculate_food_macros':
      if (!args.query && !args.foodName) return fail('query is required');
      return { ok: true };
    case 'get_user_profile':
    case 'get_nutrition_goals':
    case 'get_daily_nutrition':
    case 'get_weight_history':
    case 'get_workout_plan':
    case 'get_exercise_history':
    case 'get_personal_records':
    case 'get_training_analytics':
      return { ok: true };
    default:
      return fail('unknown_tool');
  }
}

function validateFoodAdd(args) {
  const items = Array.isArray(args.items) ? args.items : [args];
  if (!items.length) return fail('at least one food is required');
  for (const item of items) {
    if (!item.name || !String(item.name).trim()) return fail('food name is required');
    if (item.quantity == null || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return fail('quantity is required');
    }
    if (!item.unit || !FOOD_UNITS.has(String(item.unit).toLowerCase())) {
      return fail('unit is not supported');
    }
    if (!['raw', 'cooked', 'unknown'].includes(item.preparationState || 'unknown')) {
      return fail('preparationState must be raw, cooked, or unknown');
    }
    if (item.calories == null || !Number.isFinite(Number(item.calories))) {
      return fail('calories are required before saving');
    }
    if (!['usda', 'label', 'estimate', 'custom', 'user'].includes(item.source || 'estimate')) {
      return fail('invalid nutrition source');
    }
    if ((item.source === 'estimate' || item.confidence === 'low' || item.confidence === 'medium') && !item.sourceNote) {
      return fail('uncertain nutrition requires sourceNote');
    }
  }
  if (args.confirmed !== true) return fail('confirmation_required');
  return { ok: true };
}

function validateFoodUpdate(args) {
  if (!args.entryId && !args.name) return fail('entryId or name is required');
  if (args.quantity != null && (!Number.isFinite(Number(args.quantity)) || Number(args.quantity) <= 0)) {
    return fail('quantity must be positive');
  }
  return { ok: true };
}

function validateSets(args) {
  if (!args.exerciseName || !String(args.exerciseName).trim()) return fail('exerciseName is required');
  if (!Array.isArray(args.sets) || args.sets.length === 0) return fail('sets are required');
  if (args.unit && !SET_UNITS.has(args.unit)) return fail('unit must be lb or kg');
  for (const set of args.sets) {
    if (!Number.isFinite(Number(set.reps)) || Number(set.reps) < 0) return fail('each set needs reps');
    if (!Number.isFinite(Number(set.weight)) || Number(set.weight) < 0) return fail('each set needs weight');
  }
  if (args.confirmed !== true) return fail('confirmation_required');
  return { ok: true };
}

/**
 * Find one existing food row for a correction. Ambiguous matches are not updated.
 * @param {Array<{ id: string, name: string, mealType?: string }>} entries
 */
export function findFoodCorrectionTarget(entries, { name, mealType } = {}) {
  const needle = String(name || '').trim().toLowerCase();
  if (!needle) return { status: 'missing' };
  const matches = entries.filter((entry) => {
    const hay = entry.name.toLowerCase();
    return hay.includes(needle) || needle.includes(hay);
  });
  const scoped = mealType ? matches.filter((entry) => entry.mealType === mealType) : matches;
  const pool = scoped.length ? scoped : matches;
  if (pool.length === 1) return { status: 'found', entry: pool[0] };
  if (pool.length === 0) return { status: 'missing' };
  return { status: 'ambiguous', entries: pool };
}

/**
 * Find one set to correct. Prefers the last set when the user says "the last set".
 */
export function findSetCorrectionTarget(sets, { exerciseName, setIndex, lastSet = false } = {}) {
  const name = String(exerciseName || '').trim().toLowerCase();
  let pool = sets.filter((set) => !name || set.exerciseName.toLowerCase().includes(name) || name.includes(set.exerciseName.toLowerCase()));
  if (setIndex != null) {
    pool = pool.filter((set) => Number(set.setIndex) === Number(setIndex));
  }
  if (!pool.length) return { status: 'missing' };
  if (lastSet || pool.length > 1 && setIndex == null) {
    const sorted = [...pool].sort((a, b) => Number(a.setIndex) - Number(b.setIndex));
    if (lastSet) return { status: 'found', set: sorted[sorted.length - 1] };
  }
  if (pool.length === 1) return { status: 'found', set: pool[0] };
  return { status: 'ambiguous', sets: pool };
}
