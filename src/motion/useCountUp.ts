import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from './tokens';

interface CountUpOptions { from?: number; durationMs?: number }

/** A number that glides to its target (ease-out) instead of jumping; with reduced motion it simply is the target. */
export function useCountUp(target: number, { from = 0, durationMs = 700 }: CountUpOptions = {}): number {
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState(reduced ? target : from);
  const current = useRef(shown);
  current.current = shown;

  useEffect(() => {
    if (reduced) { setShown(target); return undefined; }
    const start = current.current;
    if (start === target) return undefined;
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setShown(progress >= 1 ? target : Math.round(start + (target - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return shown;
}
