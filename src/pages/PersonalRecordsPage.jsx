import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardTitle } from '../components/ui/Card.jsx';
import { useTraining } from '../hooks/useTraining.js';

const LABELS = {
  max_weight: 'Heaviest weight',
  reps_at_weight: 'Most reps at a weight',
  session_volume: 'Best session volume',
  estimated_1rm: 'Estimated one-rep max',
};

export default function PersonalRecordsPage() {
  const { records, loading } = useTraining();
  const groups = new Map();
  for (const record of records) {
    const list = groups.get(record.exerciseName) ?? [];
    list.push(record);
    groups.set(record.exerciseName, list);
  }

  return (
    <div>
      <PageHeader title="Personal Records" subtitle="Estimated maxes are labeled separately from completed lifts" />
      {loading ? (
        <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([exercise, items]) => (
            <Card key={exercise}>
              <CardTitle>{exercise}</CardTitle>
              <div className="mt-4 space-y-2 text-sm">
                {items.map((record) => (
                  <p key={record.id}>
                    {LABELS[record.recordType] || record.recordType}: {record.value}
                    {record.weight != null && record.recordType === 'reps_at_weight' ? ` reps at ${record.weight} ${record.unit}` : ''}
                    {record.isEstimated ? ' · estimated' : ' · completed lift'}
                    {' · '}{record.achievedOn}
                  </p>
                ))}
              </div>
            </Card>
          ))}
          {groups.size === 0 && <p className="text-sm text-muted">Records are created when a saved set beats your previous best.</p>}
        </div>
      )}
    </div>
  );
}
