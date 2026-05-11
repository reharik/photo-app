import { JSX } from 'react';
import styled from 'styled-components';

export const DeletedCommentPlaceholder = (): JSX.Element => <Root>[deleted]</Root>;

const Root = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.5)} 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  font-style: italic;
  color: ${({ theme }) => theme.color.textMuted};
`;
