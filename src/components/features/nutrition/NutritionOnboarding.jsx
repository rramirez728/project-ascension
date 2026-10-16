import { useMemo, useState } from 'react';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Input, Select } from '../../ui/Input.jsx';
import { ACTIVITY_OPTIONS, FITNESS_GOALS, buildMacroSuggestion } from '../../../services/calculations/energyCalculations.js';
import { feetInchesToCm } from '../../../utils/units.js';

const STEPS = ['Body', 'Activity', 'Goal', 'Targets'];

/** First-run nutrition profile. Estimates are shown before anything is saved. */
export function NutritionOnboarding({ settings, onFinish, onSkip }) {
  const [step, setStep] = useState(0);
  const [customizing, setCustomizing] = useState(false);
  const [targets, setTargets] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [form, setForm] = useState({
    age: settings.age ?? '',
    sex: settings.sex ?? 'female',
    heightFeet: '',
    heightInches: '',
    heightCm: settings.heightCm ?? '',
    currentWeight: '',
    goalWeight: settings.goalWeight ?? '',
    activityLevel: settings.activityLevel ?? 'moderately_active',
    fitnessGoal: settings.fitnessGoal ?? 'maintain',
    calorieAdjustment: settings.calorieAdjustment ?? 250,
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const suggestion = useMemo(() => buildMacroSuggestion({
    sex: form.sex,
    age: Number(form.age),
    heightCm: settings.units === 'lb'
      ? feetInchesToCm(form.heightFeet, form.heightInches)
      : Number(form.heightCm),
    weight: Number(form.currentWeight),
    units: settings.units,
    activityLevel: form.activityLevel,
    fitnessGoal: form.fitnessGoal,
    calorieAdjustment: Number(form.calorieAdjustment) || 250,
  }), [form, settings.units]);

  const startCustomizing = () => {
    setTargets({
      calories: suggestion.calories ?? '',
      protein: suggestion.protein ?? '',
      carbs: suggestion.carbs ?? '',
      fat: suggestion.fat ?? '',
    });
    setCustomizing(true);
  };

  const customTargets = {
    calories: Number(targets.calories),
    protein: Number(targets.protein),
    carbs: Number(targets.carbs),
    fat: Number(targets.fat),
  };
  const customTargetsReady = [customTargets.calories, customTargets.protein, customTargets.carbs, customTargets.fat]
    .every((value) => Number.isFinite(value) && value > 0);

  const finish = (mode) => {
    const heightCm = settings.units === 'lb'
      ? feetInchesToCm(form.heightFeet, form.heightInches)
      : Number(form.heightCm);
    onFinish({
      accept: mode === 'suggestion',
      custom: mode === 'custom',
      profile: {
        age: Number(form.age),
        sex: form.sex,
        heightCm,
        goalWeight: Number(form.goalWeight),
        activityLevel: form.activityLevel,
        fitnessGoal: form.fitnessGoal,
        calorieAdjustment: Number(form.calorieAdjustment) || 250,
        activitySource: 'manual',
        onboardingComplete: true,
      },
      suggestion,
      customTargets: mode === 'custom' ? customTargets : null,
      currentWeight: Number(form.currentWeight),
    });
  };

  return (
    <Card className="max-w-2xl">
      <p className="text-xs uppercase tracking-wide text-nutrition mb-2">Nutrition setup</p>
      <h2 className="text-xl font-semibold mb-1">{STEPS[step]}</h2>
      <p className="text-sm text-muted mb-6">These numbers are estimates, not a measurement of your metabolism.</p>

      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Age" type="number" value={form.age} onChange={(e) => set('age', e.target.value)} />
          <Select
            label="Sex used for metabolic calculations"
            options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]}
            value={form.sex}
            onChange={(e) => set('sex', e.target.value)}
          />
          {settings.units === 'lb' ? (
            <>
              <Input label="Height (ft)" type="number" value={form.heightFeet} onChange={(e) => set('heightFeet', e.target.value)} />
              <Input label="Height (in)" type="number" value={form.heightInches} onChange={(e) => set('heightInches', e.target.value)} />
            </>
          ) : (
            <Input label="Height (cm)" type="number" value={form.heightCm} onChange={(e) => set('heightCm', e.target.value)} />
          )}
          <Input label={`Current weight (${settings.units})`} type="number" step="0.1" value={form.currentWeight} onChange={(e) => set('currentWeight', e.target.value)} />
          <Input label={`Goal weight (${settings.units})`} type="number" step="0.1" value={form.goalWeight} onChange={(e) => set('goalWeight', e.target.value)} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          {ACTIVITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set('activityLevel', option.value)}
              className={`w-full text-left rounded-xl border px-4 py-3 ${form.activityLevel === option.value ? 'border-nutrition bg-nutrition/10' : 'border-border'}`}
            >
              <p className="font-medium">{option.label}</p>
              <p className="text-sm text-muted">{option.detail}</p>
            </button>
          ))}
          <p className="text-xs text-muted">Apple Health cannot be read from this browser app. Manual activity is used on its own.</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {FITNESS_GOALS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => set('fitnessGoal', option.value)}
              className={`w-full text-left rounded-xl border px-4 py-3 ${form.fitnessGoal === option.value ? 'border-nutrition bg-nutrition/10' : 'border-border'}`}
            >
              <p className="font-medium">{option.label}</p>
              <p className="text-sm text-muted">{option.detail}</p>
            </button>
          ))}
          <Input
            label={form.fitnessGoal === 'bulk' ? 'Surplus (kcal)' : form.fitnessGoal === 'cut' ? 'Deficit (kcal)' : 'Adjustment (kcal)'}
            type="number"
            value={form.calorieAdjustment}
            onChange={(e) => set('calorieAdjustment', e.target.value)}
          />
          {form.fitnessGoal === 'cut' && (
            <p className="text-xs text-muted">A moderate deficit is about 200–300 kcal below estimated maintenance. 250 is the default.</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-muted">Resting calories</p>
              <p className="text-lg font-semibold mt-1">{suggestion.bmr ?? '—'} calories</p>
              <p className="text-xs text-muted mt-1">Calories your body uses in a day if you stayed completely at rest.</p>
            </div>
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-muted">Daily calories with activity</p>
              <p className="text-lg font-semibold mt-1">{suggestion.tdee ?? '—'} calories</p>
              <p className="text-xs text-muted mt-1">An estimate of what you burn in a full day, including movement.</p>
            </div>
          </div>

          {customizing ? (
            <div className="space-y-3">
              <p className="font-medium">Your targets</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Calories" type="number" min="1" value={targets.calories} onChange={(e) => setTargets((prev) => ({ ...prev, calories: e.target.value }))} />
                <Input label="Protein (g)" type="number" min="1" value={targets.protein} onChange={(e) => setTargets((prev) => ({ ...prev, protein: e.target.value }))} />
                <Input label="Carbs (g)" type="number" min="1" value={targets.carbs} onChange={(e) => setTargets((prev) => ({ ...prev, carbs: e.target.value }))} />
                <Input label="Fat (g)" type="number" min="1" value={targets.fat} onChange={(e) => setTargets((prev) => ({ ...prev, fat: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-muted">Suggested daily targets</p>
              <p className="mt-1">Calories {suggestion.calories ?? '—'} · Protein {suggestion.protein ?? '—'} g · Carbs {suggestion.carbs ?? '—'} g · Fat {suggestion.fat ?? '—'} g</p>
            </div>
          )}

          <p className="text-muted">Saving these targets locks them. A later calculation will not replace them unless you accept a new suggestion.</p>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3 mt-6">
        <Button variant="ghost" type="button" onClick={onSkip}>Keep current targets</Button>
        <div className="flex gap-2">
          {step > 0 && <Button variant="secondary" type="button" onClick={() => setStep((value) => value - 1)}>Back</Button>}
          {step < 3 && <Button type="button" onClick={() => setStep((value) => value + 1)}>Continue</Button>}
          {step === 3 && !customizing && (
            <>
              <Button variant="secondary" type="button" onClick={startCustomizing}>Customize targets</Button>
              <Button type="button" onClick={() => finish('suggestion')}>Use these targets</Button>
            </>
          )}
          {step === 3 && customizing && (
            <>
              <Button variant="secondary" type="button" onClick={() => setCustomizing(false)}>Use the suggestion</Button>
              <Button type="button" disabled={!customTargetsReady} onClick={() => finish('custom')}>Save my targets</Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
