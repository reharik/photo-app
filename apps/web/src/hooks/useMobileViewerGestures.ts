import { useCallback, useRef, type PointerEvent } from 'react';
import type { NavigateDirection } from '../features/media/viewer/mediaViewerTypes';

const SWIPE_MIN_PX = 48;
const HORIZONTAL_BIAS = 1.15;
const VERTICAL_BIAS = 1.15;
/** Defer single-tap chrome toggle so double-tap can reach the zoom layer first. */
const SINGLE_TAP_DELAY_MS = 280;
const TAP_STALL_PX = 12;

const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) {
    return false;
  }
  return target.closest('button, a, [role="button"], input, textarea, select') != null;
};

export type UseMobileViewerGesturesOptions = {
  enabled: boolean;
  canNavigate: boolean;
  /** When true, horizontal swipes are ignored (pan/zoom take over). */
  zoomActive: boolean;
  onNavigate: (direction: NavigateDirection) => void;
  onDismiss: () => void;
  onToggleChrome: () => void;
};

export type MobileViewerGestureHandlers = {
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLDivElement>) => void;
};

/**
 * Mobile media stage gestures:
 * - swipe L/R → gallery (when not zoomed)
 * - swipe down → dismiss (when not zoomed)
 * - single tap → toggle chrome (deferred; pinch/double-tap unaffected)
 */
export const useMobileViewerGestures = ({
  enabled,
  canNavigate,
  zoomActive,
  onNavigate,
  onDismiss,
  onToggleChrome,
}: UseMobileViewerGesturesOptions): { gestureHandlers: MobileViewerGestureHandlers } => {
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const activePointersRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSingleTapTimer = useCallback((): void => {
    if (singleTapTimerRef.current != null) {
      clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }
      if (isInteractiveTarget(e.target)) {
        return;
      }
      clearSingleTapTimer();
      if (!e.isPrimary) {
        return;
      }
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return;
      }
      activePointersRef.current += 1;
      if (activePointersRef.current > 1) {
        startRef.current = null;
        return;
      }
      startRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    },
    [clearSingleTapTimer, enabled],
  );

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }
      activePointersRef.current = Math.max(0, activePointersRef.current - 1);

      const start = startRef.current;
      if (start == null || e.pointerId !== start.pointerId) {
        return;
      }
      startRef.current = null;

      if (isInteractiveTarget(e.target)) {
        return;
      }

      if (activePointersRef.current > 0) {
        return;
      }

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const moved = Math.hypot(dx, dy);

      if (!zoomActive && moved >= SWIPE_MIN_PX) {
        if (absX >= absY * HORIZONTAL_BIAS && canNavigate) {
          if (dx < 0) {
            onNavigate('next');
          } else {
            onNavigate('previous');
          }
          return;
        }
        if (absY >= absX * VERTICAL_BIAS && dy > 0) {
          onDismiss();
          return;
        }
      }

      if (moved > TAP_STALL_PX) {
        return;
      }

      clearSingleTapTimer();
      singleTapTimerRef.current = setTimeout(() => {
        singleTapTimerRef.current = null;
        onToggleChrome();
      }, SINGLE_TAP_DELAY_MS);
    },
    [
      canNavigate,
      clearSingleTapTimer,
      enabled,
      onDismiss,
      onNavigate,
      onToggleChrome,
      zoomActive,
    ],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      activePointersRef.current = Math.max(0, activePointersRef.current - 1);
      if (startRef.current != null && e.pointerId === startRef.current.pointerId) {
        startRef.current = null;
      }
      clearSingleTapTimer();
    },
    [clearSingleTapTimer],
  );

  return {
    gestureHandlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
    },
  };
};
