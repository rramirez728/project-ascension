export const DATA_CHANGED = 'ascension-data-changed';

/** Tell open screens that nutrition or training records changed. */
export function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED));
}

/** @param {() => void} handler */
export function onDataChanged(handler) {
  window.addEventListener(DATA_CHANGED, handler);
  return () => window.removeEventListener(DATA_CHANGED, handler);
}
