import { ViewerOperation } from '@packages/contracts';
import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';
import { PublicAlbumItemSummaryVM } from '../publicAlbum/PublicAlbumItemSummaryVM';

export type AlbumItemSummaryVM = UserAlbumItemSummaryVM | PublicAlbumItemSummaryVM;

export type UserAlbumItemSummaryVM = {
  id: string;
  createdAt: string;
  mediaItem: MediaItemSummaryVM;
  orderIndex: string;
  updatedAt: string;
  /** From `AlbumItem.viewerOperations` (decorated in `album.items` resolver). */
  viewerOperations: ViewerOperation[];
};
