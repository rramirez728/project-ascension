import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardTitle } from '../components/ui/Card.jsx';
import { ProgressRing } from '../components/ui/ProgressRing.jsx';
import { DateNavigator } from '../components/ui/DateNavigator.jsx';
import { NutritionOnboarding } from '../components/features/nutrition/NutritionOnboarding.jsx';
import { useNutritionDashboard } from '../hooks/useNutritionDashboard.js';
import { useSettings } from '../hooks/useSettings.js';
import { applyCalculatedTargets } from '../services/calculations/goalLock.js';
import { weightRepository } from '../database/index.js';
import { todayISO } from '../utils/dates.js';
import { formatWeight } from '../utils/units.js';
import { TrendChart } from '../components/charts/TrendChart.jsx';

const RINGS = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: 'var(--color-nutrition)', goal: 'dailyCalories' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#22c55e', goal: 'proteinGoal' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#38bdf8', goal: 'carbGoal' },
  { key: 'fat', label: 'Fat', unit: 'g', color: '#f59e0b', goal: 'fatGoal' },
];

export default function NutritionDashboardPage() {
  const { settings, updateSettings } = useSettings();
  const [date, setDate] = useState(todayISO());
  const { data, loading } = useNutritionDashboard(date);

  if (!settings) return null;

  const finishOnboarding = async ({ accept, custom, profile, suggestion, customTargets, currentWeight }) => {
    const base = { ...settings, ...profile };
    const locked = {
      calorieTargetManual: true,
      proteinTargetManual: true,
      carbTargetManual: true,
      fatTargetManual: true,
    };
    const next = custom && customTargets
      ? {
          ...base,
          ...locked,
          dailyCalories: customTargets.calories,
          proteinGoal: customTargets.protein,
          carbGoal: customTargets.carbs,
          fatGoal: customTargets.fat,
        }
      : accept
        ? applyCalculatedTargets(base, suggestion, { accept: true })
        : { ...base, ...locked };
    await updateSettings({ ...next, goalChangeSource: 'user' });
    if (currentWeight) {
      await weightRepository.create({ date: todayISO(), weight: currentWeight, note: 'Starting weight' });
    }
  };

  const skipOnboarding = async () => {
    await updateSettings({
      onboardingComplete: true,
      calorieTargetManual: true,
      proteinTargetManual: true,
      carbTargetManual: true,
      fatTargetManual: true,
    });
  };

  if (!settings.onboardingComplete) {
    return (
      <div>
        <PageHeader title="Nutrition" subtitle="Set up targets before the dashboard starts tracking against them" />
        <NutritionOnboarding settings={settings} onFinish={finishOnboarding} onSkip={skipOnboarding} />
      </div>
    );
  }

  const targets = data?.targets;
  const consumed = data?.consumed;

  return (
    <div>
      <PageHeader
        title="Nutrition"
        subtitle="Daily progress is calculated from saved food entries"
        action={<DateNavigator date={date} onChange={setDate} />}
      />

      {loading || !data ? (
        <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {RINGS.map((ring) => {
              const value = consumed[ring.key];
              const goal = targets[ring.goal];
              const remaining = Math.max(0, Math.round((goal - value) * 10) / 10);
              return (
                <Card key={ring.key}>
                  <CardTitle>{ring.label}</CardTitle>
                  <div className="mt-4 flex justify-center">
                    <ProgressRing
                      value={value}
                      max={goal || 1}
                      size={112}
                      color={ring.color}
                      label={`${Math.round(value)}`}
                      sublabel={`/ ${goal}`}
                    />
                  </div>
                  <p className="text-center text-sm mt-3">{Math.round(value)} / {goal} {ring.unit}</p>
                  <p className="text-center text-xs text-muted">{remaining} {ring.unit} remaining</p>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Today&apos;s meals</CardTitle>
                <Link to={`/food?date=${date}`} className="text-sm text-nutrition">Open diary</Link>
              </div>
              {data.entries.length === 0 ? (
                <p className="text-sm text-muted">No foods logged for this date.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.entries.map((entry) => (
                    <div key={entry.id} className="py-3 flex justify-between gap-4">
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-xs text-muted capitalize">
                          {entry.mealType}
                          {entry.quantity ? ` · ${entry.quantity} ${entry.unit}` : ''}
                          {entry.preparationState && entry.preparationState !== 'unknown' ? ` · ${entry.preparationState}` : ''}
                          {entry.confidence && entry.confidence !== 'high' ? ' · estimate' : ''}
                        </p>
                      </div>
                      <p className="text-sm">{Math.round(entry.calories)} kcal</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card>
              <CardTitle>Snapshot</CardTitle>
              <div className="mt-4 space-y-3 text-sm">
                <p>Weight {formatWeight(data.currentWeight, settings.units)}</p>
                <p>7-day average weight {formatWeight(data.weekAverageWeight, settings.units)}</p>
                <p>7-day average calories {data.averages.calories} kcal</p>
                <p>7-day average protein {data.averages.protein} g</p>
                <Link to="/assistant" className="inline-flex items-center justify-center w-full rounded-xl border border-border px-4 py-2 text-sm">
                  Log with AI
                </Link>
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle>Calorie intake</CardTitle>
            <div className="mt-4">
              <TrendChart data={data.history} dataKey="calories" color="#14b8a6" unit="kcal" label="Calories" />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
