import { JSX } from 'react';
import styled, { keyframes } from 'styled-components';

type PageSpinnerProps = {
  label?: string;
};

const DEFAULT_LABEL = 'Loading…';

export const PageSpinner = ({ label = DEFAULT_LABEL }: PageSpinnerProps): JSX.Element => {
  return (
    <Wrap role="status" aria-live="polite" aria-busy="true">
      <Ring aria-hidden />
      <Label>{label}</Label>
    </Wrap>
  );
};

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  width: 100%;
  padding: ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;
`;

const Ring = styled.div`
  width: 28px;
  height: 28px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.accent};
  border-radius: 50%;
  animation: ${spin} 0.75s linear infinite;
`;

const Label = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.subtext};
  font-family: ${({ theme }) => theme.font.body};
  text-align: center;
`;
