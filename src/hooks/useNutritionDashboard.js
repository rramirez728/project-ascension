import { useCallback, useEffect, useState } from 'react';
import { foodRepository, goalHistoryRepository, weightRepository } from '../database/index.js';
import { useSettingsContext } from '../contexts/SettingsContext.jsx';
import { sumMacros } from '../services/calculations/macroCalculations.js';
import { calculateAverage } from '../services/calculations/weightCalculations.js';
import { shiftISO, todayISO } from '../utils/dates.js';
import { onDataChanged } from '../utils/dataEvents.js';

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Daily nutrition progress, recent meals, and seven-day averages. */
export function useNutritionDashboard(date = todayISO()) {
  const { settings } = useSettingsContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!settings) return;
    setLoading(true);
    const start = shiftISO(date, -6);
    const days = Array.from({ length: 7 }, (_, index) => shiftISO(start, index));
    const [entries, rangeEntries, weights, goal] = await Promise.all([
      foodRepository.getByDate(date),
      foodRepository.getByDateRange(start, date),
      weightRepository.getAll(),
      goalHistoryRepository.getActiveOn(date),
    ]);
    const daily = days.map((day) => sumMacros(rangeEntries.filter((entry) => entry.date === day)));
    const consumed = sumMacros(entries);
    const latest = [...weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
    const weekWeights = weights.filter((entry) => entry.date >= start && entry.date <= date);
    setData({
      entries,
      consumed,
      targets: {
        dailyCalories: goal?.dailyCalories ?? settings.dailyCalories,
        proteinGoal: goal?.proteinGoal ?? settings.proteinGoal,
        carbGoal: goal?.carbGoal ?? settings.carbGoal,
        fatGoal: goal?.fatGoal ?? settings.fatGoal,
      },
      averages: {
        calories: average(daily.map((day) => day.calories)),
        protein: average(daily.map((day) => day.protein)),
      },
      history: days.map((day, index) => ({ date: day, calories: daily[index].calories, protein: daily[index].protein })),
      currentWeight: latest?.weight ?? null,
      weekAverageWeight: calculateAverage(weekWeights),
      startWeight: weights[0]?.weight ?? null,
    });
    setLoading(false);
  }, [date, settings]);

  useEffect(() => {
    refresh();
    return onDataChanged(refresh);
  }, [refresh]);

  return { data, loading, refresh };
}
