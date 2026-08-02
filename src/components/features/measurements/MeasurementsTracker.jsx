import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Input } from '../../ui/Input.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { MultiLineChart } from '../../charts/MultiLineChart.jsx';
import { formatDate, todayISO } from '../../../utils/dates.js';

const MEASUREMENT_FIELDS = [
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest' },
  { key: 'neck', label: 'Neck' },
  { key: 'hips', label: 'Hips' },
  { key: 'leftArm', label: 'Left Arm' },
  { key: 'rightArm', label: 'Right Arm' },
  { key: 'leftThigh', label: 'Left Thigh' },
  { key: 'rightThigh', label: 'Right Thigh' },
  { key: 'bodyFat', label: 'Body Fat %' },
];

/** Measurement entry form. */
function MeasurementForm({ initial, onSubmit, onCancel }) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [fields, setFields] = useState(() =>
    MEASUREMENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: initial?.[f.key] ?? '' }), {})
  );

  const handleChange = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { date };
    MEASUREMENT_FIELDS.forEach(({ key }) => {
      const val = fields[key];
      data[key] = val === '' ? null : parseFloat(val);
    });
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <div className="grid grid-cols-2 gap-3">
        {MEASUREMENT_FIELDS.map(({ key, label }) => (
          <Input
            key={key}
            label={label}
            type="number"
            step="0.1"
            value={fields[key]}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        ))}
      </div>
      <div className="flex gap-3 justify-end sticky bottom-0 bg-surface pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save' : 'Add'}</Button>
      </div>
    </form>
  );
}

/** Body measurements tracker with multi-line chart. */
export function MeasurementsTracker({ entries, loading, onAdd, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeMetrics, setActiveMetrics] = useState(['waist', 'chest', 'bodyFat']);

  const chartData = entries.map((e) => ({
    date: formatDate(e.date, 'MMM d'),
    ...MEASUREMENT_FIELDS.reduce((acc, { key }) => ({ ...acc, [key]: e[key] }), {}),
  }));

  const lines = MEASUREMENT_FIELDS.filter((f) => activeMetrics.includes(f.key));

  const toggleMetric = (key) => {
    setActiveMetrics((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (data) => {
    if (editing) await onUpdate(editing.id, data);
    else await onAdd(data);
    setModalOpen(false);
    setEditing(null);
  };

  if (loading) return <div className="h-48 rounded-2xl bg-surface border border-border animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Measurements
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No measurements yet"
          description="Track body measurements to visualize your progress over time."
          actionLabel="Add measurements"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap gap-2 mb-4">
              {MEASUREMENT_FIELDS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleMetric(key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeMetrics.includes(key)
                      ? 'bg-accent/10 text-accent'
                      : 'bg-border/30 text-muted hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <MultiLineChart data={chartData} lines={lines} unit="" />
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {[...entries].reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium">{formatDate(entry.date)}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {MEASUREMENT_FIELDS.filter((f) => entry[f.key] != null).map(({ key, label }) => (
                        <span key={key} className="text-xs text-muted">{label}: {entry[key]}</span>
                      ))}
                    </div>
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
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Measurements' : 'Add Measurements'} size="lg">
        <MeasurementForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
