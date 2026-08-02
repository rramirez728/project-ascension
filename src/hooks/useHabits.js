import { useState, useEffect, useCallback } from 'react';
import { habitRepository } from '../database/index.js';
import { todayISO } from '../utils/dates.js';

/** Hook for daily habit tracking. */
export function useHabits() {
  const [entries, setEntries] = useState([]);
  const [todayHabit, setTodayHabit] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await habitRepository.getAll();
    const today = await habitRepository.getByDate(todayISO());
    setEntries(data);
    setTodayHabit(today);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateToday = async (data) => {
    await habitRepository.upsertForDate(todayISO(), data);
    await refresh();
  };

  const deleteEntry = async (id) => {
    await habitRepository.delete(id);
    await refresh();
  };

  return { entries, todayHabit, loading, updateToday, deleteEntry, refresh };
}
