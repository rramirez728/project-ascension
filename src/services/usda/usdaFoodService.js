import { parseMacrosFromFood, formatFoodLabel, formatFoodSubtitle } from './nutrientParser.js';
import {
  detectRestaurantBrand,
  stripBrandFromQuery,
  looksLikeRestaurantQuery,
  buildGenericRestaurantQuery,
  filterRelevantResults,
  extractFoodKeywords,
} from './restaurantSearch.js';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const DEFAULT_DATA_TYPES = ['Branded', 'Survey (FNDDS)', 'SR Legacy', 'Foundation'];
const RESTAURANT_DATA_TYPES = ['Branded', 'Survey (FNDDS)'];

/** Resolve API key from settings or env (DEMO_KEY is rate-limited). */
export function resolveApiKey(settingsKey) {
  return settingsKey?.trim()
    || import.meta.env.VITE_USDA_API_KEY?.trim()
    || 'DEMO_KEY';
}

/** Turn API error bodies into a short user-facing message. */
function parseApiError(status, body) {
  if (body?.includes?.('<html>') || body?.includes?.('<title>')) {
    if (status === 400) return 'Search could not be completed. Try typing a few more letters.';
    if (status === 403) return 'Invalid USDA API key. Add your key in Settings.';
    if (status === 429) return 'Too many searches. Wait a moment and try again.';
    return `Food search unavailable (${status}). Try again shortly.`;
  }
  if (body?.message) return body.message;
  if (typeof body === 'string' && body.trim()) return body.trim();
  return `Food search failed (${status}). Try again.`;
}

async function usdaGet(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    throw new Error(parseApiError(response.status, parsed?.message ? parsed : text));
  }
  return response.json();
}

