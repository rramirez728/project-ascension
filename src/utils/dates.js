import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

/** Format ISO date string for display. */
export function formatDate(dateStr, pattern = 'MMM d, yyyy') {
  return format(parseISO(dateStr), pattern);
}

/** Today's date as YYYY-MM-DD. */
export function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Get week boundaries for a given date string. */
export function getWeekRange(dateStr) {
  const date = parseISO(dateStr);
  return {
    start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  };
}

/** Get month boundaries for a given date string. */
export function getMonthRange(dateStr) {
  const date = parseISO(dateStr);
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
}

/** Last N days as ISO date strings (newest first). */
export function lastNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return days;
}

/** Short weekday label from ISO date. */
export function formatWeekday(dateStr) {
  return format(parseISO(dateStr), 'EEE');
}
