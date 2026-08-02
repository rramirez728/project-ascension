import Dexie from 'dexie';

/** Dexie database instance for Project Ascension. */
export const db = new Dexie('ProjectAscension');

db.version(1).stores({
  settings: 'id',
  weightEntries: 'id, date',
  measurements: 'id, date',
  foodEntries: 'id, date, mealType',
  workouts: 'id, date, exercise',
  habits: 'id, date',
  photos: 'id, date',
});

db.version(2).stores({
  settings: 'id',
  weightEntries: 'id, date',
  measurements: 'id, date',
  foodEntries: 'id, date, mealType',
  workouts: 'id, date, exercise',
  habits: 'id, date',
  photos: 'id, date',
  savedFoods: 'id, name, fdcId',
});
