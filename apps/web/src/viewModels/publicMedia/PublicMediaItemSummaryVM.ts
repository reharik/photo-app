import { MediaKind, ViewerOperation } from '@packages/contracts';

export type PublicMediaItemSummaryVM = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  title: string;
  viewerOperations: ViewerOperation[];
};
