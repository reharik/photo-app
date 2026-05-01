import { AlbumMemberRole, ViewerOperation } from '@packages/contracts';
import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';

// export type AlbumSummaryVM = UserAlbumSummaryVM | PublicAlbumSummaryVM;

export type AlbumSummaryVM = {
  id: string;
  title: string;
  description?: string;
  viewerMemberRole?: AlbumMemberRole;
  coverMedia?: MediaItemSummaryVM;
  itemCount: number;
  updatedAt: string;
  viewerOperations: ViewerOperation[];
};
