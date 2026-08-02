import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingsRepository } from '../database/index.js';
import { seedDatabase } from '../database/seed.js';

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
    await settingsRepository.update(updates);
    const data = await settingsRepository.get();
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
