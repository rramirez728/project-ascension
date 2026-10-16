import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button.jsx';
import { formatDate, shiftISO, todayISO } from '../../utils/dates.js';

/** Previous, current, and next day controls. */
export function DateNavigator({ date, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => onChange(shiftISO(date, -1))} aria-label="Previous day">
        <ChevronLeft size={16} />
      </Button>
      <div className="min-w-36 text-center">
        <p className="text-sm font-medium">{date === todayISO() ? 'Today' : formatDate(date, 'EEE, MMM d')}</p>
        <input
          type="date"
          value={date}
          onChange={(event) => onChange(event.target.value)}
          className="bg-transparent text-xs text-muted"
          aria-label="Choose date"
        />
      </div>
      <Button variant="secondary" size="sm" onClick={() => onChange(shiftISO(date, 1))} aria-label="Next day">
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
