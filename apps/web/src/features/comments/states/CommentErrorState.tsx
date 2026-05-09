import styled from 'styled-components';

type Props = {
  onRetry?: () => void;
};

export const CommentErrorState = ({ onRetry }: Props) => (
  <Root role="alert">
    <Message>Could not load comments.</Message>
    {onRetry && (
      <RetryButton type="button" onClick={onRetry}>
        Try again
      </RetryButton>
    )}
  </Root>
);

const Root = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.color.textDanger};
  font-size: ${({ theme }) => theme.fontSize._14};
`;

const Message = styled.span``;

const RetryButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color.textAccent};
  font-size: ${({ theme }) => theme.fontSize._14};
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;
