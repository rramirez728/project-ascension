/**
 * Repository factory — routes to IndexedDB (local) or Supabase (signed-in cloud).
 */
import { createDualRepository } from './storageBackend.js';
import { settingsRepository as localSettings } from './repositories/settingsRepository.js';
import { weightRepository as localWeight } from './repositories/weightRepository.js';
import { measurementRepository as localMeasurement } from './repositories/measurementRepository.js';
import { foodRepository as localFood } from './repositories/foodRepository.js';
import { workoutRepository as localWorkout } from './repositories/workoutRepository.js';
import { habitRepository as localHabit } from './repositories/habitRepository.js';
import { photoRepository as localPhoto } from './repositories/photoRepository.js';
import { savedFoodRepository as localSavedFood } from './repositories/savedFoodRepository.js';
import { settingsRepository as cloudSettings } from './repositories/supabase/settingsRepository.js';
import { weightRepository as cloudWeight } from './repositories/supabase/weightRepository.js';
import { measurementRepository as cloudMeasurement } from './repositories/supabase/measurementRepository.js';
import { foodRepository as cloudFood } from './repositories/supabase/foodRepository.js';
import { workoutRepository as cloudWorkout } from './repositories/supabase/workoutRepository.js';
import { habitRepository as cloudHabit } from './repositories/supabase/habitRepository.js';
import { photoRepository as cloudPhoto } from './repositories/supabase/photoRepository.js';
import { savedFoodRepository as cloudSavedFood } from './repositories/supabase/savedFoodRepository.js';

export const settingsRepository = createDualRepository(localSettings, cloudSettings);
export const weightRepository = createDualRepository(localWeight, cloudWeight);
export const measurementRepository = createDualRepository(localMeasurement, cloudMeasurement);
export const foodRepository = createDualRepository(localFood, cloudFood);
export const workoutRepository = createDualRepository(localWorkout, cloudWorkout);
export const habitRepository = createDualRepository(localHabit, cloudHabit);
export const photoRepository = createDualRepository(localPhoto, cloudPhoto);
export const savedFoodRepository = createDualRepository(localSavedFood, cloudSavedFood);
