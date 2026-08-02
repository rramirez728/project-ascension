import { useState, useEffect } from 'react';
import { Card } from '../../ui/Card.jsx';
import { Input, Select } from '../../ui/Input.jsx';
import { Button } from '../../ui/Button.jsx';
import { TrendChart } from '../../charts/TrendChart.jsx';
import { formatDate, lastNDays } from '../../../utils/dates.js';

const MOOD_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: '1', label: '😞 Very low' },
  { value: '2', label: '😐 Low' },
  { value: '3', label: '🙂 Okay' },
  { value: '4', label: '😊 Good' },
  { value: '5', label: '🤩 Great' },
];

function habitToForm(habit) {
  return {
    water: habit?.water ?? 0,
    sleep: habit?.sleep ?? 0,
    steps: habit?.steps ?? 0,
    cardio: habit?.cardio ?? false,
    workoutDone: habit?.workoutDone ?? false,
    mood: habit?.mood?.toString() ?? '',
  };
}

/** Daily habits form and history. */
export function HabitsTracker({ todayHabit, entries, loading, onUpdate }) {
  const [form, setForm] = useState(habitToForm(null));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(habitToForm(todayHabit));
  }, [todayHabit]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await onUpdate({
      water: parseInt(form.water, 10) || 0,
      sleep: parseFloat(form.sleep) || 0,
      steps: parseInt(form.steps, 10) || 0,
      cardio: form.cardio,
      workoutDone: form.workoutDone,
      mood: form.mood ? parseInt(form.mood, 10) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const last7 = lastNDays(7).reverse();
  const chartData = last7.map((date) => {
    const entry = entries.find((e) => e.date === date);
    return {
      date: formatDate(date, 'EEE'),
      value: entry?.steps ?? 0,
    };
  });

  if (loading) return <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Today's Habits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Water (glasses)"
            type="number"
            value={form.water}
            onChange={(e) => handleChange('water', e.target.value)}
          />
          <Input
            label="Sleep (hours)"
            type="number"
            step="0.5"
            value={form.sleep}
            onChange={(e) => handleChange('sleep', e.target.value)}
          />
          <Input
            label="Steps"
            type="number"
            value={form.steps}
            onChange={(e) => handleChange('steps', e.target.value)}
          />
          <Select
            label="Mood"
            options={MOOD_OPTIONS}
            value={form.mood}
            onChange={(e) => handleChange('mood', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.cardio}
              onChange={(e) => handleChange('cardio', e.target.checked)}
              className="rounded accent-accent"
            />
            Cardio completed
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.workoutDone}
              onChange={(e) => handleChange('workoutDone', e.target.checked)}
              className="rounded accent-accent"
            />
            Workout completed
          </label>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave}>Save Habits</Button>
          {saved && <span className="text-sm text-success">Saved!</span>}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Steps — Last 7 Days</h3>
        <TrendChart data={chartData} label="Steps" color="#22c55e" />
      </Card>
    </div>
  );
}
