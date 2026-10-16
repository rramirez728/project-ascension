import { useCallback, useEffect, useState } from 'react';
import { trainingRepository } from '../database/index.js';
import { onDataChanged } from '../utils/dataEvents.js';

/** Workout plans, sessions, and personal records. */
export function useTraining() {
  const [plan, setPlan] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [nextPlan, nextSessions, nextRecords, nextExercises] = await Promise.all([
      trainingRepository.getActivePlan(),
      trainingRepository.getAllSessions(),
      trainingRepository.getPersonalRecords(),
      trainingRepository.listExercises(),
    ]);
    setPlan(nextPlan);
    setSessions(nextSessions);
    setRecords(nextRecords);
    setExercises(nextExercises);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    return onDataChanged(refresh);
  }, [refresh]);

  const logSets = async (item) => {
    const result = await trainingRepository.logSets(item);
    await refresh();
    return result;
  };

  const updateSet = async (id, updates) => {
    const result = await trainingRepository.updateSet(id, updates);
    await refresh();
    return result;
  };

  const deleteSet = async (id) => {
    await trainingRepository.deleteSet(id);
    await refresh();
  };

  const savePlan = async (planInput) => {
    const saved = await trainingRepository.savePlan(planInput);
    await refresh();
    return saved;
  };

  const skipPlannedWorkout = async (item) => {
    const id = await trainingRepository.skipPlannedWorkout(item);
    await refresh();
    return id;
  };

  return {
    plan,
    sessions,
    records,
    exercises,
    loading,
    refresh,
    logSets,
    updateSet,
    deleteSet,
    savePlan,
    skipPlannedWorkout,
  };
}
