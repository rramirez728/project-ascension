import { db } from '../db.js';
import { generateId } from '../../utils/id.js';
import { EXERCISE_CATALOG, sameExercise } from '../../data/exercises.js';
import { detectPersonalRecords } from '../../services/calculations/trainingCalculations.js';

async function ensureExercises() {
  const count = await db.exercises.count();
  if (count > 0) return;
  await db.exercises.bulkPut(EXERCISE_CATALOG.map((item) => ({
    id: generateId(),
    userId: null,
    name: item.name,
    muscleGroup: item.muscleGroup,
    aliases: item.aliases,
  })));
}

async function importLegacy() {
  const sessions = await db.workoutSessions.toArray();
  const imported = new Set(sessions.map((session) => session.legacyEntryId).filter(Boolean));
  const workouts = await db.workouts.toArray();
  const settings = await db.settings.get('user');
  const unit = settings?.units === 'kg' ? 'kg' : 'lb';
  for (const workout of workouts) {
    if (imported.has(workout.id)) continue;
    const setCount = Number(workout.sets) || 0;
    if (setCount < 1) continue;
    const sessionId = generateId();
    await db.workoutSessions.put({
      id: sessionId,
      date: workout.date,
      status: 'completed',
      notes: 'legacy_aggregate',
      legacyEntryId: workout.id,
    });
    for (let index = 1; index <= setCount; index += 1) {
      await db.exerciseSets.put({
        id: generateId(),
        sessionId,
        exerciseName: workout.exercise,
        setIndex: index,
        weight: Number(workout.weight) || 0,
        reps: Number(workout.reps) || 0,
        unit,
        isWarmup: false,
        isFailure: false,
        source: 'legacy_aggregate',
      });
    }
  }
}

async function setsForSession(sessionId) {
  const sets = await db.exerciseSets.where('sessionId').equals(sessionId).toArray();
  return sets.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName) || a.setIndex - b.setIndex);
}

async function withSets(sessions) {
  const detailed = [];
  for (const session of sessions) {
    detailed.push({ ...session, sets: await setsForSession(session.id) });
  }
  return detailed;
}

async function getActivePlan() {
  const plans = await db.workoutPlans.toArray();
  const plan = plans.find((item) => item.isActive) ?? plans[0] ?? null;
  if (!plan) return null;
  const days = await db.plannedWorkouts.where('planId').equals(plan.id).toArray();
  const detailed = [];
  for (const day of days.sort((a, b) => a.weekday - b.weekday)) {
    const exercises = await db.plannedExercises.where('plannedWorkoutId').equals(day.id).toArray();
    detailed.push({
      ...day,
      exercises: exercises.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    });
  }
  return { ...plan, days: detailed };
}

async function savePlan({ name = 'My Split', days }) {
  const existing = await getActivePlan();
  const planId = existing?.id ?? generateId();
  if (existing) {
    const oldDays = await db.plannedWorkouts.where('planId').equals(planId).toArray();
    for (const day of oldDays) {
      await db.plannedExercises.where('plannedWorkoutId').equals(day.id).delete();
    }
    await db.plannedWorkouts.where('planId').equals(planId).delete();
  }
  await db.workoutPlans.put({
    id: planId,
    name,
    isActive: true,
    updatedAt: new Date().toISOString(),
  });
  for (const day of days) {
    const dayId = generateId();
    await db.plannedWorkouts.put({
      id: dayId,
      planId,
      weekday: day.weekday,
      focus: day.focus || 'Rest',
      status: day.status || 'planned',
    });
    for (const [index, exercise] of (day.exercises ?? []).entries()) {
      await db.plannedExercises.put({
        id: generateId(),
        plannedWorkoutId: dayId,
        exerciseName: exercise.exerciseName,
        muscleGroup: exercise.muscleGroup ?? null,
        sets: Number(exercise.sets) || 3,
        targetReps: exercise.targetReps || '8-12',
        suggestedWeight: exercise.suggestedWeight ?? null,
        restSeconds: exercise.restSeconds ?? null,
        notes: exercise.notes ?? '',
        sortOrder: index,
      });
    }
  }
  return getActivePlan();
}

async function getSessionsByDate(date) {
  await importLegacy();
  const sessions = await db.workoutSessions.where('date').equals(date).toArray();
  return withSets(sessions);
}

async function getSessionsByRange(start, end) {
  await importLegacy();
  const sessions = await db.workoutSessions.where('date').between(start, end, true, true).sortBy('date');
  return withSets(sessions);
}

async function getAllSessions() {
  await importLegacy();
  const sessions = await db.workoutSessions.orderBy('date').toArray();
  return withSets(sessions);
}

