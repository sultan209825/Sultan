import { useEffect, useRef } from 'react';

/**
 * useAdaptiveGlass hook:
 * Dynamically computes ambient specular reflection angle based on mouse/touch coordinates,
 * and adjusts frosted glass depth, saturation, and specular opacity based on scroll depth.
 */
export function useAdaptiveGlass<T extends HTMLElement = HTMLDivElement>() {
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      el.style.setProperty('--mouse-x', `${x.toFixed(1)}%`);
      el.style.setProperty('--mouse-y', `${y.toFixed(1)}%`);
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      // As user scrolls down, increase frosted glass density slightly
      const blurVal = Math.min(36, 18 + scrollY * 0.04);
      const opacityVal = Math.min(0.92, 0.72 + scrollY * 0.0008);
      const borderOpacity = Math.min(0.24, 0.10 + scrollY * 0.0003);

      el.style.setProperty('--glass-blur', `${blurVal.toFixed(1)}px`);
      el.style.setProperty('--glass-opacity', `${opacityVal.toFixed(2)}`);
      el.style.setProperty('--glass-border-opacity', `${borderOpacity.toFixed(2)}`);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial run

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return elementRef;
}
