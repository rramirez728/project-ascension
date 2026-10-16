import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { useSettings } from '../hooks/useSettings.js';
import { weightRepository } from '../database/index.js';
import { ACTIVITY_OPTIONS, FITNESS_GOALS, buildMacroSuggestion } from '../services/calculations/energyCalculations.js';
import { applyCalculatedTargets } from '../services/calculations/goalLock.js';

export default function MacroGoalsPage() {
  const { settings, updateSettings } = useSettings();
  const [form, setForm] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setForm({
        dailyCalories: settings.dailyCalories,
        proteinGoal: settings.proteinGoal,
        carbGoal: settings.carbGoal,
        fatGoal: settings.fatGoal,
        fitnessGoal: settings.fitnessGoal ?? 'maintain',
        activityLevel: settings.activityLevel ?? 'moderately_active',
        calorieAdjustment: settings.calorieAdjustment ?? 250,
      });
    }
  }, [settings]);

  if (!form || !settings) return null;

  const preview = async () => {
    const weights = await weightRepository.getAll();
    const latest = weights.at(-1);
    const next = buildMacroSuggestion({
      sex: settings.sex,
      age: settings.age,
      heightCm: settings.heightCm,
      weight: latest?.weight,
      units: settings.units,
      activityLevel: form.activityLevel,
      fitnessGoal: form.fitnessGoal,
      calorieAdjustment: Number(form.calorieAdjustment) || 250,
    });
    setSuggestion(next);
    setMessage(next.calories
      ? 'This is an estimate. It is not saved until you accept it. Locked targets stay as they are unless you accept.'
      : 'Add age, sex, height, and a weigh-in before a suggestion can be calculated.');
  };

  const saveManual = async () => {
    await updateSettings({
      dailyCalories: Number(form.dailyCalories),
      proteinGoal: Number(form.proteinGoal),
      carbGoal: Number(form.carbGoal),
      fatGoal: Number(form.fatGoal),
      fitnessGoal: form.fitnessGoal,
      activityLevel: form.activityLevel,
      calorieAdjustment: Number(form.calorieAdjustment) || 250,
      goalChangeSource: 'user',
    });
    setMessage('Targets saved. Manual values will not be replaced automatically.');
  };

  const acceptSuggestion = async () => {
    if (!suggestion?.calories) return;
    const next = applyCalculatedTargets(settings, suggestion, { accept: true });
    await updateSettings({
      ...next,
      fitnessGoal: form.fitnessGoal,
      activityLevel: form.activityLevel,
      calorieAdjustment: Number(form.calorieAdjustment) || 250,
      goalChangeSource: 'user',
    });
    setMessage('Suggestion accepted and locked.');
  };

  return (
    <div>
      <PageHeader title="Macro Goals" subtitle="Your numbers always win over a later estimate" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl">
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Your targets</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Calories" type="number" value={form.dailyCalories} onChange={(e) => setForm({ ...form, dailyCalories: e.target.value })} />
            <Input label="Protein (g)" type="number" value={form.proteinGoal} onChange={(e) => setForm({ ...form, proteinGoal: e.target.value })} />
            <Input label="Carbs (g)" type="number" value={form.carbGoal} onChange={(e) => setForm({ ...form, carbGoal: e.target.value })} />
            <Input label="Fat (g)" type="number" value={form.fatGoal} onChange={(e) => setForm({ ...form, fatGoal: e.target.value })} />
          </div>
          <Button className="mt-4" onClick={saveManual}>Save my targets</Button>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Estimate</h3>
          <div className="space-y-4">
            <Select
              label="Activity"
              options={ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              value={form.activityLevel}
              onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
            />
            <Select
              label="Goal"
              options={FITNESS_GOALS.map((option) => ({ value: option.value, label: option.label }))}
              value={form.fitnessGoal}
              onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
            />
            <Input
              label="Deficit or surplus"
              type="number"
              value={form.calorieAdjustment}
              onChange={(e) => setForm({ ...form, calorieAdjustment: e.target.value })}
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={preview}>Calculate estimate</Button>
              <Button onClick={acceptSuggestion} disabled={!suggestion?.calories}>Accept and lock</Button>
            </div>
            {suggestion?.calories && (
              <p className="text-sm">
                Resting calories {suggestion.bmr} · Daily calories with activity {suggestion.tdee} · Suggested calories {suggestion.calories} · Protein {suggestion.protein} g · Carbs {suggestion.carbs} g · Fat {suggestion.fat} g
              </p>
            )}
            {message && <p className="text-xs text-muted">{message}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
