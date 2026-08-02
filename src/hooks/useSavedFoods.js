import { useState, useEffect, useCallback } from 'react';
import { savedFoodRepository } from '../database/index.js';

/** Hook for saved/favorite foods. */
export function useSavedFoods() {
  const [savedFoods, setSavedFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await savedFoodRepository.getAll();
    setSavedFoods(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveFood = async (food) => {
    const id = await savedFoodRepository.saveIfNew(food);
    await refresh();
    return id;
  };

  const deleteSavedFood = async (id) => {
    await savedFoodRepository.delete(id);
    await refresh();
  };

  return { savedFoods, loading, saveFood, deleteSavedFood, refresh };
}