async function usdaPost(path, body, apiKey, signal) {
  const url = `${BASE_URL}${path}?api_key=${encodeURIComponent(resolveApiKey(apiKey))}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    throw new Error(parseApiError(response.status, parsed?.message ? parsed : text));
  }
  return response.json();
}

function mapFoodResult(food, { isSimilarMatch = false, isBestMatch = false } = {}) {
  const mapped = {
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner,
    brandName: food.brandName,
    dataType: food.dataType,
    gtinUpc: food.gtinUpc,
    brandedFoodCategory: food.brandedFoodCategory,
    householdServingFullText: food.householdServingFullText,
    servingSize: food.servingSize,
    servingSizeUnit: food.servingSizeUnit,
    labelNutrients: food.labelNutrients,
    label: formatFoodLabel(food),
    foodNutrients: food.foodNutrients,
    isSimilarMatch,
    isBestMatch,
  };
  mapped.subtitle = formatFoodSubtitle(mapped, { isSimilarMatch, isBestMatch });
  return mapped;
}

/** Rank results so prefix / word-boundary matches float to the top. */
function rankResults(foods, query) {
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const brand = detectRestaurantBrand(query);

  return [...foods].sort((a, b) => {
    const aLabel = (a.label || a.description || '').toLowerCase();
    const bLabel = (b.label || b.description || '').toLowerCase();
    let aScore = scoreMatch(aLabel, q, words);
    let bScore = scoreMatch(bLabel, q, words);

    if (brand) {
      const brandLower = brand.toLowerCase();
      if (aLabel.includes(brandLower) || a.brandOwner?.toLowerCase().includes(brandLower)) aScore += 30;
      if (bLabel.includes(brandLower) || b.brandOwner?.toLowerCase().includes(brandLower)) bScore += 30;
    }
    if (a.isSimilarMatch) aScore -= 15;
    if (b.isSimilarMatch) bScore -= 15;

    return bScore - aScore;
  });
}

function scoreMatch(label, query, words) {
  if (label === query) return 100;
  if (label.startsWith(query)) return 80;
  if (label.includes(query)) return 60;
  const wordHits = words.filter((w) => w.length > 2 && label.includes(w)).length;
  let score = wordHits * 10;
  if (query.includes('grilled') && label.includes('grilled')) score += 25;
  if (query.includes('fried') && label.includes('fried')) score += 25;
  if (label.includes('sandwich') && query.includes('sandwich')) score += 15;
  return score;
}

/** Single USDA search request. */
async function searchFoodsOnce(query, { apiKey, dataType, pageSize = 25, brandOwner, signal } = {}) {
  const body = {
    query: query.trim(),
    pageSize,
    pageNumber: 1,
    dataType: dataType?.length ? dataType : DEFAULT_DATA_TYPES,
  };
  if (brandOwner) body.brandOwner = brandOwner;

  const data = await usdaPost('/foods/search', body, apiKey, signal);
  return data.foods ?? [];
}

/**
 * Search USDA with restaurant-aware query expansion.
 * Runs brand-filtered and generic FNDDS fallbacks when needed.
 */
export async function searchFoods(query, { apiKey, dataType, pageSize = 25, signal } = {}) {
  const trimmed = query?.trim();
  if (!trimmed) return { foods: [], totalHits: 0, usedSimilarFallback: false, restaurantBrand: null };

  const brand = detectRestaurantBrand(trimmed);
  const isRestaurant = looksLikeRestaurantQuery(trimmed);
  const searchTypes = dataType?.length
    ? dataType
    : (isRestaurant ? RESTAURANT_DATA_TYPES : DEFAULT_DATA_TYPES);

  const merged = new Map();

  const addResults = (items, options = {}) => {
    items.forEach((food) => {
      if (!merged.has(food.fdcId)) {
        merged.set(food.fdcId, mapFoodResult(food, options));
      }
    });
  };

  // 1) Primary search — skip SR Legacy for restaurant queries
  const primary = await searchFoodsOnce(trimmed, { apiKey, dataType: searchTypes, pageSize, signal });
  addResults(primary);

  // 2) Brand-owner filtered search (packaged items only)
  if (brand) {
    const foodOnly = stripBrandFromQuery(trimmed, brand);
    const branded = await searchFoodsOnce(foodOnly || trimmed, {
      apiKey,
      dataType: ['Branded'],
      pageSize,
      brandOwner: brand,
      signal,
    });
    addResults(branded);
  }

  // 3) Generic FNDDS fallback when no good matches
  let usedSimilarFallback = false;
  let ranked = rankResults(filterRelevantResults([...merged.values()], trimmed), trimmed);

  const hasStrongMatch = ranked.some((f) => {
    const label = (f.label || '').toLowerCase();
    return extractFoodKeywords(trimmed).every((k) => label.includes(k));
  });

  if (isRestaurant && ranked.length < 2 && !hasStrongMatch) {
    const genericQuery = buildGenericRestaurantQuery(trimmed);
    const generic = await searchFoodsOnce(genericQuery, {
      apiKey,
      dataType: ['Survey (FNDDS)'],
      pageSize: 10,
      signal,
    });
    if (generic.length) {
      usedSimilarFallback = true;
      addResults(generic, { isSimilarMatch: true });
      ranked = rankResults(filterRelevantResults([...merged.values()], trimmed), trimmed);
    }
  }

  if (ranked.length > 0 && (brand || usedSimilarFallback)) {
    ranked[0] = {
      ...ranked[0],
      isBestMatch: true,
      subtitle: formatFoodSubtitle(ranked[0], {
        isSimilarMatch: ranked[0].isSimilarMatch,
        isBestMatch: true,
      }),
    };
  }

  return {
    totalHits: ranked.length,
    foods: ranked,
    usedSimilarFallback,
    restaurantBrand: brand,
  };
}

/** Fetch full food details by FDC ID (more accurate macros than search preview). */
export async function getFoodById(fdcId, apiKey) {
  const food = await usdaGet(`/food/${fdcId}`, {
    api_key: resolveApiKey(apiKey),
  });

  return {
    fdcId: food.fdcId,
    description: food.description,
    brandOwner: food.brandOwner,
    brandName: food.brandName,
    dataType: food.dataType,
    gtinUpc: food.gtinUpc,
    brandedFoodCategory: food.brandedFoodCategory,
    householdServingFullText: food.householdServingFullText,
    servingSize: food.servingSize,
    servingSizeUnit: food.servingSizeUnit,
    packageWeight: food.packageWeight,
    labelNutrients: food.labelNutrients,
    label: formatFoodLabel(food),
    subtitle: formatFoodSubtitle(food),
    macros: parseMacrosFromFood(food),
    foodNutrients: food.foodNutrients,
  };
}

/** Look up branded food by barcode (UPC/EAN). Verifies gtinUpc match. */
export async function lookupByBarcode(barcode, apiKey) {
  const normalized = barcode.replace(/\D/g, '');
  if (normalized.length < 8) {
    throw new Error('Enter a valid barcode (8+ digits).');
  }

  const { foods } = await searchFoods(normalized, {
    apiKey,
    dataType: ['Branded'],
    pageSize: 25,
  });

  const match = foods.find(
    (food) => food.gtinUpc && food.gtinUpc.replace(/^0+/, '') === normalized.replace(/^0+/, '')
  );

  if (!match) return null;
  return getFoodById(match.fdcId, apiKey);
}

/** Normalize selected food into form-ready macro payload. */
export async function resolveFoodSelection(selection, apiKey) {
  if (selection.fdcId && (!selection.macros || selection.needsDetail)) {
    const detail = await getFoodById(selection.fdcId, apiKey);
    let name = detail.label;
    if (selection.isSimilarMatch || selection.isBestMatch) {
      name = `${detail.label} (estimate)`;
    }
    return {
      name,
      fdcId: detail.fdcId,
      brandOwner: detail.brandOwner,
      dataType: detail.dataType,
      servingDescription: detail.macros.servingDescription,
      source: detail.macros.source,
      calories: detail.macros.calories,
      protein: detail.macros.protein,
      carbs: detail.macros.carbs,
      fat: detail.macros.fat,
    };
  }

  const macros = selection.macros ?? parseMacrosFromFood(selection);
  return {
    name: selection.isSimilarMatch || selection.isBestMatch
      ? `${selection.label || selection.description} (estimate)`
      : (selection.label || selection.description),
    fdcId: selection.fdcId,
    brandOwner: selection.brandOwner,
    dataType: selection.dataType,
    servingDescription: macros.servingDescription,
    source: macros.source,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  };
}

export { getRestaurantSearchTips } from './restaurantSearch.js';
