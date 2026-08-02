/** Normalize common restaurant brand spellings for USDA brandOwner filter. */
export const RESTAURANT_BRANDS = {
  'chick fil a': 'Chick-fil-A',
  'chick-fil-a': 'Chick-fil-A',
  'chickfila': 'Chick-fil-A',
  'chik fil a': 'Chick-fil-A',
  "mcdonald's": "McDonald's",
  mcdonalds: "McDonald's",
  'burger king': 'Burger King',
  wendys: "Wendy's",
  "wendy's": "Wendy's",
  subway: 'Subway',
  'taco bell': 'Taco Bell',
  chipotle: 'Chipotle',
  'panera bread': 'Panera Bread',
  panera: 'Panera Bread',
  starbucks: 'Starbucks',
  'five guys': 'Five Guys',
  'in n out': 'In-N-Out Burger',
  'in-n-out': 'In-N-Out Burger',
};

/** Detect restaurant brand in a search query. */
export function detectRestaurantBrand(query) {
  const normalized = query.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [key, brand] of Object.entries(RESTAURANT_BRANDS)) {
    if (normalized.includes(key)) return brand;
  }
  return null;
}

/** Remove brand name tokens from query to search food description only. */
export function stripBrandFromQuery(query, brand) {
  let result = query;
  for (const key of Object.keys(RESTAURANT_BRANDS)) {
    if (RESTAURANT_BRANDS[key] === brand) {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
    }
  }
  return result.replace(/\s+/g, ' ').trim() || query;
}

/** Whether the query looks like a restaurant menu item vs grocery food. */
export function looksLikeRestaurantQuery(query) {
  const q = query.toLowerCase();
  if (detectRestaurantBrand(query)) return true;
  const restaurantWords = ['sandwich', 'burger', 'nuggets', 'wrap', 'combo', 'meal', 'fries', 'from restaurant', 'fast food'];
  return restaurantWords.some((w) => q.includes(w));
}

/** Build a generic FNDDS-style query for similar survey foods when brand item is missing. */
export function buildGenericRestaurantQuery(query) {
  const q = query.toLowerCase();
  let stripped = q;
  for (const key of Object.keys(RESTAURANT_BRANDS)) {
    stripped = stripped.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  }
  stripped = stripped.replace(/\s+/g, ' ').trim();

  if (stripped.includes('grilled') && stripped.includes('sandwich')) {
    return 'chicken sandwich grilled fast food restaurant';
  }
  if (stripped.includes('fried') && stripped.includes('sandwich')) {
    return 'chicken sandwich fried fast food restaurant';
  }
  if (stripped.includes('burger')) {
    return `${stripped} fast food restaurant`;
  }
  if (stripped) {
    return `${stripped} restaurant fast food`;
  }
  return 'fast food restaurant';
}

/** Extract meaningful food words from query (brand name stripped). */
export function extractFoodKeywords(query) {
  const brand = detectRestaurantBrand(query);
  let text = brand ? stripBrandFromQuery(query, brand) : query;
  const stop = new Set(['the', 'and', 'with', 'from', 'for', 'a']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}

/** Filter out irrelevant USDA hits (e.g. hash browns when searching for a sandwich). */
export function filterRelevantResults(foods, query) {
  const keywords = extractFoodKeywords(query);
  const q = query.toLowerCase();
  const brand = detectRestaurantBrand(query);
  const wantsGrilled = q.includes('grilled');
  const wantsFried = q.includes('fried');

  return foods.filter((food) => {
    const label = (food.description || food.label || '').toLowerCase();

    // SR Legacy is old reference data — hide for restaurant searches (confusing/outdated)
    if (brand && food.dataType === 'SR Legacy') return false;

    if (keywords.length === 0) return true;

    // Must include the main food type if present in query (sandwich, burger, etc.)
    const mainTypes = ['sandwich', 'burger', 'wrap', 'nuggets', 'salad', 'bowl', 'taco', 'burrito'];
    const queryMain = keywords.find((k) => mainTypes.includes(k));
    if (queryMain && !label.includes(queryMain)) return false;

    // If user said "grilled", prefer items that say grilled (skip fried-only legacy items)
    if (wantsGrilled && !wantsFried && food.dataType === 'Survey (FNDDS)' && !label.includes('grilled')) {
      return false;
    }

    // Require at least 2 keyword hits for multi-word searches
    if (keywords.length >= 2) {
      const hits = keywords.filter((k) => label.includes(k)).length;
      if (hits < 2) return false;
    }

    return true;
  });
}

/** Suggested search tips when no exact match is found. */
export function getRestaurantSearchTips(query) {
  const brand = detectRestaurantBrand(query);
  const tips = [
    'Restaurant menu items (like Chick-fil-A sandwiches) usually are not in USDA.',
    'Look up exact macros on the restaurant website, enter them below, then Save to My Foods.',
  ];
  if (brand) {
    tips.unshift('Pick "Closest match" below for a rough estimate — or enter exact values manually.');
  } else {
    tips.unshift('Try simpler terms like "grilled chicken sandwich".');
  }
  return tips;
}
