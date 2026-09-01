import { ContractError, fail, ok, OperationResult } from '@packages/contracts';
import { AlbumRepository, SystemGrantRepository } from '../../../repositories';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface RevokeShareService extends WriteServiceBase {
  (input: RevokeShareServiceInput): Promise<OperationResult<{ albumId: string }>>;
}

type RevokeShareServiceInput = {
  albumId: string;
  authorizationId: string;
};
type RevokeShareServiceDeps = {
  albumRepository: AlbumRepository;
  systemGrantRepository: SystemGrantRepository;
  viewerId: EntityId;
};

export const build__RevokeShareService = ({
  albumRepository,
  systemGrantRepository,
  viewerId,
}: RevokeShareServiceDeps): RevokeShareService => {
  return async ({
    albumId,
    authorizationId,
  }: RevokeShareServiceInput): Promise<OperationResult<{ albumId: string }>> => {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      return fail(ContractError.AlbumNotFound);
    }
    const revokeResult = album.revokeAuthorization(authorizationId, viewerId);
    if (!revokeResult.success) {
      return revokeResult;
    }
    await albumRepository.save(album);

    await systemGrantRepository.pruneGrantsForAuthorization(authorizationId, []);
    return ok({ albumId });
  };
};
