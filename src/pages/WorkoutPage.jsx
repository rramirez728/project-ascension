import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { useTraining } from '../hooks/useTraining.js';
import { useSettings } from '../hooks/useSettings.js';
import { todayISO } from '../utils/dates.js';
import { totalVolume } from '../services/calculations/trainingCalculations.js';

function emptySet() {
  return { weight: '', reps: '', isWarmup: false, isFailure: false };
}

export default function WorkoutPage() {
  const { sessions, exercises, plan, logSets, updateSet, deleteSet, skipPlannedWorkout, loading } = useTraining();
  const { settings } = useSettings();
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(new Date());
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState([emptySet(), emptySet(), emptySet()]);
  const [message, setMessage] = useState('');

  const unit = settings?.units === 'kg' ? 'kg' : 'lb';
  const daySessions = sessions.filter((session) => session.date === date);
  const loggedDates = sessions.filter((session) => session.status !== 'skipped').map((session) => session.date);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const planned = plan?.days?.find((day) => day.weekday === weekday);

  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) });
  const padding = monthStart.getDay();

  const exerciseOptions = useMemo(() => {
    const names = new Set(exercises.map((item) => item.name));
    if (exerciseName && !names.has(exerciseName)) names.add(exerciseName);
    return [...names];
  }, [exercises, exerciseName]);

  const save = async () => {
    const parsed = sets
      .filter((set) => set.weight !== '' || set.reps !== '')
      .map((set, index) => ({
        setIndex: index + 1,
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
        isWarmup: set.isWarmup,
        isFailure: set.isFailure,
      }));
    if (!exerciseName.trim() || !parsed.length) {
      setMessage('Add an exercise name and at least one set.');
      return;
    }
    const result = await logSets({
      date,
      exerciseName: exerciseName.trim(),
      unit,
      sets: parsed,
      clientRequestId: crypto.randomUUID(),
    });
    setMessage(result.records?.length
      ? `Saved. ${result.records.length} personal record${result.records.length === 1 ? '' : 's'} updated.`
      : 'Saved to today\'s workout.');
    setSets([emptySet(), emptySet(), emptySet()]);
  };

  return (
    <div>
      <PageHeader title="Log Workout" subtitle="Each set is stored on its own" />
      {loading ? (
        <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => setMonth(subMonths(month, 1))}><ChevronLeft size={18} /></Button>
              <h3 className="font-semibold">{format(month, 'MMMM yyyy')}</h3>
              <Button variant="ghost" size="sm" onClick={() => setMonth(addMonths(month, 1))}><ChevronRight size={18} /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => <div key={label}>{label}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: padding }).map((_, index) => <div key={`pad-${index}`} />)}
              {days.map((day) => {
                const iso = format(day, 'yyyy-MM-dd');
                const selected = iso === date;
                return (
                  <button
                    key={iso}
                    onClick={() => setDate(iso)}
                    className={`aspect-square rounded-xl text-sm ${
                      selected ? 'bg-training text-white' : loggedDates.includes(iso) ? 'bg-training/15 text-training' : isSameMonth(day, month) ? 'hover:bg-border/30' : 'text-muted'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
            {planned && (
              <div className="mt-4 text-sm">
                <p className="font-medium">Planned: {planned.focus}</p>
                <Button
                  className="mt-2"
                  variant="secondary"
                  size="sm"
                  onClick={() => skipPlannedWorkout({ date, plannedWorkoutId: planned.id, notes: 'Skipped' })}
                >
                  Skip this day
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <Select
                label="Exercise"
                options={[{ value: '', label: 'Choose or type below' }, ...exerciseOptions.map((name) => ({ value: name, label: name }))]}
                value={exerciseOptions.includes(exerciseName) ? exerciseName : ''}
                onChange={(e) => setExerciseName(e.target.value)}
              />
              <div className="mt-3">
                <Input label="Or type an exercise" value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} />
              </div>
              <div className="mt-4 space-y-3">
                {sets.map((set, index) => (
                  <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                    <Input id={`set-weight-${index}`} label={`Set ${index + 1} weight (${unit})`} type="number" step="0.5" value={set.weight} onChange={(e) => {
                      const next = [...sets];
                      next[index] = { ...set, weight: e.target.value };
                      setSets(next);
                    }} />
                    <Input id={`set-reps-${index}`} label="Reps" type="number" value={set.reps} onChange={(e) => {
                      const next = [...sets];
                      next[index] = { ...set, reps: e.target.value };
                      setSets(next);
                    }} />
                    <label className="text-xs text-muted flex items-center gap-2 pb-3">
                      <input type="checkbox" checked={set.isWarmup} onChange={(e) => {
                        const next = [...sets];
                        next[index] = { ...set, isWarmup: e.target.checked };
                        setSets(next);
                      }} />
                      Warm-up
                    </label>
                    <label className="text-xs text-muted flex items-center gap-2 pb-3">
                      <input type="checkbox" checked={set.isFailure} onChange={(e) => {
                        const next = [...sets];
                        next[index] = { ...set, isFailure: e.target.checked };
                        setSets(next);
                      }} />
                      Failure
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={() => setSets([...sets, emptySet()])}>Add set</Button>
                <Button onClick={save}>Save sets</Button>
              </div>
              {message && <p className="text-sm text-muted mt-3">{message}</p>}
            </Card>

            {daySessions.map((session) => (
              <Card key={session.id}>
                <p className="text-sm font-medium capitalize">{session.status} · volume {Math.round(totalVolume(session.sets))}</p>
                <div className="mt-3 space-y-2">
                  {(session.sets ?? []).map((set) => (
                    <div key={set.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        {set.exerciseName} · set {set.setIndex} · {set.weight} {set.unit} × {set.reps}
                        {set.isWarmup ? ' · warm-up' : ''}
                      </span>
                      <span className="flex gap-2">
                        <button
                          className="text-xs text-muted"
                          onClick={() => updateSet(set.id, { reps: Number(set.reps) + 1 })}
                        >
                          +1 rep
                        </button>
                        <button aria-label="Delete set" onClick={() => deleteSet(set.id)}>
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </span>
                    </div>
                  ))}
                  {session.status === 'skipped' && <p className="text-sm text-muted">This day was skipped and is not a completed workout.</p>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
