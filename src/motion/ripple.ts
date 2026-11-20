import { prefersReducedMotion } from './tokens';

/** The buttons that answer a press with a ripple. */
export const RIPPLE_SELECTOR = '.button-primary, .button-quiet, .button-danger, .operator-button, .duration-options button';

/** One delegated listener for the whole app: marks where the press happened so CSS can draw the wave. */
export function installRipple(root: Document = document): () => void {
  const onPress = (event: Event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>(RIPPLE_SELECTOR) : null;
    if (!target || (target as HTMLButtonElement).disabled || prefersReducedMotion()) return;
    const box = target.getBoundingClientRect();
    const pointer = event as MouseEvent;
    target.style.setProperty('--rx', `${Math.round(pointer.clientX - box.left)}px`);
    target.style.setProperty('--ry', `${Math.round(pointer.clientY - box.top)}px`);
    target.classList.remove('is-rippling');
    void target.offsetWidth; // restart the animation on a quick second press
    target.classList.add('is-rippling');
  };
  const onEnd = (event: Event) => {
    if (event.target instanceof HTMLElement && event.target.classList.contains('is-rippling')) event.target.classList.remove('is-rippling');
  };
  root.addEventListener('pointerdown', onPress);
  root.addEventListener('animationend', onEnd, true);
  return () => {
    root.removeEventListener('pointerdown', onPress);
    root.removeEventListener('animationend', onEnd, true);
  };
}
