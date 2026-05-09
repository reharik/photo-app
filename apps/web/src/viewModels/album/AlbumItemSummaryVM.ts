import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';
import { ViewableItemVM } from './AlbumSummaryVM';

// export type AlbumItemSummaryVM = UserAlbumItemSummaryVM | PublicAlbumItemSummaryVM;

export type AlbumItemSummaryVM = {
  createdAt?: string;
  mediaItem: MediaItemSummaryVM;
  orderIndex: string;
  updatedAt?: string;
  /** From `AlbumItem.viewerOperations` (decorated in `album.items` resolver). */
} & ViewableItemVM;
