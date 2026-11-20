import { memo, type ReactNode } from 'react';
import { Hand } from './Hand';

export const FRICTION_STEP_COUNT = 6;

interface StepIllustrationProps {
  /** 1-6, the friction movements the camera recognises. */
  step: number;
  /** Plays the movement; a still frame otherwise (and always for reduced motion, through the CSS). */
  animate?: boolean;
  className?: string;
}

const TITLES = [
  'Palma contra palma, frotando',
  'Palma derecha sobre el dorso izquierdo, y al revés',
  'Palmas con los dedos entrelazados',
  'Dorso de los dedos contra la palma opuesta',
  'Pulgar atrapado y girando',
  'Puntas de los dedos frotando la palma opuesta',
] as const;

/** A thin arrow that shows which way the movement goes; the one place the data blue appears. */
function Motion({ d, className = '' }: { d: string; className?: string }) {
  return <path className={`hw-motion ${className}`.trim()} d={d} markerEnd="url(#hw-arrow)" />;
}

const SCALE = 0.6;
/** Puts the centre of a hand (about 25 units below the wrist's top) at (x, y), turned and optionally mirrored. */
const at = (x: number, y: number, degrees = 0, mirror = false) =>
  `translate(${x} ${y}) rotate(${degrees}) scale(${mirror ? -SCALE : SCALE} ${SCALE}) translate(0 -25)`;

const SCENES: ReadonlyArray<() => ReactNode> = [
  // 1. Palm to palm: the hands meet in the middle and slide past each other.
  () => (
    <>
      <g className="hw-slide-up"><Hand transform={at(72, 66, 3)} /></g>
      <g className="hw-slide-down"><Hand mirror transform={at(88, 66, -3)} /></g>
      <Motion d="M26 40 v-16" /><Motion d="M134 24 v16" />
    </>
  ),
  // 2. One palm over the back of the other hand.
  () => (
    <>
      <Hand face="back" transform={at(74, 82, 90)} />
      <g className="hw-glide"><Hand mirror transform={at(86, 62, 90)} /></g>
      <Motion d="M38 20 h84" />
    </>
  ),
  // 3. Fingers interlaced: the hands lean into each other and rub.
  () => (
    <>
      <g className="hw-rub"><Hand transform={at(69, 72, 26)} /></g>
      <g className="hw-rub hw-rub--other"><Hand mirror transform={at(91, 72, -26)} /></g>
      <path className="hw-weave" d="M72 40 l8 -5 M78 33 l8 -4 M88 40 l-8 -5 M82 33 l-8 -4" />
      <Motion d="M44 16 h72" />
    </>
  ),
  // 4. Backs of the fingers hooked into the opposite palm.
  () => (
    <>
      <Hand transform={at(60, 78, 4)} />
      <g className="hw-hook"><Hand face="back" mirror transform={at(66, 50, 182)} /></g>
      <Motion d="M96 92 q22 -10 22 -36" />
    </>
  ),
  // 5. The thumb held in the other fist and rotated.
  () => (
    <>
      <Hand mirror transform={at(94, 70, -6)} />
      <g className="hw-spin"><Hand transform={at(68, 70, 14)} /></g>
      <circle className="hw-orbit" cx="62" cy="30" r="14" />
      <Motion d="M50 26 a14 14 0 1 1 5 22" />
    </>
  ),
  // 6. Fingertips pressed into the opposite palm and moved in small circles.
  () => (
    <>
      <Hand transform={at(60, 78, 4)} />
      <g className="hw-tip-circle"><Hand face="back" mirror transform={at(66, 50, 178)} /></g>
      <Motion d="M100 56 a12 12 0 1 1 -2 -2" />
    </>
  ),
];

/** One drawing per movement, each showing exactly its gesture. Decorative: the step name sits next to it. */
export const StepIllustration = memo(function StepIllustration({ step, animate = true, className = '' }: StepIllustrationProps) {
  const index = Math.max(1, Math.min(FRICTION_STEP_COUNT, Math.round(step))) - 1;
  return (
    <svg className={`hw-illu${animate ? ' is-playing' : ''} ${className}`.trim()} viewBox="0 0 160 120" role="img" aria-label={TITLES[index]}>
      <defs>
        <marker id="hw-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      <rect className="hw-illu-ground" x="1" y="1" width="158" height="118" rx="10" />
      <g key={index} className="hw-illu-scene">{SCENES[index]?.()}</g>
    </svg>
  );
});
