import { AppErrorCollection, ViewerOperation } from '@packages/contracts';
import { Album } from '../../domain/Album/Album';
import { fail, ok } from '../../domain/utilities/writeResponse';
import { EntityId } from '../../types/types';

export const ensureMemberCanEditAlbum = (
  album: Album,
  viewerOperation: ViewerOperation,
  viewerId: EntityId,
) => {
  const member = album.getAlbumMember(viewerId);
  if (!member) {
    return fail(AppErrorCollection.album.UserIsNotMember);
  }
  return member.role().can(viewerOperation) ? ok(undefined) : fail(viewerOperation.deniedError);
};
