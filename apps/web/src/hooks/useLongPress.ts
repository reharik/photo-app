import { useCallback, useRef } from 'react';

const DEFAULT_HOLD_MS = 400;
const DEFAULT_MOVE_TOLERANCE_PX = 10;

type UseLongPressOptions = {
  onLongPress: () => void;
  enabled?: boolean;
  holdMs?: number;
  moveTolerancePx?: number;
};

type LongPressHandlers = {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
  /** Call from click capture to swallow the click that follows a completed long-press. */
  consumeSuppressedClick: () => boolean;
};

export const useLongPress = ({
  onLongPress,
  enabled = true,
  holdMs = DEFAULT_HOLD_MS,
  moveTolerancePx = DEFAULT_MOVE_TOLERANCE_PX,
}: UseLongPressOptions): LongPressHandlers => {
  const timerRef = useRef<number | undefined>(undefined);
  const originRef = useRef<{ x: number; y: number } | undefined>(undefined);
  const suppressNextClickRef = useRef(false);

  const clearTimer = useCallback((): void => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent): void => {
      if (!enabled || event.button !== 0) {
        return;
      }
      originRef.current = { x: event.clientX, y: event.clientY };
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined;
        originRef.current = undefined;
        suppressNextClickRef.current = true;
        onLongPress();
      }, holdMs);
    },
    [clearTimer, enabled, holdMs, onLongPress],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent): void => {
      const origin = originRef.current;
      if (origin == null) {
        return;
      }
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.hypot(dx, dy) > moveTolerancePx) {
        clearTimer();
        originRef.current = undefined;
      }
    },
    [clearTimer, moveTolerancePx],
  );

  const onPointerUp = useCallback((): void => {
    clearTimer();
    originRef.current = undefined;
  }, [clearTimer]);

  const consumeSuppressedClick = useCallback((): boolean => {
    if (!suppressNextClickRef.current) {
      return false;
    }
    suppressNextClickRef.current = false;
    return true;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    consumeSuppressedClick,
  };
};
