import { MediaKind, ViewerOperation } from '@packages/contracts';

export type PublicMediaItemSummaryVM = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  title?: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  viewerOperations: ViewerOperation[];
};
