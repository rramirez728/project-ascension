import { parseISO, addDays, format, differenceInDays } from 'date-fns';

/**
 * Estimate goal date based on current weight, goal weight, and recent rate of loss.
 * Uses average weekly change from last 4 weeks of entries.
 */
export function estimateGoalDate(currentWeight, goalWeight, entries) {
  if (currentWeight == null || !entries.length) return null;
  if (currentWeight <= goalWeight) return format(new Date(), 'yyyy-MM-dd');

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-28);
  if (recent.length < 2) return null;

  const daysSpan = differenceInDays(parseISO(recent[recent.length - 1].date), parseISO(recent[0].date));
  if (daysSpan <= 0) return null;

  const weightChange = recent[recent.length - 1].weight - recent[0].weight;
  const dailyRate = weightChange / daysSpan;

  // Assume loss goal — if gaining, invert
  const remaining = currentWeight - goalWeight;
  if (dailyRate >= 0) return null; // not losing weight

  const daysToGoal = Math.ceil(remaining / Math.abs(dailyRate));
  return format(addDays(new Date(), daysToGoal), 'MMM d, yyyy');
}

/** Weight remaining to goal. */
export function weightToGoal(currentWeight, goalWeight) {
  if (currentWeight == null) return null;
  return Math.max(0, currentWeight - goalWeight);
}
