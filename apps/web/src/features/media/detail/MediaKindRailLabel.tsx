import { MediaKind } from '@packages/contracts';
import type { JSX } from 'react';
import styled from 'styled-components';

export type MediaKindRailLabelProps = {
  kind: MediaKind;
};

const labelForKind = (kind: MediaKind): string => {
  if (kind.equals(MediaKind.photo)) {
    return 'Photo';
  }
  if (kind.equals(MediaKind.video)) {
    return 'Video';
  }
  return kind.display;
};

export const MediaKindRailLabel = ({ kind }: MediaKindRailLabelProps): JSX.Element => (
  <Root>{labelForKind(kind)}</Root>
);

const Root = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  color: ${({ theme }) => theme.color.textMuted};
  line-height: 1.4;
`;
