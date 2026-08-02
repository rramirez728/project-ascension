import { PageHeader } from '../components/layout/PageHeader.jsx';
import { WorkoutTracker } from '../components/features/workout/WorkoutTracker.jsx';
import { useWorkouts } from '../hooks/useWorkouts.js';

export default function WorkoutPage() {
  const { entries, loading, addEntry, updateEntry, deleteEntry, getWorkoutDates } = useWorkouts();

  return (
    <div>
      <PageHeader title="Workout Log" subtitle="Track exercises and training days" />
      <WorkoutTracker
        entries={entries}
        loading={loading}
        onAdd={addEntry}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
        getWorkoutDates={getWorkoutDates}
      />
    </div>
  );
}
