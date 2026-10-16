import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardTitle, StatValue } from '../components/ui/Card.jsx';
import { useTraining } from '../hooks/useTraining.js';
import { countsAsCompleted, totalVolume } from '../services/calculations/trainingCalculations.js';
import { shiftISO, todayISO } from '../utils/dates.js';
import { TrendChart } from '../components/charts/TrendChart.jsx';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function setsByGroup(sessions, exercises) {
  const lookup = new Map(exercises.map((item) => [item.name.toLowerCase(), item.muscleGroup]));
  const totals = {};
  for (const session of sessions.filter(countsAsCompleted)) {
    for (const set of session.sets ?? []) {
      if (set.isWarmup) continue;
      const group = lookup.get(set.exerciseName.toLowerCase()) || 'other';
      totals[group] = (totals[group] ?? 0) + 1;
    }
  }
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

export default function TrainingDashboardPage() {
  const { plan, sessions, records, exercises, loading } = useTraining();
  const today = todayISO();
  const weekday = new Date(`${today}T12:00:00`).getDay();
  const scheduled = plan?.days?.find((day) => day.weekday === weekday);
  const recent = [...sessions].reverse().find((session) => session.date <= today);
  const weekStart = shiftISO(today, -6);
  const weekSessions = sessions.filter((session) => session.date >= weekStart && session.date <= today);
  const completed = weekSessions.filter(countsAsCompleted);
  const volume = completed.reduce((sum, session) => sum + totalVolume(session.sets), 0);
  const setCount = completed.reduce((sum, session) => sum + (session.sets?.filter((set) => !set.isWarmup).length ?? 0), 0);
  const groups = setsByGroup(weekSessions, exercises);

  const weeks = [];
  for (let index = 7; index >= 0; index -= 1) {
    const end = shiftISO(today, -7 * index);
    const start = shiftISO(end, -6);
    const slice = sessions.filter((session) => session.date >= start && session.date <= end && countsAsCompleted(session));
    weeks.push({ date: end.slice(5), volume: slice.reduce((sum, session) => sum + totalVolume(session.sets), 0) });
  }

  return (
    <div>
      <PageHeader title="Training" subtitle="Completed sets are stored individually" action={<Link to="/workouts" className="text-sm text-training">Log workout</Link>} />
      {loading ? (
        <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardTitle>Today</CardTitle>
              <p className="mt-3 text-lg font-semibold">{scheduled?.focus || 'No plan yet'}</p>
              <p className="text-sm text-muted">{WEEKDAYS[weekday]}</p>
            </Card>
            <Card>
              <CardTitle>Last workout</CardTitle>
              <p className="mt-3 text-lg font-semibold">{recent ? recent.date : 'None yet'}</p>
              <p className="text-sm text-muted capitalize">{recent?.status || '—'}</p>
            </Card>
            <Card>
              <CardTitle>7-day sessions</CardTitle>
              <StatValue>{completed.length}</StatValue>
              <p className="text-sm text-muted">Skipped days are not counted</p>
            </Card>
            <Card>
              <CardTitle>7-day volume</CardTitle>
              <StatValue>{Math.round(volume)}</StatValue>
              <p className="text-sm text-muted">{setCount} working sets</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardTitle>Weekly volume</CardTitle>
              <div className="mt-4">
                <TrendChart data={weeks} dataKey="volume" color="#f59e0b" label="Volume" />
              </div>
            </Card>
            <Card>
              <CardTitle>Sets by muscle</CardTitle>
              <div className="mt-4 space-y-2">
                {groups.length === 0 && <p className="text-sm text-muted">Log a workout to see this.</p>}
                {groups.map(([group, count]) => (
                  <div key={group} className="flex justify-between text-sm capitalize">
                    <span>{group}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle>Recent records</CardTitle>
            <div className="mt-4 space-y-2 text-sm">
              {records.slice(0, 6).map((record) => (
                <p key={record.id}>
                  {record.exerciseName}: {record.recordType.replaceAll('_', ' ')} {record.value}
                  {record.isEstimated ? ' (estimated)' : ''}
                </p>
              ))}
              {records.length === 0 && <p className="text-muted">Personal records appear after a working set is saved.</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
