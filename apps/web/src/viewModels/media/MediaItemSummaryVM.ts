import { MediaItemStatus, MediaKind, ReactionEmoji } from '@packages/contracts';
import { ViewableItemVM } from '../album/AlbumSummaryVM';
import { ReactionCountsVM } from '../reactions/ReactionCountsVM';

// export type MediaItemSummaryVM = UserMediaItemSummaryVM | PublicMediaItemSummaryVM;

export type MediaItemSummaryVM = {
  id: string;
  title?: string;
  createdAt: string;
  kind: MediaKind;
  status: MediaItemStatus;
  reactionCounts: ReactionCountsVM;
  viewerReactions: ReactionEmoji[];
  /** From `viewer.viewerOperations` when the item was loaded via a decorated list query. */
} & ViewableItemVM;
