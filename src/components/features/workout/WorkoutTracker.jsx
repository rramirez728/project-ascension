import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Input } from '../../ui/Input.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { todayISO, formatDate } from '../../../utils/dates.js';

/** Workout entry form. */
function WorkoutForm({ initial, onSubmit, onCancel, defaultDate }) {
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [exercise, setExercise] = useState(initial?.exercise ?? '');
  const [sets, setSets] = useState(initial?.sets ?? '');
  const [reps, setReps] = useState(initial?.reps ?? '');
  const [weight, setWeight] = useState(initial?.weight ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!exercise.trim()) return;
    onSubmit({
      date,
      exercise: exercise.trim(),
      sets: parseInt(sets, 10) || 0,
      reps: parseInt(reps, 10) || 0,
      weight: parseFloat(weight) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Input label="Exercise" value={exercise} onChange={(e) => setExercise(e.target.value)} required />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Sets" type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
        <Input label="Reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} />
        <Input label="Weight" type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save' : 'Add'}</Button>
      </div>
    </form>
  );
}

/** Calendar grid showing workout days. */
function WorkoutCalendar({ currentMonth, workoutDates, selectedDate, onSelectDate, onPrevMonth, onNextMonth }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const padding = startDay === 0 ? 6 : startDay - 1;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onPrevMonth}><ChevronLeft size={18} /></Button>
        <h3 className="font-semibold">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button variant="ghost" size="sm" onClick={onNextMonth}><ChevronRight size={18} /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasWorkout = workoutDates.includes(dateStr);
          const isSelected = selectedDate === dateStr;
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-xl text-sm font-medium transition-colors relative ${
                isSelected
                  ? 'bg-accent text-white'
                  : hasWorkout
                    ? 'bg-accent/10 text-accent hover:bg-accent/20'
                    : inMonth
                      ? 'hover:bg-border/30 text-foreground'
                      : 'text-muted/40'
              }`}
            >
              {format(day, 'd')}
              {hasWorkout && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/** Workout log with calendar view. */
export function WorkoutTracker({ entries, loading, onAdd, onUpdate, onDelete, getWorkoutDates }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const workoutDates = getWorkoutDates();
  const dayEntries = entries.filter((e) => e.date === selectedDate);

  const handleSubmit = async (data) => {
    if (editing) await onUpdate(editing.id, data);
    else await onAdd(data);
    setModalOpen(false);
    setEditing(null);
  };

  if (loading) return <div className="h-64 rounded-2xl bg-surface border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <WorkoutCalendar
        currentMonth={currentMonth}
        workoutDates={workoutDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
      />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{formatDate(selectedDate)}</h3>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Exercise
        </Button>
      </div>

      {dayEntries.length === 0 ? (
        <EmptyState
          title="No workouts this day"
          description="Log exercises to track your training progress."
          actionLabel="Add exercise"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-border">
            {dayEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium">{entry.exercise}</p>
                  <p className="text-sm text-muted">
                    {entry.sets} sets × {entry.reps} reps {entry.weight > 0 ? `@ ${entry.weight}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(entry); setModalOpen(true); }}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(entry.id)}>
                    <Trash2 size={16} className="text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Exercise' : 'Add Exercise'}>
        <WorkoutForm initial={editing} defaultDate={selectedDate} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
