import { AppErrorCollection, Operation } from '@packages/contracts';
import { Album } from '../../domain/Album/Album';
import { fail, ok } from '../../domain/utilities/writeResponse';
import { EntityId } from '../../types/types';

export const ensureMemberCanEditAlbum = (
  album: Album,
  operation: Operation,
  viewerId: EntityId,
) => {
  const member = album.getAlbumMember(viewerId);
  if (!member) {
    return fail(AppErrorCollection.album.UserIsNotMember);
  }
  return member.role().can(operation) ? ok(undefined) : fail(operation.deniedError);
};
