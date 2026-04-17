import { useCallback, useRef, type PointerEvent } from 'react';
import type { NavigateDirection } from '../shared/components/media/mediaViewerTypes';

const SWIPE_MIN_PX = 48;
/** Require swipe to be more horizontal than vertical (ratio). */
const HORIZONTAL_BIAS = 1.15;

export type UseMediaSwipeNavigationOptions = {
  enabled: boolean;
  canNavigatePrevious: boolean;
  canNavigateNext: boolean;
  onNavigate: (direction: NavigateDirection) => void;
};

export type MediaSwipeHandlers = {
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void;
};

/**
 * Horizontal swipe on the media region: left → next, right → previous.
 * Uses pointer capture so lifts outside the surface still resolve.
 */
export const useMediaSwipeNavigation = ({
  enabled,
  canNavigatePrevious,
  canNavigateNext,
  onNavigate,
}: UseMediaSwipeNavigationOptions): { swipeHandlers: MediaSwipeHandlers } => {
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const clearStart = useCallback(() => {
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      startRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const start = startRef.current;
      if (!enabled || start == null) {
        return;
      }
      if (e.pointerId !== start.pointerId) {
        return;
      }

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
      startRef.current = null;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < SWIPE_MIN_PX || absX < absY * HORIZONTAL_BIAS) {
        return;
      }

      if (dx < 0 && canNavigateNext) {
        onNavigate('next');
      } else if (dx > 0 && canNavigatePrevious) {
        onNavigate('previous');
      }
    },
    [enabled, canNavigatePrevious, canNavigateNext, onNavigate],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (startRef.current != null && e.pointerId === startRef.current.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
        clearStart();
      }
    },
    [clearStart],
  );

  return {
    swipeHandlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    },
  };
};
