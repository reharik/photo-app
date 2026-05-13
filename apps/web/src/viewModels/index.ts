import { AlbumItemSummaryFragment, AlbumSummaryFragment } from '../graphql/generated/types';

export type AlbumItemSummaryVM = AlbumItemSummaryFragment;
export type AlbumSummaryVM = Omit<AlbumSummaryFragment, 'items'> & {
  items?: AlbumSummaryFragment['items'];
};
