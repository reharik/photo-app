import { JSX, useId } from 'react';
import styled from 'styled-components';

const isDevBuild = (): boolean => {
  return import.meta.env.DEV;
};

export const QueryErrorState = ({
  error,
  onRetry,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: QueryErrorStateProps): JSX.Element => {
  const titleId = useId();

  return (
    <QueryPanel role="alert">
      <MainBlock>
        <PanelTitle id={titleId}>{title}</PanelTitle>
        <PanelBody aria-labelledby={titleId}>{message}</PanelBody>
        {onRetry != null ? (
          <RetryButton type="button" onClick={onRetry}>
            Try again
          </RetryButton>
        ) : null}
      </MainBlock>
      {isDevBuild() ? (
        <DevDetails>
          <summary>Technical details (development)</summary>
          <DevPre>{JSON.stringify(error, null, 2)}</DevPre>
        </DevDetails>
      ) : null}
    </QueryPanel>
  );
};

type QueryErrorStateProps = {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  message?: string;
};

const DEFAULT_TITLE = 'Something went wrong';
const DEFAULT_MESSAGE = "We couldn't load this content. Please try again.";

export const SoftPanel = styled.div`
  width: 100%;
  max-width: min(36rem, 100%);
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing(2.5)};
  font-family: ${({ theme }) => theme.font.body};
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text};
`;

const QueryPanel = styled(SoftPanel)`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) => theme.colors.panel};
  color: ${({ theme }) => theme.colors.text};
`;

const MainBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1.25)};
`;

const DevDetails = styled.details`
  margin-top: ${({ theme }) => theme.spacing(2)};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.subtext};

  summary {
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &[open] summary {
    margin-bottom: ${({ theme }) => theme.spacing(1)};
  }
`;

const DevPre = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 0.6875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${({ theme }) => theme.colors.subtext};
`;

export const PanelBody = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.subtext};
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing(0.75)} ${theme.spacing(1.5)}`};
  font-size: 0.8125rem;
  font-family: inherit;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.bg};
  background: ${({ theme }) => theme.colors.accent};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accentHover};
    outline-offset: 2px;
  }
`;
