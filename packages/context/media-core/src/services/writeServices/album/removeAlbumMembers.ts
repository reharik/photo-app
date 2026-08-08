import { ContractError, fail, ok, WriteResult } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import {
  eachIndependently,
  formatFailures,
  IndependentGroupResult,
} from '../../../infrastructure/writeServices/groupActionStrategy';
import { AlbumRepository } from '../../../repositories';
import { WriteServiceBase } from '../writeServiceBaseType';
import { RemoveAlbumMembersCommand } from './writeAlbum.types';

export interface RemoveAlbumMembers extends WriteServiceBase {
  (input: RemoveAlbumMembersCommand): Promise<WriteResult<IndependentGroupResult<string, string>>>;
}

type RemoveAlbumMembersDeps = { albumRepository: AlbumRepository; logger: Logger };

export const build__RemoveAlbumMembers = ({
  albumRepository,
  logger,
}: RemoveAlbumMembersDeps): RemoveAlbumMembers => {
  return async ({
    albumId,
    albumMemberIds,
    actorId,
  }: RemoveAlbumMembersCommand): Promise<WriteResult<IndependentGroupResult<string, string>>> => {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      return fail(ContractError.AlbumNotFound);
    }
    const result = eachIndependently(albumMemberIds, (x) => {
      const removeMemberResult = album.removeMember(x, actorId);
      if (!removeMemberResult.success) {
        return removeMemberResult;
      }
      return ok(removeMemberResult.value.id());
    });

    // ALL-OR-NOTHING GUARD — Until the share UI renders the
    // errors array, a partial failure is a silent lie, so fail the
    // whole op (rolls back uow). Pending failures stay non-fatal (logged above). See RAI-XX.
    if (result.failed.length > 0) {
      logger.warn(formatFailures(result.failed, 'partial removal of album members', (x) => x));
      return fail(ContractError.PartialAlbumMemberRemoval);
    }
    await albumRepository.save(album);

    return ok(result);
  };
};
