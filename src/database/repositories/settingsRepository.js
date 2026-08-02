import { db } from '../db.js';
import { generateId } from '../../utils/id.js';

/** @returns {Promise<import('../../types/index.js').UserSettings>} */
export async function getSettings() {
  const settings = await db.settings.get('user');
  if (!settings) throw new Error('Settings not found');
  return settings;
}

/** @param {Partial<import('../../types/index.js').UserSettings>} updates */
export async function updateSettings(updates) {
  const current = await getSettings();
  await db.settings.put({ ...current, ...updates, id: 'user' });
}

export const settingsRepository = {
  get: getSettings,
  update: updateSettings,
};
