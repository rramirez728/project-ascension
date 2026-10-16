import { supabase } from '../../../lib/supabase.js';
import { generateId } from '../../../utils/id.js';
import { getUserId, throwIfError } from './helpers.js';
import { detectPersonalRecords } from '../../../services/calculations/trainingCalculations.js';
import { sameExercise } from '../../../data/exercises.js';

function mapPlanDay(row, exercises) {
  return {
    id: row.id,
    planId: row.plan_id,
    weekday: row.weekday,
    focus: row.focus,
    status: row.status,
    exercises: exercises.map((exercise) => ({
      id: exercise.id,
      exerciseName: exercise.exercise_name,
      muscleGroup: exercise.muscle_group,
      sets: exercise.sets,
      targetReps: exercise.target_reps,
      suggestedWeight: exercise.suggested_weight == null ? null : Number(exercise.suggested_weight),
      restSeconds: exercise.rest_seconds,
      notes: exercise.notes ?? '',
      sortOrder: exercise.sort_order,
    })),
  };
}

function mapSet(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseName: row.exercise_name,
    setIndex: row.set_index,
    weight: Number(row.weight),
    reps: Number(row.reps),
    unit: row.unit,
    isWarmup: row.is_warmup,
    isFailure: row.is_failure,
    source: row.source,
    clientRequestId: row.client_request_id,
  };
}

function mapSession(row, sets) {
  return {
    id: row.id,
    date: row.date,
    status: row.status,
    notes: row.notes ?? '',
    plannedWorkoutId: row.planned_workout_id,
    legacyEntryId: row.legacy_entry_id,
    sets,
  };
}

async function getActivePlan() {
  const userId = await getUserId();
  const { data: plans, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('is_active', { ascending: false });
  throwIfError(error, 'Failed to load workout plan');
  const plan = plans?.[0];
  if (!plan) return null;
  const { data: days, error: dayError } = await supabase
    .from('planned_workouts')
    .select('*')
    .eq('plan_id', plan.id)
    .order('weekday');
  throwIfError(dayError, 'Failed to load planned workouts');
  const dayIds = (days ?? []).map((day) => day.id);
  let exercises = [];
  if (dayIds.length) {
    const { data, error: exerciseError } = await supabase
      .from('planned_exercises')
      .select('*')
      .in('planned_workout_id', dayIds)
      .order('sort_order');
    throwIfError(exerciseError, 'Failed to load planned exercises');
    exercises = data ?? [];
  }
  return {
    id: plan.id,
    name: plan.name,
    isActive: plan.is_active,
    days: (days ?? []).map((day) => mapPlanDay(day, exercises.filter((item) => item.planned_workout_id === day.id))),
  };
}

async function savePlan({ name = 'My Split', days }) {
  const userId = await getUserId();
  const existing = await getActivePlan();
  const planId = existing?.id ?? generateId();
  const { error: planError } = await supabase.from('workout_plans').upsert({
    id: planId,
    user_id: userId,
    name,
    is_active: true,
  });
  throwIfError(planError, 'Failed to save workout plan');

  if (existing?.days?.length) {
    const { error } = await supabase.from('planned_workouts').delete().eq('plan_id', planId);
    throwIfError(error, 'Failed to replace planned workouts');
  }

  for (const day of days) {
    const dayId = generateId();
    const { error: dayError } = await supabase.from('planned_workouts').insert({
      id: dayId,
      user_id: userId,
      plan_id: planId,
      weekday: day.weekday,
      focus: day.focus || 'Rest',
      status: day.status || 'planned',
    });
    throwIfError(dayError, 'Failed to save planned workout');
    if (day.exercises?.length) {
      const { error: exerciseError } = await supabase.from('planned_exercises').insert(
        day.exercises.map((exercise, index) => ({
          id: generateId(),
          user_id: userId,
          planned_workout_id: dayId,
          exercise_name: exercise.exerciseName,
          muscle_group: exercise.muscleGroup ?? null,
          sets: Number(exercise.sets) || 3,
          target_reps: exercise.targetReps || '8-12',
          suggested_weight: exercise.suggestedWeight ?? null,
          rest_seconds: exercise.restSeconds ?? null,
          notes: exercise.notes ?? '',
          sort_order: index,
        })),
      );
      throwIfError(exerciseError, 'Failed to save planned exercises');
    }
  }
  return getActivePlan();
}

async function setsForSessions(sessionIds) {
  if (!sessionIds.length) return [];
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .in('session_id', sessionIds)
    .order('set_index');
  throwIfError(error, 'Failed to load sets');
  return (data ?? []).map(mapSet);
}

async function withSets(rows) {
  const sets = await setsForSessions(rows.map((row) => row.id));
  return rows.map((row) => mapSession(row, sets.filter((set) => set.sessionId === row.id)));
}

async function getSessionsByDate(date) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date);
  throwIfError(error, 'Failed to load sessions');
  return withSets(data ?? []);
}

async function getSessionsByRange(start, end) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date');
  throwIfError(error, 'Failed to load sessions');
  return withSets(data ?? []);
}

async function getAllSessions() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('date');
  throwIfError(error, 'Failed to load sessions');
  return withSets(data ?? []);
}

async function createSession(item) {
  const userId = await getUserId();
  const id = generateId();
  const { error } = await supabase.from('workout_sessions').insert({
    id,
    user_id: userId,
    date: item.date,
    status: item.status ?? 'completed',
    notes: item.notes ?? '',
    planned_workout_id: item.plannedWorkoutId ?? null,
  });
  throwIfError(error, 'Failed to create session');
  return id;
}

