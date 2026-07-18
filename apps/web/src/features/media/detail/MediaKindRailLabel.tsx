import { MediaKind } from '@packages/contracts';
import type { JSX } from 'react';
import styled from 'styled-components';

export type MediaKindRailLabelProps = {
  kind: MediaKind;
};

export const MediaKindRailLabel = ({ kind }: MediaKindRailLabelProps): JSX.Element => (
  <Root>{kind.display}</Root>
);

const Root = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.textMuted};
  line-height: 1.4;
`;
