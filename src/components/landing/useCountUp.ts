import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animate a number towards `target` with a cubic ease-out, exactly like the
 * reference planner's reach tween (~520ms). Snaps instantly when the user
 * prefers reduced motion.
 */
export function useCountUp(target: number, duration = 520): number {
  const [shown, setShown] = useState(target);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(target);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(target);
      return;
    }
    const start = fromRef.current;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      const value = Math.round(start + (target - start) * e);
      setShown(value);
      fromRef.current = value;
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return shown;
}

/** Dutch number / euro formatting, matching the demo. */
export const fmt = (n: number): string => n.toLocaleString('nl-NL');
export const euro = (n: number): string => '€' + n.toLocaleString('nl-NL');
