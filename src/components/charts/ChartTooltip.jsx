/** Custom dark tooltip for Recharts. */
export function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl bg-surface border border-border px-3 py-2 shadow-card text-sm">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}{unit}
        </p>
      ))}
    </div>
  );
}
