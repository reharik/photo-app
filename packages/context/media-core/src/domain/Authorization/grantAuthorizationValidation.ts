import {
  AlbumMemberRole,
  AppErrorCollection,
  fail,
  ok,
  Operation,
  OperationResult,
} from '@packages/contracts';
import { EntityId } from '../../types/types';
import { Album } from '../Album/Album';

/**
 * Album-only: MediaItem no longer carries authorizations. Loose items are wrapped in
 * a shadow album and granted at album scope (see grantUserAuthorization).
 */
export const grantAuthorizationValidation = (
  item: Album,
  grantedToUserId: EntityId,
  grantedBy: EntityId,
  label?: string,
): OperationResult<{
  status: 'createAuthorization' | 'updateLabel' | 'updated';
}> => {
  const member = item.getAlbumMemberByUserId(grantedToUserId);
  if (member && member.role().equals(AlbumMemberRole.owner)) {
    return fail(AppErrorCollection.authorization.CanNotGrantAuthorizationToOwner);
  }

  const authorizingMember = item.getAlbumMemberByUserId(grantedBy);
  if (!authorizingMember?.role().can(Operation.grantAlbumAuthorization)) {
    return fail(Operation.grantAlbumAuthorization.deniedError);
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

  return ok({ status: 'updated' });
};
