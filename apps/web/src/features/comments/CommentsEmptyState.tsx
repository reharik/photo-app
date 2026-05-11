import { JSX } from 'react';
import styled from 'styled-components';

type Props = {
  canComment: boolean;
};

export const CommentsEmptyState = ({ canComment }: Props): JSX.Element => (
  <Root>
    <Icon aria-hidden>💬</Icon>
    <Message>{canComment ? 'No comments yet. Be the first.' : 'No comments yet.'}</Message>
  </Root>
);

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.color.textMuted};
`;

const Icon = styled.span`
  font-size: 24px;
  line-height: 1;
  filter: grayscale(0.6);
`;

const Message = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textMuted};
  text-align: center;
`;
