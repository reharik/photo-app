import { ContractError, fail, ok, UserStatus, WriteResult } from '@packages/contracts';
import { indexBy, Logger } from '@packages/infrastructure';
import {
  eachIndependently,
  formatFailures,
  IndependentGroupResult,
} from '../../../infrastructure/writeServices/groupActionStrategy';
import { AlbumRepository, UserReadRepository } from '../../../repositories';
import { UserRow } from '../../readServices/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { AddAlbumMembersCommand } from './writeAlbum.types';

export interface AddAlbumMembers extends WriteServiceBase {
  (input: AddAlbumMembersCommand): Promise<WriteResult<IndependentGroupResult<UserRow, string>>>;
}

type AddAlbumMembersDeps = {
  albumRepository: AlbumRepository;
  userReadRepository: UserReadRepository;
  logger: Logger;
};

export const build__AddAlbumMembers = ({
  albumRepository,
  userReadRepository,
  logger,
}: AddAlbumMembersDeps): AddAlbumMembers => {
  return async ({
    albumId,
    userIds,
    role,
    actorId,
  }: AddAlbumMembersCommand): Promise<WriteResult<IndependentGroupResult<UserRow, string>>> => {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      return fail(ContractError.AlbumNotFound);
    }
    const users = await userReadRepository.getByIds(userIds);
    const foundIds = indexBy(users);
    const missing = userIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return fail(ContractError.UserDoesNotExist);
    }
    const result = eachIndependently(users, (x): WriteResult<string> => {
      if (!x.userStatus.equals(UserStatus.active)) {
        return fail(ContractError.UserIsNotActive);
      }
      const addMemberResult = album.addMember(x.id, role, actorId);
      if (!addMemberResult.success) {
        return addMemberResult;
      }
      return ok(addMemberResult.value.id());
    });

    // ALL-OR-NOTHING GUARD — Until the share UI renders the
    // errors array, a partial failure is a silent lie, so fail the
    // whole op (rolls back uow). Pending failures stay non-fatal (logged above). See RAI-XX.
    if (result.failed.length > 0) {
      logger.warn(
        formatFailures(result.failed, 'partial addition of new album members', (x) => x.id),
      );
      return fail(ContractError.PartialAlbumMemberCreation);
    }
    await albumRepository.save(album);

    return ok(result);
  };
};
