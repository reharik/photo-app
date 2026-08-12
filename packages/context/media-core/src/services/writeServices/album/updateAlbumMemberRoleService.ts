import { AlbumMemberRole, ContractError, fail, ok, OperationResult } from '@packages/contracts';
import { AlbumRepository } from '../../../repositories';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface UpdateAlbumMemberRoleService extends WriteServiceBase {
  (
    input: UpdateAlbumMemberRoleServiceInput,
  ): Promise<OperationResult<{ albumMemberId: string; role: AlbumMemberRole }>>;
}

type UpdateAlbumMemberRoleServiceInput = {
  albumId: string;
  albumMemberId: string;
  actorId: string;
  role: AlbumMemberRole;
};

type UpdateAlbumMemberRoleServiceDeps = { albumRepository: AlbumRepository };

export const build__UpdateAlbumMemberRoleService = ({
  albumRepository,
}: UpdateAlbumMemberRoleServiceDeps): UpdateAlbumMemberRoleService => {
  return async ({
    albumId,
    albumMemberId,
    role,
    actorId,
  }: UpdateAlbumMemberRoleServiceInput): Promise<
    OperationResult<{ albumMemberId: string; role: AlbumMemberRole }>
  > => {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      return fail(ContractError.AlbumNotFound);
    }
    const updateResult = album.updateMember(albumMemberId, role, actorId);
    if (!updateResult.success) {
      return updateResult;
    }
    await albumRepository.save(album);
    return ok({ albumMemberId, role: updateResult.value.role() });
  };
};
