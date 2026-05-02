import { ViewerOperation } from '@packages/contracts';
import { PublicMediaItemSummaryVM } from '../publicMedia/PublicMediaItemSummaryVM';

export type PublicAlbumItemSummaryVM = {
  id: string;
  mediaItem: PublicMediaItemSummaryVM;
  orderIndex: string;
  /** From `AlbumItem.viewerOperations` (decorated in `album.items` resolver). */
  viewerOperations: ViewerOperation[];
};
