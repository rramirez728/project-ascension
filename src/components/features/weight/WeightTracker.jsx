import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Input } from '../../ui/Input.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { TrendChart } from '../../charts/TrendChart.jsx';
import { formatDate, todayISO, getWeekRange, getMonthRange } from '../../../utils/dates.js';
import { calculateAverage, filterByDateRange } from '../../../services/calculations/weightCalculations.js';

/** Weight entry form inside modal. */
function WeightForm({ initial, onSubmit, onCancel }) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [weight, setWeight] = useState(initial?.weight ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!date || Number.isNaN(w) || w <= 0) {
      setError('Enter a valid date and weight.');
      return;
    }
    onSubmit({ date, weight: w, note: note.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Input label="Weight" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required />
      <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Save' : 'Add'}</Button>
      </div>
    </form>
  );
}

/** Weight tracking feature: list, chart, averages. */
export function WeightTracker({ entries, loading, onAdd, onUpdate, onDelete, unit }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const chartData = entries.map((e) => ({
    date: formatDate(e.date, 'MMM d'),
    value: e.weight,
  }));

  const weekRange = getWeekRange(todayISO());
  const monthRange = getMonthRange(todayISO());
  const weeklyAvg = calculateAverage(filterByDateRange(entries, weekRange.start, weekRange.end));
  const monthlyAvg = calculateAverage(filterByDateRange(entries, monthRange.start, monthRange.end));

  const handleSubmit = async (data) => {
    if (editing) {
      await onUpdate(editing.id, data);
    } else {
      await onAdd(data);
    }
    setModalOpen(false);
    setEditing(null);
  };

  if (loading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface border border-border animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={16} /> Add Weight
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No weight entries yet"
          description="Start tracking your weight to see trends and averages."
          actionLabel="Add first entry"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-sm text-muted">Weekly Average</p>
              <p className="text-2xl font-semibold mt-1">{weeklyAvg ? `${weeklyAvg.toFixed(1)} ${unit}` : '—'}</p>
            </Card>
            <Card>
              <p className="text-sm text-muted">Monthly Average</p>
              <p className="text-2xl font-semibold mt-1">{monthlyAvg ? `${monthlyAvg.toFixed(1)} ${unit}` : '—'}</p>
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">Weight Trend</h3>
            <TrendChart data={chartData} unit={` ${unit}`} label="Weight" />
          </Card>

          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {[...entries].reverse().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium">{entry.weight} {unit}</p>
                    <p className="text-sm text-muted">{formatDate(entry.date)}</p>
                    {entry.note && <p className="text-xs text-muted mt-0.5">{entry.note}</p>}
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

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Weight' : 'Add Weight'}>
        <WeightForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setModalOpen(false); setEditing(null); }} />
      </Modal>
    </div>
  );
}
