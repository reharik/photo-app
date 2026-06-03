import {
  AlbumItemSummaryFragment,
  AlbumSummaryFragment,
  CommentDetailFieldsFragment,
  CommentFieldsFragment,
  EmojiCountFragment,
  MediaItemDetailFragment,
  MediaItemSummaryFragment,
  Operation,
  PublicAlbumItemSummaryFragment,
  PublicAlbumSummaryFragment,
  PublicMediaItemSummaryFragment,
  ReactionCountsFragment,
  SharedWithMedMediaItemFragment,
  ViewerReactionFragment,
} from '../graphql/generated/types';

export type AlbumItemSummaryVM = AlbumItemSummaryFragment;
export type AlbumSummaryVM = Omit<AlbumSummaryFragment, 'items'> & {
  itemCount: number;
};
export type CommentReplyVM = CommentFieldsFragment;
export type CommentRootVM = CommentDetailFieldsFragment;

export type MediaItemSummaryVM = MediaItemSummaryFragment;
export type MediaItemDetailVM = MediaItemDetailFragment;
export type PublicMediaItemSummaryVM = PublicMediaItemSummaryFragment;
export type PublicMediaItemDetailVM = PublicMediaItemSummaryFragment;
export type PublicAlbumItemSummaryVM = PublicAlbumItemSummaryFragment;
export type PublicAlbumSummaryVM = Omit<PublicAlbumSummaryFragment, 'items'> & {
  itemCount: number;
};

export type ReactionCountsVM = ReactionCountsFragment;
export type EmojiCountVM = EmojiCountFragment;
export type ViewerReactionVM = ViewerReactionFragment;

export type SharedWithMedMediaItemVM = SharedWithMedMediaItemFragment & ViewableItemVM;
export type ViewableItemVM = {
  id: string;
  operations: Operation[];
};
