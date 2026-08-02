/**
 * Repository factory — swap backend here when migrating to Supabase.
 * Set VITE_STORAGE_BACKEND=supabase to use cloud storage (future).
 */
import { settingsRepository } from './repositories/settingsRepository.js';
import { weightRepository } from './repositories/weightRepository.js';
import { measurementRepository } from './repositories/measurementRepository.js';
import { foodRepository } from './repositories/foodRepository.js';
import { workoutRepository } from './repositories/workoutRepository.js';
import { habitRepository } from './repositories/habitRepository.js';
import { photoRepository } from './repositories/photoRepository.js';
import { savedFoodRepository } from './repositories/savedFoodRepository.js';

const backend = import.meta.env.VITE_STORAGE_BACKEND ?? 'indexeddb';

if (backend !== 'indexeddb') {
  console.warn(`Storage backend "${backend}" is not yet implemented. Using IndexedDB.`);
}

export {
  settingsRepository,
  weightRepository,
  measurementRepository,
  foodRepository,
  workoutRepository,
  habitRepository,
  photoRepository,
  savedFoodRepository,
};
