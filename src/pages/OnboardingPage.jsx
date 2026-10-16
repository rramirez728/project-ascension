import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useSettingsContext } from '../contexts/SettingsContext.jsx';
import { trainingRepository, weightRepository } from '../database/index.js';
import { FITNESS_GOALS } from '../services/calculations/energyCalculations.js';
import { applyCalculatedTargets } from '../services/calculations/goalLock.js';
import { buildSuggestedPlan } from '../services/plans/suggestedPlan.js';
import { todayISO } from '../utils/dates.js';
import { feetInchesToCm } from '../utils/units.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ACTIVITY_CHOICES = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Little or no exercise' },
  { value: 'lightly_active', label: 'Somewhat active', detail: 'Light exercise a few days a week' },
  { value: 'very_active', label: 'Very active', detail: 'Hard exercise most days' },
  { value: 'extremely_active', label: 'Athlete', detail: 'Training twice a day, or a physical job plus training' },
];

const DAY_CHOICES = [2, 3, 4, 5, 6];

export function stepSequence() {
  return ['welcome', 'sex', 'age', 'height', 'weight', 'goalWeight', 'activity', 'goal', 'days', 'macros', 'workout'];
}

function inRange(value, min, max) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function ChoiceButton({ label, detail, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
        selected ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60 hover:bg-accent/5'
      }`}
    >
      <p className="font-medium">{label}</p>
      {detail && <p className="text-sm text-muted mt-0.5">{detail}</p>}
    </button>
  );
}

/** One question per screen for a first-time profile, macros, and weekly plan. */
export default function OnboardingPage() {
  const { settings, updateSettings } = useSettingsContext();
  const units = settings?.units === 'kg' ? 'kg' : 'lb';
  const [stepId, setStepId] = useState('welcome');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [targets, setTargets] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [form, setForm] = useState({
    sex: '',
    age: '',
    heightFeet: '',
    heightInches: '',
    heightCm: '',
    currentWeight: '',
    goalWeight: '',
    activityLevel: '',
    fitnessGoal: '',
    trainingDays: null,
  });

  const steps = stepSequence();
  const position = Math.max(1, steps.indexOf(stepId) + 1);
  const heightCm = units === 'lb'
    ? feetInchesToCm(form.heightFeet, form.heightInches)
    : Number(form.heightCm);

  const plan = useMemo(
    () => buildSuggestedPlan(form.trainingDays || 3),
    [form.trainingDays],
  );

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const advance = (nextForm = form) => {
    const sequence = stepSequence();
    const index = Math.max(0, sequence.indexOf(stepId));
    const nextId = sequence[Math.min(index + 1, sequence.length - 1)];
    setForm(nextForm);
    setStepId(nextId);
  };

  const back = () => {
    const index = steps.indexOf(stepId);
    if (index > 0) setStepId(steps[index - 1]);
  };

  const choose = (key, value) => {
    advance({ ...form, [key]: value });
  };

  const canContinue = (() => {
    if (stepId === 'age') return inRange(form.age, 10, 100);
    if (stepId === 'height') {
      return units === 'lb'
        ? inRange(form.heightFeet, 3, 8) && inRange(form.heightInches || 0, 0, 11)
        : inRange(form.heightCm, 90, 250);
    }
    if (stepId === 'weight') return inRange(form.currentWeight, 1, 1000);
    if (stepId === 'goalWeight') return inRange(form.goalWeight, 1, 1000);
    return false;
  })();

  const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  const targetsReady = positive(targets.calories) && positive(targets.protein) && positive(targets.fat)
    && targets.carbs !== '' && Number.isFinite(Number(targets.carbs)) && Number(targets.carbs) >= 0;

  const setTarget = (key, value) => setTargets((prev) => ({ ...prev, [key]: value }));

  const finish = async () => {
    setSaving(true);
    setError('');
    try {
      const profile = {
        age: Number(form.age),
        sex: form.sex,
        heightCm,
        goalWeight: Number(form.goalWeight),
        activityLevel: form.activityLevel,
        fitnessGoal: form.fitnessGoal,
        activitySource: 'manual',
        onboardingComplete: true,
      };
      await weightRepository.create({
        date: todayISO(),
        weight: Number(form.currentWeight),
        note: 'Starting weight',
      });
      await trainingRepository.savePlan(buildSuggestedPlan(form.trainingDays));
      const next = applyCalculatedTargets({ ...settings, ...profile }, {
        calories: Number(targets.calories),
        protein: Number(targets.protein),
        carbs: Number(targets.carbs),
        fat: Number(targets.fat),
      }, { accept: true });
      await updateSettings({ ...next, goalChangeSource: 'user' });
    } catch (err) {
      setError(err?.message || 'Could not save your plan.');
      setSaving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    setError('');
    try {
      await updateSettings({
        onboardingComplete: true,
        calorieTargetManual: true,
        proteinTargetManual: true,
        carbTargetManual: true,
        fatTargetManual: true,
      });
    } catch (err) {
      setError(err?.message || 'Could not skip setup.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <p className="text-xs uppercase tracking-wide text-muted mb-3">{position} of {steps.length}</p>

        {stepId === 'welcome' && (
          <div>
            <h1 className="text-3xl font-semibold">Let's calculate a plan for you</h1>
          </div>
        )}

        {stepId === 'sex' && (
          <div>
            <h1 className="text-3xl font-semibold">Sex</h1>
            <p className="text-muted mt-3 mb-6">Saved on your profile.</p>
            <div className="space-y-3">
              <ChoiceButton label="Female" selected={form.sex === 'female'} onClick={() => choose('sex', 'female')} />
              <ChoiceButton label="Male" selected={form.sex === 'male'} onClick={() => choose('sex', 'male')} />
            </div>
          </div>
        )}

        {stepId === 'age' && (
          <form onSubmit={(event) => { event.preventDefault(); if (canContinue) advance(); }}>
            <h1 className="text-3xl font-semibold">Age</h1>
            <p className="text-muted mt-3 mb-6">Years.</p>
            <Input label="Age" type="number" min="10" max="100" autoFocus value={form.age} onChange={(event) => set('age', event.target.value)} />
          </form>
        )}

        {stepId === 'height' && (
          <form onSubmit={(event) => { event.preventDefault(); if (canContinue) advance(); }}>
            <h1 className="text-3xl font-semibold">Height</h1>
            <p className="text-muted mt-3 mb-6">{units === 'lb' ? 'Feet and inches.' : 'Centimeters.'}</p>
            {units === 'lb' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Feet" type="number" min="3" max="8" autoFocus value={form.heightFeet} onChange={(event) => set('heightFeet', event.target.value)} />
                <Input label="Inches" type="number" min="0" max="11" value={form.heightInches} onChange={(event) => set('heightInches', event.target.value)} />
              </div>
            ) : (
              <Input label="Centimeters" type="number" min="90" max="250" autoFocus value={form.heightCm} onChange={(event) => set('heightCm', event.target.value)} />
            )}
          </form>
        )}

        {stepId === 'weight' && (
          <form onSubmit={(event) => { event.preventDefault(); if (canContinue) advance(); }}>
            <h1 className="text-3xl font-semibold">Current weight</h1>
            <p className="text-muted mt-3 mb-6">What you weigh today, in {units}.</p>
            <Input label={`Weight (${units})`} type="number" step="0.1" autoFocus value={form.currentWeight} onChange={(event) => set('currentWeight', event.target.value)} />
          </form>
        )}

        {stepId === 'goalWeight' && (
          <form onSubmit={(event) => { event.preventDefault(); if (canContinue) advance(); }}>
            <h1 className="text-3xl font-semibold">Goal weight</h1>
            <p className="text-muted mt-3 mb-6">The weight you want to reach, in {units}.</p>
            <Input label={`Goal weight (${units})`} type="number" step="0.1" autoFocus value={form.goalWeight} onChange={(event) => set('goalWeight', event.target.value)} />
          </form>
        )}

        {stepId === 'activity' && (
          <div>
            <h1 className="text-3xl font-semibold">Activity level</h1>
            <p className="text-muted mt-3 mb-6">A typical week, including training and the rest of the day.</p>
            <div className="space-y-3">
              {ACTIVITY_CHOICES.map((option) => (
                <ChoiceButton
                  key={option.value}
                  label={option.label}
                  detail={option.detail}
                  selected={form.activityLevel === option.value}
                  onClick={() => choose('activityLevel', option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {stepId === 'goal' && (
          <div>
            <h1 className="text-3xl font-semibold">Fitness goal</h1>
            <p className="text-muted mt-3 mb-6">What you are working toward.</p>
            <div className="space-y-3">
              {FITNESS_GOALS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  label={option.label}
                  detail={option.detail}
                  selected={form.fitnessGoal === option.value}
                  onClick={() => choose('fitnessGoal', option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {stepId === 'days' && (
          <div>
            <h1 className="text-3xl font-semibold">Training days</h1>
            <p className="text-muted mt-3 mb-6">How many days a week can you commit to resistance training?</p>
            <div className="space-y-3">
              {DAY_CHOICES.map((days) => (
                <ChoiceButton
                  key={days}
                  label={`${days} days`}
                  selected={form.trainingDays === days}
                  onClick={() => choose('trainingDays', days)}
                />
              ))}
            </div>
          </div>
        )}

        {stepId === 'macros' && (
          <form onSubmit={(event) => { event.preventDefault(); if (targetsReady) advance(); }}>
            <h1 className="text-3xl font-semibold">Configure your plan</h1>
            <p className="text-muted mt-3 mb-6">Enter the daily calories, protein, carbs, and fat you want to follow.</p>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Calories" type="number" min="1" autoFocus value={targets.calories} onChange={(event) => setTarget('calories', event.target.value)} />
              <Input label="Protein (g)" type="number" min="1" value={targets.protein} onChange={(event) => setTarget('protein', event.target.value)} />
              <Input label="Carbs (g)" type="number" min="0" value={targets.carbs} onChange={(event) => setTarget('carbs', event.target.value)} />
              <Input label="Fat (g)" type="number" min="1" value={targets.fat} onChange={(event) => setTarget('fat', event.target.value)} />
            </div>
          </form>
        )}

        {stepId === 'workout' && (
          <div>
            <h1 className="text-3xl font-semibold">Suggested workout plan</h1>
            <p className="text-muted mt-3">Based on the days you can train.</p>
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium">{plan.name}</p>
              {plan.days.map((day) => (
                <div key={day.weekday} className="rounded-xl border border-border px-4 py-3">
                  <p className="text-sm font-medium">{WEEKDAYS[day.weekday]} · {day.focus}</p>
                  <p className="text-sm text-muted mt-1">
                    {day.exercises.length
                      ? day.exercises.map((exercise) => `${exercise.exerciseName} · ${exercise.sets} × ${exercise.targetReps}`).join(', ')
                      : 'Rest'}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-4">You can edit this week later on Weekly Plan.</p>
            <p className="text-sm mt-3 rounded-xl border border-border bg-surface px-4 py-3">
              Please note that you can adjust these settings anytime in the{' '}
              <Settings size={15} className="inline-block align-text-bottom mx-0.5" aria-hidden="true" />{' '}
              Settings of this application.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-danger mt-4">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-8">
          {stepId === 'welcome' ? (
            <Button variant="ghost" onClick={skip} disabled={saving}>Skip for now</Button>
          ) : (
            <Button variant="secondary" onClick={back} disabled={saving}>Back</Button>
          )}
          {stepId === 'welcome' && <Button onClick={() => advance()}>Continue</Button>}
          {['age', 'height', 'weight', 'goalWeight'].includes(stepId) && (
            <Button onClick={() => advance()} disabled={!canContinue}>Continue</Button>
          )}
          {stepId === 'macros' && (
            <Button onClick={() => advance()} disabled={!targetsReady}>Continue</Button>
          )}
          {stepId === 'workout' && (
            <Button onClick={finish} disabled={!targetsReady || saving}>
              {saving ? 'Saving…' : 'Use this plan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
