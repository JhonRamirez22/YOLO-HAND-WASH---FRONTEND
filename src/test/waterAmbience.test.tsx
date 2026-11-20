import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { WaterAmbience } from '@/components/ui/WaterAmbience';

describe('WaterAmbience', () => {
  it('is purely decorative: hidden from assistive technology and never focusable', () => {
    const { container } = render(<WaterAmbience />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('a, button, input, [tabindex]')).toBeNull();
  });
  it('draws a handful of bubbles and ripples, bounded so it stays cheap', () => {
    const { container } = render(<WaterAmbience bubbles={5} />);
    expect(container.querySelectorAll('.hw-bubble')).toHaveLength(5);
    expect(container.querySelectorAll('.hw-ripple-ring').length).toBeGreaterThan(0);
    const many = render(<WaterAmbience bubbles={500} />);
    expect(many.container.querySelectorAll('.hw-bubble').length).toBeLessThanOrEqual(12);
  });
  it('spreads its bubbles deterministically so a re-render does not make them jump', () => {
    const a = render(<WaterAmbience />).container.innerHTML;
    const b = render(<WaterAmbience />).container.innerHTML;
    expect(a).toBe(b);
  });
});
