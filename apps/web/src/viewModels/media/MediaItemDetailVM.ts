import { MediaKind } from '@packages/contracts';
import { ViewableItemVM } from '../album/AlbumSummaryVM';

// export type MediaItemDetailVM = UserMediaItemDetailVM | PublicMediaItemSummaryVM;

export type MediaItemDetailVM = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  title?: string;
  description?: string;
  originalFileName: string;
  createdAt: string;
  takenAt: string;
} & ViewableItemVM;
