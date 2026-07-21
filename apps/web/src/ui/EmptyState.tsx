import type { ReactNode } from 'react';
import styled from 'styled-components';

type EmptyStateProps = {
  title: string;
  text: string;
  /**
   * Illustration slot rendered above the headline. Strokes/fills should use
   * `currentColor` — the slot is clay-tinted here, so a richer illustration can
   * drop in later with no plumbing change. See {@link FilmRollMark}.
   */
  illustration?: ReactNode;
  action?: ReactNode;
};

export const EmptyState = ({ title, text, illustration, action }: EmptyStateProps) => {
  return (
    <EmptyStateContainer>
      {illustration ? <EmptyIllustration aria-hidden>{illustration}</EmptyIllustration> : null}
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyText>{text}</EmptyText>
      {action ? action : null}
    </EmptyStateContainer>
  );
};

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(8)};
  text-align: center;
`;

const EmptyIllustration = styled.div`
  display: flex;
  color: ${({ theme }) => theme.color.textAccent};
  opacity: 0.85;

  svg {
    display: block;
    width: auto;
    max-width: 100%;
    height: auto;
  }
`;

const EmptyTitle = styled.h2`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._24};
  font-weight: ${({ theme }) => theme.weight.medium};
  margin: 0;
  color: ${({ theme }) => theme.color.bodyText};
`;

const EmptyText = styled.p`
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  color: ${({ theme }) => theme.color.bodyTextSecondary};
  margin: 0;
  max-width: 400px;
`;
