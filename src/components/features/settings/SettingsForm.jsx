import { useState, useEffect } from 'react';
import { LogOut, Cloud } from 'lucide-react';
import { Card } from '../../ui/Card.jsx';
import { Input, Select } from '../../ui/Input.jsx';
import { Button } from '../../ui/Button.jsx';
import { Toast } from '../../ui/Toast.jsx';
import { useTheme } from '../../../contexts/ThemeContext.jsx';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { resetLoggedData } from '../../../services/resetUserData.js';
import { ACTIVITY_OPTIONS, FITNESS_GOALS } from '../../../services/calculations/energyCalculations.js';
import { cmToFeetInches, feetInchesToCm } from '../../../utils/units.js';

/** Settings form for goals, macros, units, theme, and account. */
export function SettingsForm({ settings, onSave }) {
  const { setTheme } = useTheme();
  const { user, isCloudEnabled, signOut, updatePassword, showSignIn } = useAuth();
  const [form, setForm] = useState(settings);
  const [toast, setToast] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const heightParts = cmToFeetInches(settings?.heightCm || 0);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (window.location.hash !== '#openai-key') return;
    setShowKeyHelp(true);
    document.getElementById('openai-key')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

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
      age: form.age === '' || form.age == null ? null : parseInt(form.age, 10),
      heightCm: (() => {
        const height = form.units === 'lb'
          ? feetInchesToCm(form.heightFeet ?? heightParts.feet, form.heightInches ?? heightParts.inches)
          : parseFloat(form.heightCm);
        return Number.isFinite(height) && height > 0 ? height : null;
      })(),
      calorieAdjustment: parseInt(form.calorieAdjustment, 10) || 250,
      trustedAutoLogging: Boolean(form.trustedAutoLogging),
      openaiApiKey: String(form.openaiApiKey ?? '').trim(),
    };
    await onSave(updates);
    if (newPassword) {
      await updatePassword(newPassword);
      setNewPassword('');
    }
    setTheme(updates.theme);
    setToast({ message: 'Settings saved successfully', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {isCloudEnabled && !user && (
          <Card>
            <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-2">Account</h3>
            <p className="text-sm">You are using this device only. Sign in to use the assistant and save your data to your account.</p>
            <Button type="button" className="mt-4" onClick={showSignIn}>Sign in</Button>
          </Card>
        )}

        {isCloudEnabled && user && (
          <Card>
            <div className="flex items-start gap-3">
              <Cloud size={20} className="text-accent shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-1">Account</h3>
                <p className="text-sm truncate">{user.email}</p>
                <p className="text-xs text-muted mt-1">Data is saved to your cloud account.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={signOut}>
                <LogOut size={14} /> Sign Out
              </Button>
            </div>
            <div className="mt-4 max-w-sm">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                placeholder="Leave blank to keep the current password"
              />
            </div>
          </Card>
        )}

        <Card id="openai-key">
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">OpenAI assistant</h3>
          <Input
            label="Your OpenAI API key"
            type="password"
            value={form.openaiApiKey ?? ''}
            onChange={(e) => handleChange('openaiApiKey', e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="Leave blank to use the key already set up for this app"
          />
          <p className="text-xs text-muted mt-2">
            Paste your own key to spend your OpenAI credits. A ChatGPT subscription does not pay for this. Leave the field blank to keep using the key already set up for this app.
          </p>
          <button
            type="button"
            className="mt-3 text-sm text-accent hover:underline"
            aria-expanded={showKeyHelp}
            onClick={() => setShowKeyHelp((open) => !open)}
          >
            How to find your OpenAI API key
          </button>
          {showKeyHelp && (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
              <li>
                Open{' '}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  platform.openai.com/api-keys
                </a>
                {' '}and sign in. This is the API site, separate from the ChatGPT app.
              </li>
              <li>Click Create new secret key. Copy it right away. OpenAI shows the full key only once. If you lose it, create a new one.</li>
              <li>Paste the key in the field above and click Save Settings.</li>
              <li>
                Add credits on that same API account. A ChatGPT Plus or Pro plan does not cover the assistant.{' '}
                <a href="https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Open the billing guide
                </a>
                , add a payment method, and buy credits. The smallest purchase is $5.
              </li>
              <li>Auto-reload is on by default when you first buy credits. Turn it off if you do not want OpenAI to buy more automatically.</li>
              <li>If a voice conversation is already open, click End, then Talk, so the new key is used.</li>
              <li>Keep the key private. Anyone who has it can spend your credits.</li>
            </ol>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name" value={form.displayName ?? ''} onChange={(e) => handleChange('displayName', e.target.value)} />
            <Input label="Age" type="number" value={form.age ?? ''} onChange={(e) => handleChange('age', e.target.value)} />
            <Select
              label="Sex used for metabolic calculations"
              options={[
                { value: '', label: 'Not set' },
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ]}
              value={form.sex ?? ''}
              onChange={(e) => handleChange('sex', e.target.value || null)}
            />
            <Select
              label="Activity level"
              options={ACTIVITY_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
              value={form.activityLevel ?? 'moderately_active'}
              onChange={(e) => handleChange('activityLevel', e.target.value)}
            />
            <Select
              label="Fitness goal"
              options={FITNESS_GOALS.map((option) => ({ value: option.value, label: option.label }))}
              value={form.fitnessGoal ?? 'maintain'}
              onChange={(e) => handleChange('fitnessGoal', e.target.value)}
            />
            <Input
              label="Calorie adjustment"
              type="number"
              value={form.calorieAdjustment ?? 250}
              onChange={(e) => handleChange('calorieAdjustment', e.target.value)}
            />
            {form.units === 'lb' ? (
              <>
                <Input label="Height (ft)" type="number" value={form.heightFeet ?? heightParts.feet} onChange={(e) => handleChange('heightFeet', e.target.value)} />
                <Input label="Height (in)" type="number" value={form.heightInches ?? heightParts.inches} onChange={(e) => handleChange('heightInches', e.target.value)} />
              </>
            ) : (
              <Input label="Height (cm)" type="number" value={form.heightCm ?? ''} onChange={(e) => handleChange('heightCm', e.target.value)} />
            )}
          </div>
          <p className="text-xs text-muted mt-3">
            Activity level is selected manually. Apple Health is not available in the browser, so it is not added on top of this estimate.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.trustedAutoLogging)}
              onChange={(e) => handleChange('trustedAutoLogging', e.target.checked)}
            />
            Trusted auto-logging for the AI assistant
          </label>
        </Card>

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
          <p className="text-xs text-muted mb-4">Changing these numbers locks them. Later estimates will not replace a target you set here.</p>
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

      <Card className="max-w-2xl mt-6">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-2">Start over</h3>
        <p className="text-sm text-muted">
          This deletes logged weight, food, workouts, measurements, habits, and photos, including old weigh-ins. Your account and the targets on this page stay.
        </p>
        {confirmReset ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={resetting} onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button
              type="button"
              variant="danger"
              disabled={resetting}
              onClick={async () => {
                setResetting(true);
                try {
                  await resetLoggedData();
                  setConfirmReset(false);
                  setToast({ message: 'Logged data deleted. Your account and targets are still here.', type: 'success' });
                  setTimeout(() => setToast(null), 3000);
                } catch (error) {
                  setToast({ message: error.message || 'Could not reset data.', type: 'error' });
                  setTimeout(() => setToast(null), 4000);
                } finally {
                  setResetting(false);
                }
              }}
            >
              {resetting ? 'Deleting…' : 'Delete all logged data'}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmReset(true)}>
            Reset my data
          </Button>
        )}
      </Card>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}
