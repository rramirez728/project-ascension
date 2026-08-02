import { useState, useEffect, useCallback } from 'react';
import { measurementRepository } from '../database/index.js';

/** Hook for body measurement CRUD. */
export function useMeasurements() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await measurementRepository.getAll();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = async (entry) => {
    await measurementRepository.create(entry);
    await refresh();
  };

  const updateEntry = async (id, updates) => {
    await measurementRepository.update(id, updates);
    await refresh();
  };

  const deleteEntry = async (id) => {
    await measurementRepository.delete(id);
    await refresh();
  };

  return { entries, loading, addEntry, updateEntry, deleteEntry, refresh };
}
