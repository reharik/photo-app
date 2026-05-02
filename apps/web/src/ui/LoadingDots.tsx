/**
 * LoadingDots — a three-dot pulsing animation for loading states.
 * Ported from the Linus design system.
 */
import { ReactElement } from 'react';
import styled, { css, keyframes } from 'styled-components';

export const LoadingDots = (): ReactElement => (
  <Wrapper role="alert" aria-busy="true" aria-label="Loading">
    <Dot $delay="0s" />
    <Dot $delay="0.1s" />
    <Dot $delay="0.2s" />
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const grow = keyframes`
  0%, 50%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  25% {
    transform: scale(1.6);
    opacity: 1;
  }
`;

const Dot = styled.div<{ $delay: string }>(
  ({ $delay, theme: { color } }) => css`
    width: 8px;
    height: 8px;
    background: ${color.loadingDot};
    border-radius: 50%;
    animation: ${grow} 0.7s linear infinite;
    animation-delay: ${$delay};
  `,
);
