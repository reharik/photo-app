import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { ViewableItemVM } from '../album/AlbumSummaryVM';

// export type MediaItemSummaryVM = UserMediaItemSummaryVM | PublicMediaItemSummaryVM;

export type MediaItemSummaryVM = {
  id: string;
  title?: string;
  createdAt: string;
  kind: MediaKind;
  status: MediaItemStatus;
  /** From `viewer.viewerOperations` when the item was loaded via a decorated list query. */
} & ViewableItemVM;
