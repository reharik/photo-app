import { MediaKind, ViewerOperation } from '@packages/contracts';
import { PublicMediaItemSummaryVM } from '../publicMedia/PublicMediaItemSummaryVM';

export type MediaItemDetailVM = UserMediaItemDetailVM | PublicMediaItemSummaryVM;

export type UserMediaItemDetailVM = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  title: string;
  description?: string;
  originalFileName: string;
  createdAt: string;
  takenAt: string;
  viewerOperations: ViewerOperation[];
};
