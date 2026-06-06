import { JSX } from 'react';
import styled from 'styled-components';

export const CommentsEmptyHint = (): JSX.Element => (
  <Hint>Be the first to say something</Hint>
);

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  color: ${({ theme }) => theme.color.textMuted};
`;
