import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MOTION, prefersReducedMotion } from '@/motion/tokens';
import { installRipple, RIPPLE_SELECTOR } from '@/motion/ripple';

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }));
}

describe('motion tokens', () => {
  it('keeps durations ordered and curves valid so components can rely on them', () => {
    const d = MOTION.duration;
    expect(d.instant).toBeLessThan(d.fast);
    expect(d.fast).toBeLessThan(d.base);
    expect(d.base).toBeLessThan(d.slow);
    expect(d.slow).toBeLessThan(d.slower);
    for (const curve of Object.values(MOTION.ease)) expect(curve).toHaveLength(4);
    expect(MOTION.stagger).toBeGreaterThan(0);
  });
  it('reads the reduced-motion preference', () => {
    mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('ripple', () => {
  let remove: () => void;
  beforeEach(() => {
    mockMatchMedia(false);
    document.body.innerHTML = '<button class="button-primary" id="b">Iniciar</button><button class="button-primary" id="d" disabled>No</button><div id="x">no</div>';
    remove = installRipple();
  });
  afterEach(() => { remove(); vi.unstubAllGlobals(); });

  const press = (el: Element, x = 10, y = 6) => {
    const event = new MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y });
    el.dispatchEvent(event);
  };

  it('marks the pressed button with the point of the press', () => {
    const button = document.getElementById('b')!;
    press(button);
    expect(button.classList.contains('is-rippling')).toBe(true);
    expect(button.style.getPropertyValue('--rx')).toMatch(/px$/);
    expect(button.style.getPropertyValue('--ry')).toMatch(/px$/);
    button.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(button.classList.contains('is-rippling')).toBe(false);
  });
  it('ignores disabled buttons and anything that is not a button', () => {
    press(document.getElementById('d')!);
    press(document.getElementById('x')!);
    expect(document.querySelector('.is-rippling')).toBeNull();
  });
  it('does nothing when the person asked for reduced motion', () => {
    mockMatchMedia(true);
    const button = document.getElementById('b')!;
    press(button);
    expect(button.classList.contains('is-rippling')).toBe(false);
  });
  it('stops listening once removed and exposes the selector it handles', () => {
    remove();
    const button = document.getElementById('b')!;
    press(button);
    expect(button.classList.contains('is-rippling')).toBe(false);
    expect(RIPPLE_SELECTOR).toContain('.button-primary');
  });
});
