import { MediaKind, ViewerOperation } from '@packages/contracts';

// export type MediaItemDetailVM = UserMediaItemDetailVM | PublicMediaItemSummaryVM;

export type MediaItemDetailVM = {
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
