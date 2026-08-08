import { AlbumMemberRole, AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { EntityId } from '../../types/types';
import { Album } from '../Album/Album';

/**
 * Album-only: MediaItem no longer carries authorizations. Loose items are wrapped in
 * a shadow album and granted at album scope (see grantUserAuthorization).
 */
export const grantAuthorizationValidation = (
  item: Album,
  grantedToUserId: EntityId,
  label?: string,
  expiresAt?: Date,
): WriteResult<{
  status: 'createAuthorization' | 'updateLabel' | 'updateExpireDate' | 'updated';
}> => {
  const member = item.getAlbumMemberByUserId(grantedToUserId);
  if (member && member.role().equals(AlbumMemberRole.owner)) {
    return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
  }

  const existingAuthorization = item
    .getAuthorizations()
    .find((s) => s.grantedToUser() === grantedToUserId);
  if (!existingAuthorization) {
    return ok({ status: 'createAuthorization' });
  }
  if (label && existingAuthorization.label() !== label) {
    return ok({ status: 'updateLabel' });
  }
  if (expiresAt && existingAuthorization.expiresAt() !== expiresAt) {
    return ok({ status: 'updateExpireDate' });
  }
  return ok({ status: 'updated' });
};
