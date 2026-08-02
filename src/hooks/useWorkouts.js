import { useState, useEffect, useCallback } from 'react';
import { workoutRepository } from '../database/index.js';

/** Hook for workout log CRUD. */
export function useWorkouts() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await workoutRepository.getAll();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = async (entry) => {
    await workoutRepository.create(entry);
    await refresh();
  };

  const updateEntry = async (id, updates) => {
    await workoutRepository.update(id, updates);
    await refresh();
  };

  const deleteEntry = async (id) => {
    await workoutRepository.delete(id);
    await refresh();
  };

  const getByDate = (date) => entries.filter((e) => e.date === date);

  const getWorkoutDates = () => [...new Set(entries.map((e) => e.date))];

  return { entries, loading, addEntry, updateEntry, deleteEntry, getByDate, getWorkoutDates, refresh };
}