async function createSession(item) {
  const id = generateId();
  await db.workoutSessions.put({
    id,
    date: item.date,
    status: item.status ?? 'completed',
    notes: item.notes ?? '',
    plannedWorkoutId: item.plannedWorkoutId ?? null,
  });
  return id;
}

async function setsNamedLike(exerciseName) {
  const sets = await db.exerciseSets.toArray();
  return sets.filter((set) => sameExercise(set.exerciseName, exerciseName));
}

async function recordPrs(exerciseName, sessionId, date, unit, newSets) {
  const history = await setsNamedLike(exerciseName);
  const records = detectPersonalRecords({
    historySets: history.map((set) => ({ ...set, exerciseName })),
    newSets,
    sessionId,
    date,
    unit,
  });
  for (const record of records) {
    await db.personalRecords.put({ id: generateId(), exerciseName, ...record });
  }
  return records;
}

async function logSets(item) {
  const baseRequest = item.clientRequestId;
  if (baseRequest) {
    const existing = await db.exerciseSets.where('clientRequestId').equals(`${baseRequest}:1`).first();
    if (existing) return { sessionId: existing.sessionId, duplicate: true, records: [] };
  }

  let sessionId = item.sessionId;
  if (!sessionId) {
    const sameDay = await db.workoutSessions.where('date').equals(item.date).toArray();
    const open = sameDay.find((session) => session.status !== 'skipped');
    sessionId = open?.id ?? await createSession({ date: item.date, status: 'completed' });
    if (open?.status === 'skipped') {
      await db.workoutSessions.update(sessionId, { status: 'completed' });
    }
  }

  const unit = item.unit === 'kg' ? 'kg' : 'lb';
  const created = [];
  for (const [index, set] of item.sets.entries()) {
    const row = {
      id: generateId(),
      sessionId,
      exerciseName: item.exerciseName,
      setIndex: set.setIndex ?? index + 1,
      weight: Number(set.weight) || 0,
      reps: Number(set.reps) || 0,
      unit,
      isWarmup: Boolean(set.isWarmup),
      isFailure: Boolean(set.isFailure),
      source: item.source ?? 'user',
      clientRequestId: baseRequest ? `${baseRequest}:${set.setIndex ?? index + 1}` : null,
    };
    await db.exerciseSets.put(row);
    created.push(row);
  }

  const records = await recordPrs(item.exerciseName, sessionId, item.date, unit, created);
  return { sessionId, duplicate: false, records, sets: created };
}

async function updateSet(id, updates) {
  const existing = await db.exerciseSets.get(id);
  if (!existing) throw new Error('Set not found');
  const next = { ...existing, ...updates, id };
  await db.exerciseSets.put(next);
  const session = await db.workoutSessions.get(existing.sessionId);
  const siblings = await setsForSession(existing.sessionId);
  const records = await recordPrs(
    next.exerciseName,
    existing.sessionId,
    session?.date,
    next.unit,
    siblings.filter((set) => sameExercise(set.exerciseName, next.exerciseName)),
  );
  return { set: next, records };
}

async function deleteSet(id) {
  await db.exerciseSets.delete(id);
}

async function getExerciseHistory(exerciseName) {
  await importLegacy();
  const sets = await setsNamedLike(exerciseName);
  const sessions = await db.workoutSessions.toArray();
  const byId = new Map(sessions.map((session) => [session.id, session]));
  return sets
    .map((set) => ({ ...set, date: byId.get(set.sessionId)?.date, sessionStatus: byId.get(set.sessionId)?.status }))
    .filter((set) => set.sessionStatus !== 'skipped')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.setIndex - b.setIndex);
}

async function getPersonalRecords() {
  return db.personalRecords.orderBy('exerciseName').toArray();
}

async function skipPlannedWorkout({ date, plannedWorkoutId, notes }) {
  const id = await createSession({
    date,
    status: 'skipped',
    notes: notes || 'Skipped',
    plannedWorkoutId,
  });
  if (plannedWorkoutId) {
    await db.plannedWorkouts.update(plannedWorkoutId, { status: 'skipped' });
  }
  return id;
}

async function listExercises() {
  await ensureExercises();
  return db.exercises.toArray();
}

export const trainingRepository = {
  getActivePlan,
  savePlan,
  getSessionsByDate,
  getSessionsByRange,
  getAllSessions,
  createSession,
  logSets,
  updateSet,
  deleteSet,
  getExerciseHistory,
  getPersonalRecords,
  skipPlannedWorkout,
  listExercises,
};
