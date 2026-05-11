import { JSX } from 'react';
import styled, { keyframes } from 'styled-components';

export const CommentsLoadingState = (): JSX.Element => (
  <Root aria-label="Loading comments">
    <Shimmer $wide />
    <ShimmerRow>
      <Shimmer $narrow />
      <Shimmer />
    </ShimmerRow>
    <Shimmer $wide />
    <ShimmerRow>
      <Shimmer $narrow />
      <Shimmer />
    </ShimmerRow>
  </Root>
);

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(1)} 0;
`;

const ShimmerRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Shimmer = styled.div<{ $wide?: boolean; $narrow?: boolean }>`
  height: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.color.bodyElevated};
  animation: ${pulse} 1.6s ease-in-out infinite;
  width: ${({ $wide, $narrow }) => ($narrow ? '32px' : $wide ? '70%' : '45%')};
`;
