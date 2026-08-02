import { useState, useEffect, useCallback } from 'react';
import { weightRepository } from '../database/index.js';

/** Hook for weight entry CRUD and queries. */
export function useWeight() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await weightRepository.getAll();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = async (entry) => {
    await weightRepository.create(entry);
    await refresh();
  };

  const updateEntry = async (id, updates) => {
    await weightRepository.update(id, updates);
    await refresh();
  };

  const deleteEntry = async (id) => {
    await weightRepository.delete(id);
    await refresh();
  };

  const getLatest = () => entries[entries.length - 1] ?? null;

  return { entries, loading, addEntry, updateEntry, deleteEntry, getLatest, refresh };
}
