import { AlbumMemberRole, AppErrorCollection } from '@packages/contracts';
import { EntityId, WriteResult } from '../../types/types';
import { Album } from '../Album/Album';
import { MediaItem } from '../MediaItem/MediaItem';
import { fail, ok } from '../utilities/writeResponse';

export const grantAuthorizationValidation = <T extends Album | MediaItem>(
  item: T,
  grantedToUserId?: EntityId,
  publicLinkId?: EntityId,
  label?: string,
  expiresAt?: Date,
): WriteResult<{
  status: 'createAuthorization' | 'updateLabel' | 'updateExpireDate' | 'updated';
}> => {
  if (grantedToUserId && publicLinkId) {
    return fail(
      AppErrorCollection.authorization.AuthorizationMustNotHaveGrantedToUserIdAndPublicLinkId,
    );
  }
  if (!grantedToUserId && !publicLinkId) {
    return fail(
      AppErrorCollection.authorization.AuthorizationMustHaveGrantedToUserIdOrPublicLinkId,
    );
  }
  if (grantedToUserId) {
    if (item instanceof Album) {
      const member = item.getAlbumMember(grantedToUserId);

      if (member && member.role().equals(AlbumMemberRole.owner)) {
        return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
      }
    } else if (item instanceof MediaItem && item.ownerId() === grantedToUserId) {
      return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
    }
  }

  const existingAuthorization = item
    .getAuthorizations()
    .find((s) => s.grantedToUser() === grantedToUserId || s.publicLinkId() === publicLinkId);
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
