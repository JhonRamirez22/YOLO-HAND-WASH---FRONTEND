/** One vocabulary for movement. The same values are exposed to CSS as --hw-dur-*, --hw-ease-* and --hw-spring. */
export const MOTION = {
  duration: { instant: 0.08, fast: 0.14, base: 0.22, slow: 0.36, slower: 0.56 },
  ease: {
    standard: [0.2, 0.7, 0.2, 1],
    out: [0.16, 1, 0.3, 1],
    inOut: [0.65, 0, 0.35, 1],
  },
  /** Seconds between neighbours of a staggered entrance. */
  stagger: 0.045,
  /** How far things travel when they enter, in pixels. */
  distance: { small: 6, medium: 12, large: 24 },
  scale: { press: 0.98, lift: 1.02 },
  spring: { soft: { type: 'spring', stiffness: 220, damping: 26, mass: 0.9 }, snappy: { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 } },
} as const;

export function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
