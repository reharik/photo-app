import { MediaKind } from '@packages/contracts';

export type MediaItemSummaryVM = {
  id: string;
  title: string;
  createdAt: string;
  kind: MediaKind;
};
