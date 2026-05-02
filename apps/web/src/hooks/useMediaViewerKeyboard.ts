import { useEffect, useRef, type MutableRefObject } from 'react';
import type { NavigateDirection } from '../features/media/viewer/mediaViewerTypes';

export type UseMediaViewerKeyboardOptions = {
  /** When false, no listeners are registered. */
  enabled?: boolean;
  onEscape?: () => void;
  onNavigate?: (direction: NavigateDirection) => void;
  /**
   * If set, Escape runs this first. Return true if handled (e.g. reset zoom) so {@link onEscape} is skipped.
   */
  escapeConsumedRef?: MutableRefObject<(() => boolean) | null>;
};

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (target == null || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
};

/**
 * Window-level shortcuts for media viewer: Escape, ArrowLeft (previous), ArrowRight (next).
 * Arrow keys are ignored while focus is in a form field so cursor movement still works.
 */
export const useMediaViewerKeyboard = ({
  enabled = true,
  onEscape,
  onNavigate,
  escapeConsumedRef,
}: UseMediaViewerKeyboardOptions): void => {
  const onEscapeRef = useRef(onEscape);
  const onNavigateRef = useRef(onNavigate);

  onEscapeRef.current = onEscape;
  onNavigateRef.current = onNavigate;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        const consumed = escapeConsumedRef?.current?.() ?? false;
        if (consumed) {
          e.preventDefault();
          return;
        }
        onEscapeRef.current?.();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (isTypingTarget(e.target)) {
          return;
        }
        e.preventDefault();
        const direction: NavigateDirection = e.key === 'ArrowLeft' ? 'previous' : 'next';
        onNavigateRef.current?.(direction);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, escapeConsumedRef]);
};
