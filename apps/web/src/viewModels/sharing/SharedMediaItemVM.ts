import { SharePermission } from '@packages/contracts';
import { MediaItemSummaryVM } from '../media/MediaItemSummaryVM';

export type SharedMediaItemVM = {
  /** `access_grant.id` — grid row identity. */
  id: string;
  permission: SharePermission;
  sharedAt: string;
  sharedBy: string;
  mediaItem: MediaItemSummaryVM;
};
