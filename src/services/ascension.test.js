import { describe, expect, it } from 'vitest';
import { sumMacros, calculateRemaining } from './calculations/macroCalculations.js';
import { buildMacroSuggestion, calculateBmr, suggestCalorieTarget } from './calculations/energyCalculations.js';
import { applyCalculatedTargets, lockEditedTargets } from './calculations/goalLock.js';
import { preparationMatches, scaleFoodMacros } from './calculations/foodScaling.js';
import { countsAsCompleted, detectPersonalRecords, estimatedOneRepMax, totalVolume } from './calculations/trainingCalculations.js';
import { findFoodCorrectionTarget, findSetCorrectionTarget, isHypotheticalUtterance, validateToolCall } from './ai/toolValidation.js';
import { canonicalExerciseName, sameExercise } from '../data/exercises.js';
import { buildSuggestedPlan } from './plans/suggestedPlan.js';
import { groupLoggedSets } from '../pages/WorkoutPage.jsx';
import { stepSequence } from '../pages/OnboardingPage.jsx';

describe('nutrition totals', () => {
  it('adds, edits, and deletes a food from the daily total', () => {
    const goals = { dailyCalories: 1800, proteinGoal: 160, carbGoal: 180, fatGoal: 60 };
    let entries = [];
    entries = [...entries, { id: 'a', calories: 200, protein: 30, carbs: 0, fat: 4 }];
    expect(sumMacros(entries).calories).toBe(200);
    entries = entries.map((entry) => (entry.id === 'a' ? { ...entry, calories: 150, protein: 25 } : entry));
    expect(sumMacros(entries)).toMatchObject({ calories: 150, protein: 25 });
    entries = entries.filter((entry) => entry.id !== 'a');
    expect(sumMacros(entries).calories).toBe(0);
    expect(calculateRemaining(sumMacros(entries), goals).calories).toBe(1800);
  });

  it('keeps saved macros instead of a later reference value', () => {
    const saved = { calories: 256, protein: 54, carbs: 0, fat: 5.5 };
    const changedReference = { calories: 300, protein: 60, carbs: 0, fat: 6 };
    expect(saved).not.toEqual(changedReference);
    expect(sumMacros([saved]).calories).toBe(256);
  });
});

describe('energy and goal lock', () => {
  it('uses Mifflin-St Jeor and a moderate cut', () => {
    const bmr = calculateBmr({ sex: 'male', weightKg: 90, heightCm: 180, age: 30 });
    expect(bmr).toBe(Math.round(10 * 90 + 6.25 * 180 - 5 * 30 + 5));
    const suggestion = buildMacroSuggestion({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weight: 200,
      units: 'lb',
      activityLevel: 'moderately_active',
      fitnessGoal: 'cut',
      calorieAdjustment: 250,
    });
    expect(suggestion.calories).toBe(suggestion.tdee - 250);
    expect(suggestCalorieTarget(2000, 'cut', 250)).toBe(1750);
    const maintenance = buildMacroSuggestion({
      sex: 'male',
      age: 30,
      heightCm: 180,
      weight: 200,
      units: 'lb',
      activityLevel: 'lightly_active',
      fitnessGoal: 'maintain',
      calorieAdjustment: 0,
    });
    expect(maintenance.calories).toBe(maintenance.tdee);
    expect(maintenance.tdee).toBe(Math.round(maintenance.bmr * 1.375));
  });

  it('does not replace a manual calorie target', () => {
    const settings = {
      dailyCalories: 1800,
      proteinGoal: 160,
      carbGoal: 180,
      fatGoal: 60,
      calorieTargetManual: true,
      proteinTargetManual: true,
      carbTargetManual: true,
      fatTargetManual: true,
    };
    const next = applyCalculatedTargets(settings, { calories: 2400, protein: 180, carbs: 250, fat: 70 });
    expect(next.dailyCalories).toBe(1800);
    const accepted = applyCalculatedTargets(settings, { calories: 2400, protein: 180, carbs: 250, fat: 70 }, { accept: true });
    expect(accepted.dailyCalories).toBe(2400);
    expect(accepted.calorieTargetManual).toBe(true);
  });

  it('locks a target the user edits', () => {
    const updates = lockEditedTargets(
      { dailyCalories: 2000, proteinGoal: 150, carbGoal: 200, fatGoal: 65 },
      { dailyCalories: 1800 },
    );
    expect(updates.calorieTargetManual).toBe(true);
    expect(updates.proteinTargetManual).toBeUndefined();
  });
});

describe('food preparation and scaling', () => {
  it('does not treat raw and cooked as the same weight', () => {
    expect(preparationMatches('raw', 'cooked').reason).toBe('raw_cooked_mismatch');
  });

  it('scales a per-100g reference', () => {
    const scaled = scaleFoodMacros(
      { calories: 120, protein: 22.5, carbs: 0, fat: 2.6, basis: 'per_100g' },
      { quantity: 256, unit: 'g' },
    );
    expect(scaled.ok).toBe(true);
    expect(scaled.calories).toBe(307.2);
    expect(scaled.protein).toBe(57.6);
  });
});

