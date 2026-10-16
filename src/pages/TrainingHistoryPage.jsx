import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardTitle } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Input.jsx';
import { TrendChart } from '../components/charts/TrendChart.jsx';
import { trainingRepository } from '../database/index.js';
import { useTraining } from '../hooks/useTraining.js';
import { estimatedOneRepMax } from '../services/calculations/trainingCalculations.js';

export default function TrainingHistoryPage() {
  const { exercises } = useTraining();
  const [name, setName] = useState('Lat Pulldown');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;
    trainingRepository.getExerciseHistory(name).then((rows) => {
      if (!cancelled) setHistory(rows);
    });
    return () => { cancelled = true; };
  }, [name]);

  const byDate = new Map();
  for (const set of history) {
    if (set.isWarmup) continue;
    const current = byDate.get(set.date) ?? { date: set.date, weight: 0, e1rm: 0 };
    current.weight = Math.max(current.weight, Number(set.weight) || 0);
    const estimate = estimatedOneRepMax(set.weight, set.reps);
    if (estimate) current.e1rm = Math.max(current.e1rm, estimate.value);
    byDate.set(set.date, current);
  }
  const series = [...byDate.values()].map((row) => ({ ...row, date: String(row.date).slice(5) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Exercise History" subtitle="Working-set weight and estimated one-rep max" />
      <Select
        label="Exercise"
        options={(exercises.length ? exercises : [{ name }]).map((item) => ({ value: item.name, label: item.name }))}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Card>
        <CardTitle>Heaviest set</CardTitle>
        <div className="mt-4">
          <TrendChart data={series} dataKey="weight" color="#f59e0b" label="Weight" />
        </div>
      </Card>
      <Card>
        <CardTitle>Estimated 1RM</CardTitle>
        <p className="text-xs text-muted mt-2">Estimated with the Epley formula unless the set was a true single.</p>
        <div className="mt-4">
          <TrendChart data={series} dataKey="e1rm" color="#6366f1" label="Estimated 1RM" />
        </div>
      </Card>
      <Card>
        <div className="space-y-2 text-sm">
          {history.map((set) => (
            <p key={set.id}>
              {set.date} · set {set.setIndex} · {set.weight} {set.unit} × {set.reps}
              {set.isWarmup ? ' · warm-up' : ''}
              {set.source === 'legacy_aggregate' ? ' · imported' : ''}
            </p>
          ))}
          {history.length === 0 && <p className="text-muted">No sets saved for this exercise.</p>}
        </div>
      </Card>
    </div>
  );
}
