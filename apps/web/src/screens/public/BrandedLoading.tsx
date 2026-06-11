import { JSX } from 'react';
import styled, { keyframes } from 'styled-components';
import { APP_NAME, APP_TAGLINE } from '../../brand';

export const BrandedLoading = (): JSX.Element => {
  return (
    <Page role="status" aria-live="polite" aria-busy="true" aria-label="Loading">
      <BrandColumn>
        <Wordmark>{APP_NAME}</Wordmark>
        <Tagline>{APP_TAGLINE}</Tagline>
        <Spinner aria-hidden />
      </BrandColumn>
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

const BrandColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: 480px;
`;

const Wordmark = styled.h1`
  font-family: ${({ theme }) => theme.font.body};
  font-size: 48px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
  margin: 0;
  letter-spacing: -1px;

  @media (max-width: 968px) {
    font-size: 36px;
  }
`;

const Tagline = styled.p`
  font-family: ${({ theme }) => theme.font.body};
  font-size: 18px;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  margin: 0;
  line-height: 1.6;
  max-width: 480px;
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 24px;
  height: 24px;
  margin-top: ${({ theme }) => theme.spacing(4)};
  border: 2px solid ${({ theme }) => theme.color.border};
  border-top-color: ${({ theme }) => theme.color.loadingSpinner};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;
