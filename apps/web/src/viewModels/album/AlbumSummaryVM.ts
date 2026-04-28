import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';
import { PublicAlbumSummaryVM } from '../publicAlbum/PublicAlbumSummaryVM';

export type AlbumSummaryVM = UserAlbumSummaryVM | PublicAlbumSummaryVM;

export type UserAlbumSummaryVM = {
  id: string;
  title: string;
  description?: string;
  viewerIsOwner: boolean;
  coverMedia?: MediaItemSummaryVM;
  itemCount: number;
  updatedAt: string;
};
