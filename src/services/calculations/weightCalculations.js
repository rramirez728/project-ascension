import { parseISO, differenceInDays, addDays, format } from 'date-fns';

/** Calculate average weight from entries. */
export function calculateAverage(entries) {
  if (!entries.length) return null;
  const sum = entries.reduce((acc, e) => acc + e.weight, 0);
  return sum / entries.length;
}

/** Weekly weight change (current vs 7 days ago). */
export function calculateWeeklyChange(entries) {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const weekAgo = sorted.find((e) => {
    const diff = differenceInDays(parseISO(latest.date), parseISO(e.date));
    return diff >= 6 && diff <= 8;
  }) ?? sorted[0];
  return latest.weight - weekAgo.weight;
}

/** Filter entries within a date range. */
export function filterByDateRange(entries, start, end) {
  return entries.filter((e) => e.date >= start && e.date <= end);
}
