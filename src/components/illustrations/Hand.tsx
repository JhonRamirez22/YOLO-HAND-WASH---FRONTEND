import type { ReactNode } from 'react';

interface HandProps {
  /** Which side of the hand faces the viewer. */
  face?: 'palm' | 'back';
  /** Mirror it to make the other hand. */
  mirror?: boolean;
  /** Extra transform (position, rotation) applied around the wrist. */
  transform?: string;
  className?: string;
  children?: ReactNode;
}

/** Fingers: x of the finger axis, length. The thumb is drawn apart because it hangs off the side. */
const FINGERS: ReadonlyArray<readonly [number, number]> = [[-15, 31], [-5, 37], [5, 35], [15, 28]];

/**
 * One flat vector hand, fingers up, wrist at the origin's bottom. Drawn once and reused by every step so that the six
 * illustrations share a single identity: same line, same proportions, only the pose and the movement change.
 */
export function Hand({ face = 'palm', mirror = false, transform = '', className = '', children }: HandProps) {
  const t = `${transform} ${mirror ? 'scale(-1 1)' : ''}`.trim();
  return (
    <g className={`hw-hand hw-hand--${face} ${className}`.trim()} transform={t || undefined}>
      <rect className="hw-hand-skin" x="-13" y="44" width="26" height="36" rx="9" />
      {FINGERS.map(([x, length]) => (
        <rect key={x} className="hw-hand-skin" x={x - 4.6} y={8 - length} width="9.2" height={length + 14} rx="4.6" />
      ))}
      <rect className="hw-hand-skin" x="-22" y="4" width="44" height="46" rx="15" />
      <rect className="hw-hand-skin" x="-30" y="22" width="9.6" height="30" rx="4.8" transform="rotate(-36 -25 40)" />
      {face === 'back' ? (
        <g className="hw-hand-detail">
          {FINGERS.map(([x, length]) => <path key={x} d={`M${x - 3} ${8 - length + 6} q3 -3.4 6 0`} />)}
          <path d="M-12 18 v14 M-4 16 v16 M4 16 v16 M12 18 v14" />
        </g>
      ) : (
        <g className="hw-hand-detail"><path d="M-14 26 q14 9 26 0" /><path d="M-8 38 q8 5 16 0" /></g>
      )}
      {children}
    </g>
  );
}
