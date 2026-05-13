import { MediaKind, ReactionEmoji } from '@packages/contracts';
import { ViewableItemVM } from '../album/AlbumSummaryVM';
import { ReactionCountsVM } from '../reactions/ReactionCountsVM';

export type MediaItemDetailVM = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  title?: string;
  description?: string;
  originalFileName: string;
  createdAt: string;
  takenAt: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions: ReactionEmoji[];
} & ViewableItemVM;
