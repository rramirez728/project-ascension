import { PageHeader } from '../components/layout/PageHeader.jsx';
import { WeightTracker } from '../components/features/weight/WeightTracker.jsx';
import { useWeight } from '../hooks/useWeight.js';
import { useSettings } from '../hooks/useSettings.js';

export default function WeightPage() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useWeight();
  const { settings } = useSettings();

  return (
    <div>
      <PageHeader title="Weight Tracking" subtitle="Log weight and view trends" />
      <WeightTracker
        entries={entries}
        loading={loading}
        onAdd={addEntry}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
        unit={settings?.units ?? 'lb'}
      />
    </div>
  );
}
