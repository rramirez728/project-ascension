import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardTitle } from '../components/ui/Card.jsx';
import { TrendChart } from '../components/charts/TrendChart.jsx';
import { foodRepository, goalHistoryRepository, weightRepository } from '../database/index.js';
import { useSettings } from '../hooks/useSettings.js';
import { sumMacros } from '../services/calculations/macroCalculations.js';
import { shiftISO, todayISO } from '../utils/dates.js';
import { formatWeight } from '../utils/units.js';

export default function NutritionHistoryPage() {
  const { settings } = useSettings();
  const [calories, setCalories] = useState([]);
  const [protein, setProtein] = useState([]);
  const [weights, setWeights] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const end = todayISO();
      const start = shiftISO(end, -29);
      const [entries, weightEntries, history] = await Promise.all([
        foodRepository.getByDateRange(start, end),
        weightRepository.getByDateRange(start, end),
        goalHistoryRepository.getAll(),
      ]);
      if (cancelled) return;
      const days = [];
      for (let i = 29; i >= 0; i -= 1) days.push(shiftISO(end, -i));
      setCalories(days.map((date) => ({
        date: date.slice(5),
        calories: sumMacros(entries.filter((entry) => entry.date === date)).calories,
      })));
      setProtein(days.map((date) => ({
        date: date.slice(5),
        protein: sumMacros(entries.filter((entry) => entry.date === date)).protein,
      })));
      setWeights(weightEntries.map((entry) => ({ date: entry.date.slice(5), weight: entry.weight })));
      setGoals(history);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Nutrition History" subtitle="Logged values stay as they were saved" />
      <Card>
        <CardTitle>Calories</CardTitle>
        <div className="mt-4">
          <TrendChart data={calories} dataKey="calories" color="#14b8a6" unit="kcal" label="Calories" />
        </div>
      </Card>
      <Card>
        <CardTitle>Protein</CardTitle>
        <div className="mt-4">
          <TrendChart data={protein} dataKey="protein" color="#22c55e" unit="g" label="Protein" />
        </div>
      </Card>
      <Card>
        <CardTitle>Weight</CardTitle>
        <div className="mt-4">
          {weights.length ? (
            <TrendChart data={weights} dataKey="weight" color="#6366f1" unit={settings?.units || 'lb'} label="Weight" />
          ) : (
            <p className="text-sm text-muted">No weigh-ins in the last 30 days.</p>
          )}
        </div>
      </Card>
      <Card>
        <CardTitle>Target history</CardTitle>
        <div className="mt-4 space-y-2 text-sm">
          {goals.length === 0 && <p className="text-muted">Targets will appear here after the next change.</p>}
          {goals.map((goal) => (
            <p key={goal.id}>
              {goal.effectiveFrom}: {goal.dailyCalories} kcal · P {goal.proteinGoal}g · C {goal.carbGoal}g · F {goal.fatGoal}g
              {goal.goalWeight != null ? ` · goal ${formatWeight(goal.goalWeight, settings?.units || 'lb')}` : ''}
              {' '}({goal.source})
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
