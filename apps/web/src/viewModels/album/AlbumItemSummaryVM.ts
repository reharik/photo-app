import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';

export type AlbumItemSummaryVM = {
  id: string;
  createdAt: string;
  mediaItem: MediaItemSummaryVM;
  orderIndex: string;
  updatedAt: string;
};
