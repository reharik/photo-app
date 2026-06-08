import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import type { NavigateDirection } from './mediaViewerTypes';

const SLIDE_OFFSET = '16%';
const EXIT_MS = 180;
const ENTER_MS = 260;
const EXIT_FALLBACK_MS = EXIT_MS + 80;
/** Max wait for incoming image decode before playing enter animation anyway. */
export const ENTER_IMAGE_DECODE_TIMEOUT_MS = 450;

const slideInFromRight = keyframes`
  from {
    transform: translateX(${SLIDE_OFFSET});
    opacity: 0.5;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideInFromLeft = keyframes`
  from {
    transform: translateX(calc(-1 * ${SLIDE_OFFSET}));
    opacity: 0.5;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

type SlideTransitionWrapProps = {
  children: ReactNode;
  isExiting: boolean;
  exitDirection: NavigateDirection;
  isAwaitingEnterContent: boolean;
  enterDirection: NavigateDirection | undefined;
  onTransitionEnd: (e: TransitionEvent<HTMLDivElement>) => void;
  onAnimationEnd: () => void;
};

/** Stable component — must not be recreated per render or exit transitions never complete. */
export const SlideTransitionWrap = ({
  children,
  isExiting,
  exitDirection,
  isAwaitingEnterContent,
  enterDirection,
  onTransitionEnd,
  onAnimationEnd,
}: SlideTransitionWrapProps) => (
  <SlideClip>
    <SlideTrack
      $isExiting={isExiting}
      $exitDirection={exitDirection}
      $concealEnter={isAwaitingEnterContent}
      $enterDirection={enterDirection}
      onTransitionEnd={onTransitionEnd}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </SlideTrack>
  </SlideClip>
);

export type SlideTransitionState = {
  isExiting: boolean;
  exitDirection: NavigateDirection;
  isAwaitingEnterContent: boolean;
  enterDirection: NavigateDirection | undefined;
  onTransitionEnd: (e: TransitionEvent<HTMLDivElement>) => void;
  onAnimationEnd: () => void;
};

type UseMediaViewerSlideTransitionOptions = {
  contentKey: string;
  canNavigate: boolean;
  onNavigate: (direction: NavigateDirection) => void;
  enterContentReady?: boolean;
};

type UseMediaViewerSlideTransitionResult = {
  requestNavigate: (direction: NavigateDirection) => void;
  slideTransition: SlideTransitionState;
};

export const useMediaViewerSlideTransition = ({
  contentKey,
  canNavigate,
  onNavigate,
  enterContentReady = true,
}: UseMediaViewerSlideTransitionOptions): UseMediaViewerSlideTransitionResult => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<NavigateDirection>('next');
  const [enterDirection, setEnterDirection] = useState<NavigateDirection | undefined>();
  const [pendingEnterDirection, setPendingEnterDirection] = useState<
    NavigateDirection | undefined
  >();
  const awaitingEnterRef = useRef(false);
  const lastDirectionRef = useRef<NavigateDirection>('next');
  const prevContentKeyRef = useRef(contentKey);
  const isExitingRef = useRef(isExiting);

  const isTransitioning = isExiting || pendingEnterDirection != null || enterDirection != null;

  useLayoutEffect(() => {
    isExitingRef.current = isExiting;
  }, [isExiting]);

  const requestNavigate = useCallback(
    (direction: NavigateDirection) => {
      if (!canNavigate || isTransitioning) {
        return;
      }
      if (prefersReducedMotion) {
        onNavigate(direction);
        return;
      }
      lastDirectionRef.current = direction;
      setExitDirection(direction);
      setIsExiting(true);
    },
    [canNavigate, isTransitioning, onNavigate, prefersReducedMotion],
  );

  const completeExit = useCallback(() => {
    if (!isExitingRef.current) {
      return;
    }
    setIsExiting(false);
    awaitingEnterRef.current = true;
    onNavigate(lastDirectionRef.current);
  }, [onNavigate]);

  useLayoutEffect(() => {
    if (contentKey === prevContentKeyRef.current) {
      return;
    }
    prevContentKeyRef.current = contentKey;

    if (!awaitingEnterRef.current) {
      return;
    }
    awaitingEnterRef.current = false;
    setPendingEnterDirection(lastDirectionRef.current);
  }, [contentKey]);

  useLayoutEffect(() => {
    if (pendingEnterDirection == null || !enterContentReady) {
      return;
    }
    setEnterDirection(pendingEnterDirection);
    setPendingEnterDirection(undefined);
  }, [enterContentReady, pendingEnterDirection]);

  const handleTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      if (e.propertyName !== 'transform' || !isExitingRef.current) {
        return;
      }
      completeExit();
    },
    [completeExit],
  );

  const handleAnimationEnd = useCallback(() => {
    setEnterDirection(undefined);
  }, []);

  useEffect(() => {
    if (!isExiting) {
      return;
    }
    const timer = setTimeout(() => {
      completeExit();
    }, EXIT_FALLBACK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [completeExit, isExiting]);

  return {
    requestNavigate,
    slideTransition: {
      isExiting,
      exitDirection,
      isAwaitingEnterContent: pendingEnterDirection != null,
      enterDirection,
      onTransitionEnd: handleTransitionEnd,
      onAnimationEnd: handleAnimationEnd,
    },
  };
};

const SlideClip = styled.div`
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
`;

const SlideTrack = styled.div<{
  $isExiting: boolean;
  $exitDirection: NavigateDirection;
  $concealEnter: boolean;
  $enterDirection: NavigateDirection | undefined;
}>`
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  will-change: transform;

  ${({ $isExiting, $exitDirection }) =>
    $isExiting
      ? css`
          transition:
            transform ${EXIT_MS}ms ease-in,
            opacity ${EXIT_MS}ms ease-in;
          transform: translateX(
            ${$exitDirection === 'next' ? `calc(-1 * ${SLIDE_OFFSET})` : SLIDE_OFFSET}
          );
          opacity: 0.45;
        `
      : css`
          transition: none;
          transform: none;
          opacity: 1;
        `}

  ${({ $concealEnter }) =>
    $concealEnter
      ? css`
          opacity: 0;
        `
      : undefined}

  ${({ $enterDirection }) =>
    $enterDirection === 'next'
      ? css`
          animation: ${slideInFromRight} ${ENTER_MS}ms ease-out;
        `
      : $enterDirection === 'previous'
        ? css`
            animation: ${slideInFromLeft} ${ENTER_MS}ms ease-out;
          `
        : undefined}
`;
