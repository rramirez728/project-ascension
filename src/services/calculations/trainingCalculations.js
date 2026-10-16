/** Working-set volume. Warm-up sets contribute nothing. */
export function setVolume(set) {
  if (!set || set.isWarmup) return 0;
  return (Number(set.reps) || 0) * (Number(set.weight) || 0);
}

/** Sum of per-set volume. Sets with different loads are not averaged. */
export function totalVolume(sets) {
  return (sets ?? []).reduce((sum, set) => sum + setVolume(set), 0);
}

/**
 * Epley estimate. A true 1-rep set is not labeled as estimated.
 * @returns {{ value: number, estimated: boolean } | null}
 */
export function estimatedOneRepMax(weight, reps) {
  const load = Number(weight);
  const count = Number(reps);
  if (!load || !count || count < 1) return null;
  if (count === 1) return { value: load, estimated: false };
  return {
    value: Math.round(load * (1 + count / 30) * 10) / 10,
    estimated: true,
  };
}

/** Skipped sessions are never completed workouts. */
export function countsAsCompleted(session) {
  return session?.status === 'completed' || session?.status === 'partial';
}

function workingSets(sets) {
  return (sets ?? []).filter((set) => !set.isWarmup);
}

function maxOf(values) {
  if (!values.length) return 0;
  return Math.max(...values);
}

/**
 * Compare a new group of sets with history for the same exercise.
 * History sets should include `sessionId`.
 */
export function detectPersonalRecords({ historySets = [], newSets = [], sessionId, date, unit = 'lb' }) {
  const prior = workingSets(historySets).filter((set) => set.sessionId !== sessionId);
  const current = workingSets(newSets);
  const records = [];

  const bestWeight = maxOf(current.map((set) => Number(set.weight) || 0));
  const priorBestWeight = maxOf(prior.map((set) => Number(set.weight) || 0));
  if (bestWeight > priorBestWeight && bestWeight > 0) {
    const set = current.find((item) => Number(item.weight) === bestWeight);
    records.push({
      recordType: 'max_weight',
      value: bestWeight,
      weight: bestWeight,
      reps: set?.reps ?? null,
      unit,
      isEstimated: false,
      achievedOn: date,
      sessionId,
    });
  }

  const seenWeights = new Set();
  for (const set of current) {
    const weight = Number(set.weight) || 0;
    if (seenWeights.has(weight)) continue;
    seenWeights.add(weight);
    const bestReps = maxOf(
      current.filter((item) => Number(item.weight) === weight).map((item) => Number(item.reps) || 0),
    );
    const priorReps = maxOf(
      prior.filter((item) => Number(item.weight) === weight).map((item) => Number(item.reps) || 0),
    );
    if (bestReps > priorReps) {
      records.push({
        recordType: 'reps_at_weight',
        value: bestReps,
        weight,
        reps: bestReps,
        unit,
        isEstimated: false,
        achievedOn: date,
        sessionId,
      });
    }
  }

  const volume = totalVolume(newSets);
  const priorVolumes = new Map();
  for (const set of prior) {
    priorVolumes.set(set.sessionId, (priorVolumes.get(set.sessionId) ?? 0) + setVolume(set));
  }
  const priorBestVolume = maxOf([...priorVolumes.values()]);
  if (volume > priorBestVolume && volume > 0) {
    records.push({
      recordType: 'session_volume',
      value: volume,
      weight: null,
      reps: null,
      unit,
      isEstimated: false,
      achievedOn: date,
      sessionId,
    });
  }

  let bestEstimate = null;
  for (const set of current) {
    const estimate = estimatedOneRepMax(set.weight, set.reps);
    if (!estimate) continue;
    if (!bestEstimate || estimate.value > bestEstimate.value) {
      bestEstimate = { ...estimate, weight: Number(set.weight), reps: Number(set.reps) };
    }
  }
  let priorEstimate = 0;
  for (const set of prior) {
    const estimate = estimatedOneRepMax(set.weight, set.reps);
    if (estimate && estimate.value > priorEstimate) priorEstimate = estimate.value;
  }
  if (bestEstimate && bestEstimate.value > priorEstimate) {
    records.push({
      recordType: 'estimated_1rm',
      value: bestEstimate.value,
      weight: bestEstimate.weight,
      reps: bestEstimate.reps,
      unit,
      isEstimated: bestEstimate.estimated,
      achievedOn: date,
      sessionId,
    });
  }

  return records;
}

/** Sets logged per muscle group, using a name → group lookup. */
export function setsByMuscleGroup(sets, groupFor) {
  const totals = {};
  for (const set of workingSets(sets)) {
    const group = groupFor(set.exerciseName) || 'other';
    totals[group] = (totals[group] ?? 0) + 1;
  }
  return totals;
}
