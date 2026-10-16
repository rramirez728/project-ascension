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

db.version(3).stores({
  settings: 'id',
  weightEntries: 'id, date',
  measurements: 'id, date',
  foodEntries: 'id, date, mealType, clientRequestId',
  workouts: 'id, date, exercise',
  habits: 'id, date',
  photos: 'id, date',
  savedFoods: 'id, name, fdcId',
  goalHistory: 'id, effectiveFrom',
  workoutPlans: 'id, isActive',
  plannedWorkouts: 'id, planId, weekday',
  plannedExercises: 'id, plannedWorkoutId',
  workoutSessions: 'id, date, status, legacyEntryId',
  exerciseSets: 'id, sessionId, exerciseName, clientRequestId',
  personalRecords: 'id, exerciseName, recordType',
  exercises: 'id, name',
  aiConversations: 'id, updatedAt',
  aiMessages: 'id, conversationId',
  aiActionLogs: 'id, conversationId, idempotencyKey',
});
