import styled from 'styled-components';

export const CommentEmptyState = () => (
  <Root>
    <Icon aria-hidden>💬</Icon>
    <Message>Be the first to comment</Message>
  </Root>
);

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.color.textMuted};
`;

const Icon = styled.span`
  font-size: 28px;
  line-height: 1;
  filter: grayscale(0.6);
`;

const Message = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textMuted};
`;
