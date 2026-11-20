import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { useCountUp } from '@/motion/useCountUp';
import { ProgressMeter } from '@/components/ui/ProgressMeter';

describe('useCountUp', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] }); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('counts from the start to the target and ends exactly on it', () => {
    const { result } = renderHook(() => useCountUp(90, { from: 0, durationMs: 600 }));
    expect(result.current).toBe(0);
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBeGreaterThan(0);
    expect(result.current).toBeLessThan(90);
    act(() => { vi.advanceTimersByTime(600); });
    expect(result.current).toBe(90);
  });
  it('follows a new target from where it is, not from zero', () => {
    const { result, rerender } = renderHook(({ v }) => useCountUp(v, { from: 0, durationMs: 400 }), { initialProps: { v: 40 } });
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe(40);
    rerender({ v: 80 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBeGreaterThan(40);
    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toBe(80);
  });
  it('jumps straight to the target when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => undefined, removeEventListener: () => undefined }));
    const { result } = renderHook(() => useCountUp(75, { from: 0, durationMs: 600 }));
    expect(result.current).toBe(75);
  });
});

describe('ProgressMeter', () => {
  it('is an accessible progress bar that clamps its value', () => {
    const { rerender } = render(<ProgressMeter value={50} label="Palmas" />);
    const bar = screen.getByRole('progressbar', { name: 'Palmas' });
    expect(bar.getAttribute('aria-valuenow')).toBe('50');
    expect((bar.firstElementChild as HTMLElement).style.transform).toBe('scaleX(0.5)');
    rerender(<ProgressMeter value={140} label="Palmas" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    rerender(<ProgressMeter value={-5} label="Palmas" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
  it('marks a finished bar so it can celebrate', () => {
    render(<ProgressMeter value={100} label="Listo" />);
    expect(screen.getByRole('progressbar').className).toContain('is-complete');
  });
});
