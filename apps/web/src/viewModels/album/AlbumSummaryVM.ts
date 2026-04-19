import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';

export type AlbumSummaryVM = {
  id: string;
  title: string;
  description?: string;
  coverMedia?: MediaItemSummaryVM;
  itemCount: number;
  updatedAt: string;
};
