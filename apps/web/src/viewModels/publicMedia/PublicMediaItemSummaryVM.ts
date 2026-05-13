import { MediaKind, ViewerOperation } from '@packages/contracts';
import { ReactionCountsVM } from '../reactions/ReactionCountsVM';

export type PublicMediaItemSummaryVM = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  title?: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  reactionCounts: ReactionCountsVM;
  viewerOperations: ViewerOperation[];
};
