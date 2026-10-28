/** Horizontal bar for a 0..1 value; fills from the start side (right in RTL). */
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(value * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-3 w-full overflow-hidden rounded-full bg-text/10"
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
    </div>
  );
}
