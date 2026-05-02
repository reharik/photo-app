import { ViewableItemVM } from '../album/AlbumSummaryVM';
import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';

export type SharedMediaItemVM = {
  /** `access_grant.id` — grid row identity. */
  id: string;
  sharedAt: string;
  sharedBy: string;
  mediaItem: MediaItemSummaryVM;
} & ViewableItemVM;
