const VOLUME_TO_GRAMS = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  oz: 28.3495,
  ounce: 28.3495,
  ounces: 28.3495,
  lb: 453.592,
  lbs: 453.592,
  pound: 453.592,
  pounds: 453.592,
};

function roundMacro(value) {
  return Math.round(value * 10) / 10;
}

/** Convert a weight quantity to grams. Volume units return null. */
export function toGrams(quantity, unit) {
  const key = String(unit || '').trim().toLowerCase();
  const factor = VOLUME_TO_GRAMS[key];
  if (!factor || quantity == null || Number.isNaN(Number(quantity))) return null;
  return Number(quantity) * factor;
}

/**
 * Scale a per-100g or per-serving reference to the amount eaten.
 * Returns an error instead of inventing a number when the unit cannot be scaled.
 */
export function scaleFoodMacros(reference, { quantity, unit }) {
  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    return { ok: false, reason: 'missing_quantity' };
  }

  const macros = {
    calories: Number(reference.calories) || 0,
    protein: Number(reference.protein) || 0,
    carbs: Number(reference.carbs) || 0,
    fat: Number(reference.fat) || 0,
  };

  let multiplier = null;
  if (reference.basis === 'per_100g') {
    const grams = toGrams(qty, unit);
    if (grams == null) return { ok: false, reason: 'unsupported_unit' };
    multiplier = grams / 100;
  } else if (unit === 'serving' || unit === 'servings') {
    multiplier = qty;
  } else if (reference.servingGrams) {
    const grams = toGrams(qty, unit);
    if (grams == null) return { ok: false, reason: 'unsupported_unit' };
    multiplier = grams / Number(reference.servingGrams);
  } else {
    return { ok: false, reason: 'need_serving_size' };
  }

  return {
    ok: true,
    calories: roundMacro(macros.calories * multiplier),
    protein: roundMacro(macros.protein * multiplier),
    carbs: roundMacro(macros.carbs * multiplier),
    fat: roundMacro(macros.fat * multiplier),
  };
}

/**
 * Raw and cooked weights are different foods for logging purposes.
 * A mismatch must be shown as uncertain rather than treated as exact.
 */
export function preparationMatches(requested, reference) {
  if (!requested || requested === 'unknown' || !reference || reference === 'unknown') {
    return { match: false, uncertain: true };
  }
  if (requested === reference) return { match: true, uncertain: false };
  return { match: false, uncertain: true, reason: 'raw_cooked_mismatch' };
}
