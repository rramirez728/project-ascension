import { useState, useEffect, useCallback } from 'react';
import { weightRepository, foodRepository, habitRepository, workoutRepository } from '../database/index.js';
import { useSettingsContext } from '../contexts/SettingsContext.jsx';
import { calculateWeeklyChange } from '../services/calculations/weightCalculations.js';
import { sumMacros, calculateRemaining } from '../services/calculations/macroCalculations.js';
import { estimateGoalDate } from '../services/calculations/goalCalculations.js';
import { todayISO } from '../utils/dates.js';
import { formatWeight } from '../utils/units.js';
import { onDataChanged } from '../utils/dataEvents.js';

/** Aggregates all dashboard stats from repositories. */
export function useDashboardStats() {
  const { settings, loading: settingsLoading } = useSettingsContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!settings) return;

    setLoading(true);
    const today = todayISO();

    const [weightEntries, foodToday, habitToday, workoutsToday] = await Promise.all([
      weightRepository.getAll(),
      foodRepository.getByDate(today),
      habitRepository.getByDate(today),
      workoutRepository.getByDate(today),
    ]);

    const latest = weightEntries[weightEntries.length - 1] ?? null;
    const weeklyChange = calculateWeeklyChange(weightEntries);
    const macros = sumMacros(foodToday);
    const remaining = calculateRemaining(macros, settings);
    const goalDate = estimateGoalDate(latest?.weight, settings.goalWeight, weightEntries);

    setStats({
      currentWeight: latest ? formatWeight(latest.weight, settings.units) : '—',
      currentWeightRaw: latest?.weight ?? null,
      weeklyChange: weeklyChange != null ? `${weeklyChange > 0 ? '+' : ''}${weeklyChange.toFixed(1)} ${settings.units}` : '—',
      weeklyChangeRaw: weeklyChange,
      goalWeight: formatWeight(settings.goalWeight, settings.units),
      goalDate: goalDate ?? '—',
      caloriesRemaining: remaining.calories,
      proteinRemaining: remaining.protein,
      caloriesConsumed: macros.calories,
      proteinConsumed: macros.protein,
      dailyCalories: settings.dailyCalories,
      proteinGoal: settings.proteinGoal,
      steps: habitToday?.steps ?? 0,
      stepsGoal: settings.stepsGoal,
      water: habitToday?.water ?? 0,
      waterGoal: settings.waterGoal,
      sleep: habitToday?.sleep ?? 0,
      sleepGoal: settings.sleepGoal,
      workoutDone: habitToday?.workoutDone ?? workoutsToday.length > 0,
      workoutCount: workoutsToday.length,
    });
    setLoading(false);
  }, [settings]);

  useEffect(() => {
    if (!settingsLoading && settings) {
      refresh();
      return onDataChanged(refresh);
    }
    return undefined;
  }, [settings, settingsLoading, refresh]);

  return { stats, loading: loading || settingsLoading, refresh };
}
