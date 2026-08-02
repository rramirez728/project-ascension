import { PageHeader } from '../components/layout/PageHeader.jsx';
import { HabitsTracker } from '../components/features/habits/HabitsTracker.jsx';
import { useHabits } from '../hooks/useHabits.js';

export default function HabitsPage() {
  const { entries, todayHabit, loading, updateToday } = useHabits();

  return (
    <div>
      <PageHeader title="Daily Habits" subtitle="Water, sleep, steps, and more" />
      <HabitsTracker
        entries={entries}
        todayHabit={todayHabit}
        loading={loading}
        onUpdate={updateToday}
      />
    </div>
  );
}
