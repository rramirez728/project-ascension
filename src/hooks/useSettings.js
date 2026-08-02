import { useSettingsContext } from '../contexts/SettingsContext.jsx';

/** Convenience hook wrapping settings context. */
export function useSettings() {
  return useSettingsContext();
}