async function namesLike(userId, exerciseName) {
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('exercise_name')
    .eq('user_id', userId);
  throwIfError(error, 'Failed to load exercise history');
  const names = new Set(
    (data ?? [])
      .map((row) => row.exercise_name)
      .filter((name) => sameExercise(name, exerciseName)),
  );
  if (exerciseName) names.add(exerciseName);
  return [...names];
}

async function recordPrs(userId, exerciseName, sessionId, date, unit, newSets) {
  const names = await namesLike(userId, exerciseName);
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('user_id', userId)
    .in('exercise_name', names);
  throwIfError(error, 'Failed to load exercise history');
  const history = (data ?? []).map(mapSet);
  const records = detectPersonalRecords({ historySets: history, newSets, sessionId, date, unit });
  if (!records.length) return [];
  const { error: insertError } = await supabase.from('personal_records').insert(
    records.map((record) => ({
      id: generateId(),
      user_id: userId,
      exercise_name: exerciseName,
      record_type: record.recordType,
      value: record.value,
      weight: record.weight,
      reps: record.reps,
      unit: record.unit,
      is_estimated: record.isEstimated,
      achieved_on: record.achievedOn,
      session_id: record.sessionId,
    })),
  );
  throwIfError(insertError, 'Failed to save personal records');
  return records;
}

async function logSets(item) {
  const userId = await getUserId();
  const baseRequest = item.clientRequestId;
  if (baseRequest) {
    const { data } = await supabase
      .from('exercise_sets')
      .select('session_id')
      .eq('user_id', userId)
      .eq('client_request_id', `${baseRequest}:1`)
      .maybeSingle();
    if (data?.session_id) return { sessionId: data.session_id, duplicate: true, records: [] };
  }

  let sessionId = item.sessionId;
  if (!sessionId) {
    const { data: sameDay, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', item.date);
    throwIfError(error, 'Failed to load session');
    const open = (sameDay ?? []).find((session) => session.status !== 'skipped');
    sessionId = open?.id ?? await createSession({ date: item.date, status: 'completed' });
  }

  const unit = item.unit === 'kg' ? 'kg' : 'lb';
  const rows = item.sets.map((set, index) => ({
    id: generateId(),
    user_id: userId,
    session_id: sessionId,
    exercise_name: item.exerciseName,
    set_index: set.setIndex ?? index + 1,
    weight: Number(set.weight) || 0,
    reps: Number(set.reps) || 0,
    unit,
    is_warmup: Boolean(set.isWarmup),
    is_failure: Boolean(set.isFailure),
    source: item.source ?? 'user',
    client_request_id: baseRequest ? `${baseRequest}:${set.setIndex ?? index + 1}` : null,
  }));
  const { error } = await supabase.from('exercise_sets').insert(rows);
  if (error?.code === '23505' && baseRequest) {
    return { sessionId, duplicate: true, records: [] };
  }
  throwIfError(error, 'Failed to log sets');
  const created = rows.map(mapSet);
  const records = await recordPrs(userId, item.exerciseName, sessionId, item.date, unit, created);
  return { sessionId, duplicate: false, records, sets: created };
}

async function updateSet(id, updates) {
  const userId = await getUserId();
  const row = {
    ...(updates.reps !== undefined && { reps: updates.reps }),
    ...(updates.weight !== undefined && { weight: updates.weight }),
    ...(updates.isWarmup !== undefined && { is_warmup: updates.isWarmup }),
    ...(updates.isFailure !== undefined && { is_failure: updates.isFailure }),
    ...(updates.exerciseName !== undefined && { exercise_name: updates.exerciseName }),
    ...(updates.setIndex !== undefined && { set_index: updates.setIndex }),
  };
  const { data, error } = await supabase
    .from('exercise_sets')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  throwIfError(error, 'Failed to update set');
  const set = mapSet(data);
  const { data: session } = await supabase.from('workout_sessions').select('date').eq('id', set.sessionId).maybeSingle();
  const records = await recordPrs(userId, set.exerciseName, set.sessionId, session?.date, set.unit, [set]);
  return { set, records };
}

async function deleteSet(id) {
  const { error } = await supabase.from('exercise_sets').delete().eq('id', id);
  throwIfError(error, 'Failed to delete set');
}

async function getExerciseHistory(exerciseName) {
  const userId = await getUserId();
  const names = await namesLike(userId, exerciseName);
  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*, workout_sessions!inner(date, status)')
    .eq('user_id', userId)
    .in('exercise_name', names);
  throwIfError(error, 'Failed to load exercise history');
  return (data ?? [])
    .map((row) => ({
      ...mapSet(row),
      date: row.workout_sessions?.date,
      sessionStatus: row.workout_sessions?.status,
    }))
    .filter((set) => set.sessionStatus !== 'skipped')
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.setIndex - b.setIndex);
}

async function getPersonalRecords() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('achieved_on', { ascending: false });
  throwIfError(error, 'Failed to load personal records');
  return (data ?? []).map((row) => ({
    id: row.id,
    exerciseName: row.exercise_name,
    recordType: row.record_type,
    value: Number(row.value),
    weight: row.weight == null ? null : Number(row.weight),
    reps: row.reps,
    unit: row.unit,
    isEstimated: row.is_estimated,
    achievedOn: row.achieved_on,
    sessionId: row.session_id,
  }));
}

async function skipPlannedWorkout({ date, plannedWorkoutId, notes }) {
  const id = await createSession({
    date,
    status: 'skipped',
    notes: notes || 'Skipped',
    plannedWorkoutId,
  });
  if (plannedWorkoutId) {
    const { error } = await supabase
      .from('planned_workouts')
      .update({ status: 'skipped' })
      .eq('id', plannedWorkoutId);
    throwIfError(error, 'Failed to skip planned workout');
  }
  return id;
}

async function listExercises() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('name');
  throwIfError(error, 'Failed to load exercises');
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    aliases: row.aliases ?? [],
  }));
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
