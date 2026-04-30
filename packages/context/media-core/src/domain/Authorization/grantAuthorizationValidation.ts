import { AlbumMemberRole, AppErrorCollection, SharePermission } from '@packages/contracts';
import { ActorId, EntityId, WriteResult } from '../../types/types';
import { Album } from '../Album/Album';
import { MediaItem } from '../MediaItem/MediaItem';
import { fail, ok } from '../utilities/writeResponse';
import { Authorization } from './Authorization';

export const grantAuthorizationValidation = <T extends Album | MediaItem>(
  item: T,
  permission: SharePermission,
  actorId: ActorId,
  grantedToUserId?: EntityId,
  label?: string,
  expiresAt?: Date,
): WriteResult<{
  authorization: Authorization;
  status: 'created' | 'updated' | 'noop';
}> => {
  if (!grantedToUserId) {
    return fail(AppErrorCollection.authorization.AuthorizationMustHaveGrantedToUserId);
  }
  if (item instanceof Album) {
    const member = item.getAlbumMember(grantedToUserId)!;

    if (member && member.role() === AlbumMemberRole.owner) {
      return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
    }
  } else if (item instanceof MediaItem && item.ownerId() === grantedToUserId) {
    return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
  }

  const existingAuthorization = item
    .getAuthorizations()
    .find((s) => s.grantedToUser() === grantedToUserId);
  if (!existingAuthorization) {
    const authorization = Authorization.create(
      { permission, grantedToUser: grantedToUserId, grantedBy: actorId, label, expiresAt },
      actorId,
    );
    return ok({ authorization, status: 'created' });
  }
  if (label && existingAuthorization.label() !== label) {
    const updatedLabel = existingAuthorization.updateLabel(label, actorId);
    if (!updatedLabel.success) {
      return updatedLabel;
    }
  }
  if (expiresAt && existingAuthorization.expiresAt() !== expiresAt) {
    const updatedExpireDate = existingAuthorization.updateExpireDate(expiresAt, actorId);
    if (!updatedExpireDate.success) {
      return updatedExpireDate;
    }
  }
  return ok({ authorization: existingAuthorization, status: 'updated' });
};