describe('training math', () => {
  it('stores volume as the sum of each set', () => {
    const sets = [
      { reps: 13, weight: 200 },
      { reps: 13, weight: 200 },
      { reps: 13, weight: 200 },
      { reps: 10, weight: 200 },
      { reps: 10, weight: 200 },
    ];
    expect(totalVolume(sets)).toBe((13 * 200 * 3) + (10 * 200 * 2));
    expect(totalVolume([{ reps: 10, weight: 100, isWarmup: true }, { reps: 8, weight: 150 }])).toBe(1200);
  });

  it('detects a heavier set and labels estimated maxes', () => {
    const records = detectPersonalRecords({
      historySets: [{ sessionId: 'old', weight: 110, reps: 10, isWarmup: false }],
      newSets: [{ weight: 120, reps: 10, isWarmup: false }],
      sessionId: 'new',
      date: '2026-10-15',
    });
    expect(records.some((record) => record.recordType === 'max_weight' && record.value === 120)).toBe(true);
    const estimate = estimatedOneRepMax(120, 10);
    expect(estimate.estimated).toBe(true);
    expect(estimatedOneRepMax(120, 1).estimated).toBe(false);
  });

  it('does not count a skipped workout as completed', () => {
    expect(countsAsCompleted({ status: 'skipped' })).toBe(false);
    expect(countsAsCompleted({ status: 'completed' })).toBe(true);
  });
});

describe('assistant tool rules', () => {
  const food = {
    confirmed: true,
    name: 'Chicken breast',
    quantity: 256,
    unit: 'g',
    preparationState: 'raw',
    calories: 307,
    protein: 58,
    carbs: 0,
    fat: 6,
    source: 'usda',
    confidence: 'high',
  };

  it('parses an explicit log and rejects a hypothetical', () => {
    expect(validateToolCall('add_food_entry', food, { userText: 'I ate 256 grams of raw chicken breast' }).ok).toBe(true);
    expect(isHypotheticalUtterance("I'm thinking about adding some avocado")).toBe(true);
    expect(validateToolCall('add_food_entry', food, { userText: "I'm thinking about adding some avocado" }).error).toBe('hypothetical_not_logged');
  });

  it('requires an update for corrections and rejects duplicate requests', () => {
    expect(validateToolCall('add_food_entry', food, { userText: 'Actually, I only used six grams of butter, not ten' }).error).toBe('correction_requires_update');
    expect(validateToolCall('log_exercise_sets', {
      confirmed: true,
      exerciseName: 'Lat Pulldown',
      sets: [{ reps: 8, weight: 120 }],
    }, { userText: 'Actually, the last set was only eight reps' }).error).toBe('correction_requires_set_update');
    expect(validateToolCall('add_food_entry', { ...food, clientRequestId: 'req-1' }, {
      userText: 'add chicken',
      existingRequestIds: ['req-1'],
    }).error).toBe('duplicate_request');
  });

  it('asks instead of saving an ambiguous correction', () => {
    const entries = [
      { id: '1', name: 'Butter', mealType: 'breakfast' },
      { id: '2', name: 'Butter', mealType: 'dinner' },
    ];
    expect(findFoodCorrectionTarget(entries, { name: 'butter' }).status).toBe('ambiguous');
    expect(findFoodCorrectionTarget([{ id: '1', name: 'Butter', mealType: 'breakfast' }], { name: 'butter' }).entry.id).toBe('1');
  });

  it('updates the last set instead of adding one', () => {
    const sets = [
      { id: 'a', exerciseName: 'Cable Row', setIndex: 1 },
      { id: 'b', exerciseName: 'Cable Row', setIndex: 5 },
    ];
    expect(findSetCorrectionTarget(sets, { exerciseName: 'cable row', lastSet: true }).set.id).toBe('b');
  });

  it('matches inclined dumbbell bench press to the catalog press', () => {
    expect(sameExercise('inclined dumbbell bench press', 'Incline Dumbbell Press')).toBe(true);
    expect(canonicalExerciseName('inclined dumbbell bench press')).toBe('Incline Dumbbell Press');
    expect(sameExercise('Bench Press', 'Incline Dumbbell Press')).toBe(false);
    expect(sameExercise('barbell bench', 'Bench Press')).toBe(true);
  });

  it('builds a weekly plan from committed training days', () => {
    const plan = buildSuggestedPlan(4);
    expect(plan.name).toBe('4-day upper/lower');
    expect(plan.days).toHaveLength(7);
    expect(plan.days.filter((day) => day.exercises.length).map((day) => day.weekday)).toEqual([1, 2, 4, 5]);
    expect(plan.days[0].focus).toBe('Rest');
    const five = buildSuggestedPlan(5);
    expect(five.days[1].focus).toBe('Chest & Triceps');
    expect(five.days[1].exercises[0].exerciseName).toBe('Bench Press');
    const steps = stepSequence();
    expect(steps.indexOf('macros')).toBeLessThan(steps.indexOf('workout'));
    expect(steps).not.toContain('pace');
  });

  it('groups logged sets by exercise instead of interleaving them', () => {
    const groups = groupLoggedSets([
      { id: '1', exerciseName: 'Bicep curls', setIndex: 1 },
      { id: '2', exerciseName: 'Cable Flys', setIndex: 1 },
      { id: '3', exerciseName: 'Bicep curls', setIndex: 2 },
      { id: '4', exerciseName: 'Cable Flys', setIndex: 2 },
    ]);
    expect(groups.map((group) => group.name)).toEqual(['Bicep curls', 'Cable Flys']);
    expect(groups[0].sets.map((set) => set.setIndex)).toEqual([1, 2]);
  });

  it('does not report a failed validation as saved', () => {
    const result = validateToolCall('log_body_weight', { weight: 214, date: '2026-10-15' }, { userText: 'I weighed 214 pounds' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('confirmation_required');
  });
});
