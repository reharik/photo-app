import { useCallback, useSyncExternalStore } from 'react';

const computeBottomInset = (): number => {
  const visualViewport = window.visualViewport;
  if (visualViewport == null) {
    return 0;
  }

  const inset = window.innerHeight - (visualViewport.height + visualViewport.offsetTop);
  return Math.max(0, inset);
};

/**
 * Returns the bottom inset (px) caused by the on-screen keyboard — the gap
 * between the layout viewport bottom and the visual viewport bottom.
 * Returns 0 when `window.visualViewport` is unavailable (desktop / unsupported).
 */
export const useVisualViewportBottomInset = (): number => {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const visualViewport = window.visualViewport;
    if (visualViewport == null) {
      return () => {};
    }

    let rafId: number | undefined;

    const scheduleUpdate = (): void => {
      if (rafId != null) {
        return;
      }
      rafId = requestAnimationFrame(() => {
        rafId = undefined;
        onStoreChange();
      });
    };

    visualViewport.addEventListener('resize', scheduleUpdate);
    visualViewport.addEventListener('scroll', scheduleUpdate);

    return () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
      }
      visualViewport.removeEventListener('resize', scheduleUpdate);
      visualViewport.removeEventListener('scroll', scheduleUpdate);
    };
  }, []);

  const getSnapshot = (): number => computeBottomInset();
  const getServerSnapshot = (): number => 0;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
