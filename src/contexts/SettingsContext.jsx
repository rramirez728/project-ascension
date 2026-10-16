import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { goalHistoryRepository, settingsRepository } from '../database/index.js';
import { seedDatabase } from '../database/seed.js';
import { lockEditedTargets, targetsChanged } from '../services/calculations/goalLock.js';
import { todayISO } from '../utils/dates.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    await seedDatabase();
    const data = await settingsRepository.get();
    setSettings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates) => {
    const current = await settingsRepository.get();
    const { goalChangeSource, ...rest } = updates;
    const nextUpdates = goalChangeSource === 'calculator'
      ? rest
      : lockEditedTargets(current, rest);
    await settingsRepository.update(nextUpdates);
    const data = await settingsRepository.get();
    if (targetsChanged(current, nextUpdates)) {
      await goalHistoryRepository.record({
        effectiveFrom: todayISO(),
        dailyCalories: data.dailyCalories,
        proteinGoal: data.proteinGoal,
        carbGoal: data.carbGoal,
        fatGoal: data.fatGoal,
        goalWeight: data.goalWeight,
        source: goalChangeSource === 'calculator' ? 'calculator' : 'user',
      });
    }
    setSettings(data);
    return data;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, reload: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettingsContext must be used within SettingsProvider');
  return ctx;
}
