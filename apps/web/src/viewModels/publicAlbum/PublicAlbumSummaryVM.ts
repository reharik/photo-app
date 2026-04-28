import { PublicMediaItemSummaryVM } from '../publicMedia/PublicMediaItemSummaryVM';

export type PublicAlbumSummaryVM = {
  id: string;
  title: string;
  coverMedia?: PublicMediaItemSummaryVM;
  itemCount: number;
};
