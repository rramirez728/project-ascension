import { PageHeader } from '../components/layout/PageHeader.jsx';
import { MeasurementsTracker } from '../components/features/measurements/MeasurementsTracker.jsx';
import { useMeasurements } from '../hooks/useMeasurements.js';

export default function MeasurementsPage() {
  const { entries, loading, addEntry, updateEntry, deleteEntry } = useMeasurements();

  return (
    <div>
      <PageHeader title="Body Measurements" subtitle="Track measurements over time" />
      <MeasurementsTracker
        entries={entries}
        loading={loading}
        onAdd={addEntry}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
      />
    </div>
  );
}
