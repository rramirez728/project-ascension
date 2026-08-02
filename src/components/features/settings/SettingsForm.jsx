import { useState, useEffect } from 'react';
import { Card } from '../../ui/Card.jsx';
import { Input, Select } from '../../ui/Input.jsx';
import { Button } from '../../ui/Button.jsx';
import { Toast } from '../../ui/Toast.jsx';
import { useTheme } from '../../../contexts/ThemeContext.jsx';

/** Settings form for goals, macros, units, and theme. */
export function SettingsForm({ settings, onSave }) {
  const { setTheme } = useTheme();
  const [form, setForm] = useState(settings);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (!form) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updates = {
      ...form,
      goalWeight: parseFloat(form.goalWeight),
      dailyCalories: parseInt(form.dailyCalories, 10),
      proteinGoal: parseInt(form.proteinGoal, 10),
      carbGoal: parseInt(form.carbGoal, 10),
      fatGoal: parseInt(form.fatGoal, 10),
      waterGoal: parseInt(form.waterGoal, 10),
      stepsGoal: parseInt(form.stepsGoal, 10),
      sleepGoal: parseFloat(form.sleepGoal),
    };
    await onSave(updates);
    setTheme(updates.theme);
    setToast({ message: 'Settings saved successfully', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Weight Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Goal Weight"
              type="number"
              step="0.1"
              value={form.goalWeight}
              onChange={(e) => handleChange('goalWeight', e.target.value)}
            />
            <Select
              label="Units"
              options={[
                { value: 'lb', label: 'Pounds (lb)' },
                { value: 'kg', label: 'Kilograms (kg)' },
              ]}
              value={form.units}
              onChange={(e) => handleChange('units', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Daily Macro Goals</h3>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Calories" type="number" value={form.dailyCalories} onChange={(e) => handleChange('dailyCalories', e.target.value)} />
            <Input label="Protein (g)" type="number" value={form.proteinGoal} onChange={(e) => handleChange('proteinGoal', e.target.value)} />
            <Input label="Carbs (g)" type="number" value={form.carbGoal} onChange={(e) => handleChange('carbGoal', e.target.value)} />
            <Input label="Fat (g)" type="number" value={form.fatGoal} onChange={(e) => handleChange('fatGoal', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Daily Habit Goals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Water (glasses)" type="number" value={form.waterGoal} onChange={(e) => handleChange('waterGoal', e.target.value)} />
            <Input label="Steps" type="number" value={form.stepsGoal} onChange={(e) => handleChange('stepsGoal', e.target.value)} />
            <Input label="Sleep (hours)" type="number" step="0.5" value={form.sleepGoal} onChange={(e) => handleChange('sleepGoal', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Food Search (USDA)</h3>
          <Input
            label="USDA API Key"
            type="password"
            value={form.usdaApiKey ?? ''}
            onChange={(e) => handleChange('usdaApiKey', e.target.value)}
            placeholder="Optional — uses DEMO_KEY if empty"
          />
          <p className="text-xs text-muted mt-2">
            Get a free API key at{' '}
            <a
              href="https://fdc.nal.usda.gov/api-key-signup.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              fdc.nal.usda.gov
            </a>
            . Required for reliable food search and barcode lookup.
          </p>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Appearance</h3>
          <Select
            label="Theme"
            options={[
              { value: 'dark', label: 'Dark (default)' },
              { value: 'light', label: 'Light' },
            ]}
            value={form.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          />
        </Card>

        <Button type="submit" size="lg">Save Settings</Button>
      </form>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}
