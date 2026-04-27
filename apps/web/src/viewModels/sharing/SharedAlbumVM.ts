import { SharePermission } from '@packages/contracts';
import { AlbumSummaryVM } from '../album/AlbumSummaryVM';

export type SharedAlbumVM = {
  id: string;
  permission: SharePermission;
  sharedAt: string;
  sharedBy: string;
  /** Album summary; cover link remains `/albums/:id` (same as owned albums). */
  album: AlbumSummaryVM;
};
