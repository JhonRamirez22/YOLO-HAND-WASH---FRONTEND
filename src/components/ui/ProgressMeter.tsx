interface ProgressMeterProps {
  /** 0-100; anything outside is clamped. */
  value: number;
  label: string;
  /** Extra class for sizing, e.g. "big". */
  className?: string;
}

/** A progress bar that glides (transform, not width, so it stays smooth) and says when it is full. */
export function ProgressMeter({ value, label, className = '' }: ProgressMeterProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <span className={`kiosk-step-meter ${className}${clamped >= 100 ? ' is-complete' : ''}`.trim()} role="progressbar"
      aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)}>
      <span style={{ transform: `scaleX(${clamped / 100})` }} />
    </span>
  );
}
