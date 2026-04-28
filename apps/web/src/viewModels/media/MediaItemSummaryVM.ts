import { MediaKind, ViewerOperation } from '@packages/contracts';
import { PublicMediaItemSummaryVM } from '../publicMedia/PublicMediaItemSummaryVM';

export type MediaItemSummaryVM = UserMediaItemSummaryVM | PublicMediaItemSummaryVM;

export type UserMediaItemSummaryVM = {
  id: string;
  title: string;
  createdAt: string;
  kind: MediaKind;
  /** From `viewer.viewerOperations` when the item was loaded via a decorated list query. */
  viewerOperations: ViewerOperation[];
};
