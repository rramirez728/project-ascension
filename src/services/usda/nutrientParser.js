/** USDA nutrient IDs for core macros (foodNutrients array). */
export const NUTRIENT_IDS = {
  calories: [1008, 2047],
  protein: [1003],
  carbs: [1005],
  fat: [1007],
};

/** Legacy USDA nutrient numbers. */
export const NUTRIENT_NUMBERS = {
  calories: ['208'],
  protein: ['203'],
  carbs: ['205'],
  fat: ['204'],
};

/** @typedef {Object} MacroNutrients
 * @property {number} calories
 * @property {number} protein
 * @property {number} carbs
 * @property {number} fat
 * @property {string} [servingDescription]
 * @property {'label' | 'database'} [source]
 */

function roundMacro(value) {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round(value * 10) / 10;
}

/** Extract nutrient amount from a foodNutrients row (handles abridged + full formats). */
function readNutrientAmount(row) {
  if (row.value != null) return row.value;
  if (row.amount != null) return row.amount;
  return null;
}

function readNutrientId(row) {
  if (row.nutrientId != null) return row.nutrientId;
  if (row.nutrient?.id != null) return row.nutrient.id;
  return null;
}

function readNutrientNumber(row) {
  if (row.nutrientNumber != null) return String(row.nutrientNumber);
  if (row.nutrient?.number != null) return String(row.nutrient.number);
  return null;
}

/** Find nutrient in foodNutrients by id or legacy number. */
function findNutrient(foodNutrients, ids, numbers = []) {
  if (!foodNutrients?.length) return 0;
  for (const row of foodNutrients) {
    const id = readNutrientId(row);
    const num = readNutrientNumber(row);
    if ((id != null && ids.includes(id)) || (num && numbers.includes(num))) {
      const amount = readNutrientAmount(row);
      if (amount != null) return roundMacro(amount);
    }
  }
  return 0;
}

/** Read a single value from branded labelNutrients (per-package label data). */
function readLabelValue(labelNutrients, key) {
  const node = labelNutrients?.[key];
  if (node?.value != null) return roundMacro(node.value);
  return null;
}

/**
 * Branded foods store per-serving label values here (matches the physical package).
 * foodNutrients is often per 100g and may omit or misstate energy for drinks.
 */
function parseLabelNutrients(labelNutrients) {
  if (!labelNutrients) return null;

  const hasLabel =
    labelNutrients.calories != null ||
    labelNutrients.protein != null ||
    labelNutrients.carbohydrates != null ||
    labelNutrients.fat != null;

  if (!hasLabel) return null;

  return {
    calories: readLabelValue(labelNutrients, 'calories') ?? 0,
    protein: readLabelValue(labelNutrients, 'protein') ?? 0,
    carbs: readLabelValue(labelNutrients, 'carbohydrates') ?? 0,
    fat: readLabelValue(labelNutrients, 'fat') ?? 0,
  };
}

/** Build serving description from USDA food object. */
export function getServingDescription(food) {
  if (food.householdServingFullText?.trim()) {
    return food.householdServingFullText.trim();
  }
  if (food.servingSize != null && food.servingSizeUnit) {
    return `${food.servingSize} ${food.servingSizeUnit}`;
  }
  if (food.packageWeight?.trim()) {
    return food.packageWeight.trim();
  }
  return 'per serving';
}

/** Parse macros — prefers labelNutrients for branded/package-accurate values. */
export function parseMacrosFromFood(food) {
  const servingDescription = getServingDescription(food);

  // Branded / packaged foods: labelNutrients matches what's printed on the can
  const fromLabel = parseLabelNutrients(food.labelNutrients);
  if (fromLabel) {
    return { ...fromLabel, servingDescription, source: 'label' };
  }

  const nutrients = food.foodNutrients ?? [];
  return {
    calories: findNutrient(nutrients, NUTRIENT_IDS.calories, NUTRIENT_NUMBERS.calories),
    protein: findNutrient(nutrients, NUTRIENT_IDS.protein, NUTRIENT_NUMBERS.protein),
    carbs: findNutrient(nutrients, NUTRIENT_IDS.carbs, NUTRIENT_NUMBERS.carbs),
    fat: findNutrient(nutrients, NUTRIENT_IDS.fat, NUTRIENT_NUMBERS.fat),
    servingDescription,
    source: 'database',
  };
}

/** Clean up USDA description text for display. */
function cleanDescription(text) {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/** User-friendly display name for a USDA food item. */
export function formatFoodLabel(food) {
  const description = cleanDescription(food.description || food.lowercaseDescription || '');
  const brandName = food.brandName?.trim();
  const brandOwner = food.brandOwner?.trim();
  const serving = getServingDescription(food);

  let title = description || 'Unknown food';

  if (brandName) {
    const descLower = description.toLowerCase();
    const brandLower = brandName.toLowerCase();
    if (!descLower || descLower === brandLower) {
      title = cleanDescription(brandName);
    } else if (descLower.includes(brandLower)) {
      title = description;
    } else {
      title = `${cleanDescription(brandName)} — ${description}`;
    }
  } else if (brandOwner && description) {
    title = `${description} (${brandOwner})`;
  }

  const servingPart =
    serving && serving !== 'per serving' && !title.toLowerCase().includes(serving.toLowerCase())
      ? serving
      : null;

  if (servingPart) {
    return `${title} · ${servingPart}`;
  }

  return title;
}

/** User-friendly label — never show raw USDA data type codes. */
export function formatDataTypeLabel(dataType, { isSimilarMatch = false, isBestMatch = false } = {}) {
  if (isBestMatch) return 'Closest match available';
  if (isSimilarMatch) return 'Similar estimate — not the exact menu item';
  switch (dataType) {
    case 'Branded':
      return 'Packaged grocery product';
    case 'Survey (FNDDS)':
      return 'Similar estimate (typical fast food)';
    case 'SR Legacy':
      return 'Older USDA reference';
    case 'Foundation':
      return 'Whole food ingredient';
    default:
      return 'USDA database';
  }
}

/** Short subtitle for search result rows. */
export function formatFoodSubtitle(food, options = {}) {
  const typeLabel = formatDataTypeLabel(food.dataType, options);
  const parts = [typeLabel];
  if (food.brandOwner && food.dataType === 'Branded') {
    parts.push(food.brandOwner);
  }
  if (food.gtinUpc) {
    parts.push(`UPC ${food.gtinUpc}`);
  }
  return parts.join(' · ');
}
