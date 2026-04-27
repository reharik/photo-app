import { MediaKind, ViewerOperation } from '@packages/contracts';

export type MediaItemSummaryVM = {
  id: string;
  title: string;
  createdAt: string;
  kind: MediaKind;
  /** From `viewer.viewerOperations` when the item was loaded via a decorated list query. */
  viewerOperations: ViewerOperation[];
};
