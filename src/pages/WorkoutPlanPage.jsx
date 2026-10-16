import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useTraining } from '../hooks/useTraining.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EXAMPLE = [
  { weekday: 0, focus: 'Rest', exercises: [] },
  { weekday: 1, focus: 'Chest & Triceps', exercises: [
    { exerciseName: 'Bench Press', muscleGroup: 'chest', sets: 4, targetReps: '6-10' },
    { exerciseName: 'Tricep Pushdown', muscleGroup: 'triceps', sets: 3, targetReps: '10-12' },
  ] },
  { weekday: 2, focus: 'Back & Biceps', exercises: [
    { exerciseName: 'Lat Pulldown', muscleGroup: 'back', sets: 4, targetReps: '8-12' },
    { exerciseName: 'Bicep Curl', muscleGroup: 'biceps', sets: 3, targetReps: '10-12' },
  ] },
  { weekday: 3, focus: 'Legs', exercises: [
    { exerciseName: 'Squat', muscleGroup: 'legs', sets: 4, targetReps: '5-8' },
    { exerciseName: 'Romanian Deadlift', muscleGroup: 'legs', sets: 3, targetReps: '8-10' },
  ] },
  { weekday: 4, focus: 'Shoulders & Abs', exercises: [
    { exerciseName: 'Overhead Press', muscleGroup: 'shoulders', sets: 4, targetReps: '6-10' },
    { exerciseName: 'Hanging Leg Raise', muscleGroup: 'abs', sets: 3, targetReps: '8-15' },
  ] },
  { weekday: 5, focus: 'Upper Body', exercises: [
    { exerciseName: 'Cable Row', muscleGroup: 'back', sets: 3, targetReps: '8-12' },
    { exerciseName: 'Incline Dumbbell Press', muscleGroup: 'chest', sets: 3, targetReps: '8-12' },
  ] },
  { weekday: 6, focus: 'Rest / Active Recovery', exercises: [] },
];

function blankWeek() {
  return WEEKDAYS.map((_, weekday) => ({ weekday, focus: weekday === 0 || weekday === 6 ? 'Rest' : '', status: 'planned', exercises: [] }));
}

export default function WorkoutPlanPage() {
  const { plan, savePlan, loading } = useTraining();
  const [name, setName] = useState('My Split');
  const [days, setDays] = useState(blankWeek);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!plan) return;
    setName(plan.name);
    const next = blankWeek();
    for (const day of plan.days) next[day.weekday] = { ...next[day.weekday], ...day };
    setDays(next);
  }, [plan]);

  const updateDay = (weekday, updates) => {
    setDays((current) => current.map((day) => (day.weekday === weekday ? { ...day, ...updates } : day)));
  };

  const addExercise = (weekday) => {
    const day = days.find((item) => item.weekday === weekday);
    updateDay(weekday, {
      exercises: [...(day.exercises ?? []), { exerciseName: '', muscleGroup: '', sets: 3, targetReps: '8-12', suggestedWeight: '', restSeconds: 90, notes: '' }],
    });
  };

  return (
    <div>
      <PageHeader title="Weekly Plan" subtitle="Planned workouts stay separate from completed sessions" />
      {loading ? (
        <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
      ) : (
        <div className="space-y-4 max-w-4xl">
          <Card>
            <Input label="Plan name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="secondary" onClick={() => setDays(EXAMPLE)}>Use example split</Button>
              <Button onClick={async () => {
                await savePlan({
                  name,
                  days: days.map((day) => ({
                    ...day,
                    exercises: (day.exercises ?? []).filter((exercise) => exercise.exerciseName.trim()).map((exercise) => ({
                      ...exercise,
                      suggestedWeight: exercise.suggestedWeight === '' ? null : Number(exercise.suggestedWeight),
                    })),
                  })),
                });
                setMessage('Plan saved. Skipping a day will not mark it complete.');
              }}
              >
                Save plan
              </Button>
            </div>
            {message && <p className="text-sm text-muted mt-3">{message}</p>}
          </Card>
          {days.map((day) => (
            <Card key={day.weekday}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <p className="font-medium">{WEEKDAYS[day.weekday]}</p>
                <Input label="Focus" value={day.focus} onChange={(e) => updateDay(day.weekday, { focus: e.target.value })} />
              </div>
              <div className="mt-4 space-y-3">
                {(day.exercises ?? []).map((exercise, index) => (
                  <div key={`${day.weekday}-${index}`} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input label="Exercise" value={exercise.exerciseName} onChange={(e) => {
                      const exercises = [...day.exercises];
                      exercises[index] = { ...exercise, exerciseName: e.target.value };
                      updateDay(day.weekday, { exercises });
                    }} />
                    <Input label="Muscle" value={exercise.muscleGroup ?? ''} onChange={(e) => {
                      const exercises = [...day.exercises];
                      exercises[index] = { ...exercise, muscleGroup: e.target.value };
                      updateDay(day.weekday, { exercises });
                    }} />
                    <Input label="Sets" type="number" value={exercise.sets} onChange={(e) => {
                      const exercises = [...day.exercises];
                      exercises[index] = { ...exercise, sets: e.target.value };
                      updateDay(day.weekday, { exercises });
                    }} />
                    <Input label="Reps" value={exercise.targetReps} onChange={(e) => {
                      const exercises = [...day.exercises];
                      exercises[index] = { ...exercise, targetReps: e.target.value };
                      updateDay(day.weekday, { exercises });
                    }} />
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={() => addExercise(day.weekday)}>Add exercise</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
