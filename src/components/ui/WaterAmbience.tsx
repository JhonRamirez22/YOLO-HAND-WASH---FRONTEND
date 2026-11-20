const MAX_BUBBLES = 12;

/** Cheap pseudo-random in [0,1) from an index, so the layout is the same on every render. */
const spread = (index: number, salt: number) => ((Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1;

interface WaterAmbienceProps { bubbles?: number }

/**
 * Slow ripples and a few rising bubbles for the moments with no live video (waiting for the camera, idle screens).
 * Pure CSS animation on transform and opacity, never focusable and hidden from screen readers. It is only mounted where the
 * video is absent, so it can never compete with the picture for the browser's attention.
 */
export function WaterAmbience({ bubbles = 8 }: WaterAmbienceProps) {
  const count = Math.max(0, Math.min(MAX_BUBBLES, Math.round(bubbles)));
  return (
    <div className="hw-water" aria-hidden="true">
      {[0, 1, 2].map((ring) => <span key={ring} className="hw-ripple-ring" style={{ animationDelay: `${ring * 1.6}s` }} />)}
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="hw-bubble" style={{
          left: `${6 + spread(i, 1) * 88}%`,
          width: `${5 + spread(i, 2) * 9}px`,
          height: `${5 + spread(i, 2) * 9}px`,
          animationDuration: `${7 + spread(i, 3) * 6}s`,
          animationDelay: `${-spread(i, 4) * 9}s`,
        }} />
      ))}
    </div>
  );
}
