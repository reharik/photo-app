import { JSX } from 'react';
import styled, { keyframes } from 'styled-components';

export const BrandedLoading = (): JSX.Element => {
  return (
    <Page role="status" aria-live="polite" aria-busy="true" aria-label="Loading">
      <Spinner aria-hidden />
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(3)};
  box-sizing: border-box;
  background: ${({ theme }) => theme.color.body};
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.loadingSpinner};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;
