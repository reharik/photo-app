import {
  useCallback,
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

type UseMediaViewerSlideTransitionOptions = {
  contentKey: string;
  canNavigate: boolean;
  onNavigate: (direction: NavigateDirection) => void;
};

type UseMediaViewerSlideTransitionResult = {
  requestNavigate: (direction: NavigateDirection) => void;
  SlideTransitionWrap: (props: { children: ReactNode }) => ReactNode;
};

export const useMediaViewerSlideTransition = ({
  contentKey,
  canNavigate,
  onNavigate,
}: UseMediaViewerSlideTransitionOptions): UseMediaViewerSlideTransitionResult => {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<NavigateDirection>('next');
  const [enterDirection, setEnterDirection] = useState<NavigateDirection | undefined>();
  const awaitingEnterRef = useRef(false);
  const lastDirectionRef = useRef<NavigateDirection>('next');
  const prevContentKeyRef = useRef(contentKey);

  const isTransitioning = isExiting || enterDirection != null;

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
    setEnterDirection(lastDirectionRef.current);
  }, [contentKey]);

  const handleTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== 'transform' || !isExiting) {
        return;
      }
      completeExit();
    },
    [completeExit, isExiting],
  );

  const handleAnimationEnd = useCallback(() => {
    setEnterDirection(undefined);
  }, []);

  const SlideTransitionWrap = useCallback(
    ({ children }: { children: ReactNode }): ReactNode => (
      <SlideClip>
        <SlideTrack
          $isExiting={isExiting}
          $exitDirection={exitDirection}
          $enterDirection={enterDirection}
          onTransitionEnd={handleTransitionEnd}
          onAnimationEnd={handleAnimationEnd}
        >
          {children}
        </SlideTrack>
      </SlideClip>
    ),
    [
      enterDirection,
      exitDirection,
      handleAnimationEnd,
      handleTransitionEnd,
      isExiting,
    ],
  );

  return {
    requestNavigate,
    SlideTransitionWrap,
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
