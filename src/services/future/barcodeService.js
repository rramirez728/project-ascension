/** @param {string} _barcode @returns {Promise<{name: string, calories: number, protein: number, carbs: number, fat: number}>} */
export async function lookupBarcode(_barcode) {
  // Implemented via USDA in src/services/usda/usdaFoodService.js — lookupByBarcode()
  throw new Error('Use lookupByBarcode from services/usda/usdaFoodService.js');
}
