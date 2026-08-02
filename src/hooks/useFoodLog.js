import { useState, useEffect, useCallback } from 'react';
import { foodRepository } from '../database/index.js';
import { todayISO } from '../utils/dates.js';

/** Hook for food log CRUD filtered by date. */
export function useFoodLog(date = todayISO()) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await foodRepository.getByDate(date);
    setEntries(data);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = async (entry) => {
    await foodRepository.create({ ...entry, date });
    await refresh();
  };

  const updateEntry = async (id, updates) => {
    await foodRepository.update(id, updates);
    await refresh();
  };

  const deleteEntry = async (id) => {
    await foodRepository.delete(id);
    await refresh();
  };

  const getByMeal = (mealType) => entries.filter((e) => e.mealType === mealType);

  return { entries, loading, addEntry, updateEntry, deleteEntry, getByMeal, refresh };
}
