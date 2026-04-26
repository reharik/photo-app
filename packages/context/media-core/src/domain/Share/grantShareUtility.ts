import { AlbumMemberRole, AppErrorCollection, SharePermission } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { Album } from '../Album/Album';
import { MediaItem } from '../MediaItem/MediaItem';
import { fail, ok } from '../utilities/writeResponse';
import { Share } from './Share';

export const grantShareUtility = <T extends Album | MediaItem>(
  item: T,
  permission: SharePermission,
  actorId: ActorId,
  grantedToUserId?: EntityId,
  token?: string,
  label?: string,
  expiresAt?: Date,
): WriteResult<{
  share: Share;
  status: 'created' | 'updated' | 'noop';
}> => {
  if (grantedToUserId && token) {
    return fail(AppErrorCollection.share.ShareMustNotHaveGrantedToUserIdAndToken);
  }
  if (token) {
    const share = Share.create({ permission, token, label, expiresAt }, actorId);
    return ok({ share, status: 'created' });
  }
  if (!grantedToUserId) {
    return fail(AppErrorCollection.share.ShareMustHaveEitherGrantedToUserIdOrToken);
  }
  if (item instanceof Album) {
    const owner = item.getAlbumMember(grantedToUserId)!;

    if (owner.role() === AlbumMemberRole.owner) {
      return fail(AppErrorCollection.share.CanNotGrantShareToOwner);
    }
  } else if (item instanceof MediaItem && item.ownerId() === grantedToUserId) {
    return fail(AppErrorCollection.share.CanNotGrantShareToOwner);
  }

  const existingShare = item.getShares().find((s) => s.grantedToUser() === grantedToUserId);
  if (!existingShare) {
    const share = Share.create(
      { permission, grantedToUser: grantedToUserId, label, expiresAt },
      actorId,
    );
    return ok({ share, status: 'created' });
  }
  if (label && existingShare.label() !== label) {
    const updatedLabel = existingShare.updateLabel(label, actorId);
    if (!updatedLabel.success) {
      return updatedLabel;
    }
  }
  if (expiresAt && existingShare.expiresAt() !== expiresAt) {
    const updatedExpireDate = existingShare.updateExpireDate(expiresAt, actorId);
    if (!updatedExpireDate.success) {
      return updatedExpireDate;
    }
  }
  return ok({ share: existingShare, status: 'updated' });
};
