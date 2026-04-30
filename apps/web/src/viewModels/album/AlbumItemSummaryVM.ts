import { ViewerOperation } from '@packages/contracts';
import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';

// export type AlbumItemSummaryVM = UserAlbumItemSummaryVM | PublicAlbumItemSummaryVM;

export type AlbumItemSummaryVM = {
  id: string;
  createdAt: string;
  mediaItem: MediaItemSummaryVM;
  orderIndex: string;
  updatedAt: string;
  /** From `AlbumItem.viewerOperations` (decorated in `album.items` resolver). */
  viewerOperations: ViewerOperation[];
};
