const LB_TO_KG = 0.453592;
const KG_TO_LB = 2.20462;

/** Convert weight between lb and kg. */
export function convertWeight(value, from, to) {
  if (from === to) return value;
  if (from === 'lb' && to === 'kg') return value * LB_TO_KG;
  if (from === 'kg' && to === 'lb') return value * KG_TO_LB;
  return value;
}

/** Format weight with unit label. */
export function formatWeight(value, unit) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)} ${unit}`;
}

/** Unit label for display. */
export function unitLabel(unit) {
  return unit === 'kg' ? 'kg' : 'lbs';
}

/** Convert length between inches and cm based on unit preference. */
export function formatMeasurement(value, unit) {
  if (value == null || Number.isNaN(value)) return '—';
  return unit === 'kg' ? `${value.toFixed(1)} cm` : `${value.toFixed(1)} in`;
}
