import { ContractError, fail, ok, OperationResult } from '@packages/contracts';
import { UnitOfWork } from '../../../infrastructure';
import { AlbumRepository, SystemGrantRepository } from '../../../repositories';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface RevokePublicLinkService extends WriteServiceBase {
  (input: RevokePublicLinkServiceInput): Promise<OperationResult<{ token: string }>>;
}

type RevokePublicLinkServiceInput = {
  albumId: string;
  actorId: string;
};
type RevokePublicLinkServiceDeps = {
  albumRepository: AlbumRepository;
  uow: UnitOfWork;
  systemGrantRepository: SystemGrantRepository;
};

export const build__RevokePublicLinkService = ({
  albumRepository,
  systemGrantRepository,
  uow,
}: RevokePublicLinkServiceDeps): RevokePublicLinkService => {
  return async ({
    albumId,
    actorId,
  }: RevokePublicLinkServiceInput): Promise<OperationResult<{ token: string }>> => {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      return fail(ContractError.AlbumNotFound);
    }
    const revokeResult = album.revokePublicLinks(actorId);
    if (!revokeResult.success) {
      return revokeResult;
    }
    const publicLinkResult = album.grantPublicLink({
      actorId,
    });
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    const publicLink = publicLinkResult.value;
    await albumRepository.save(album);

    await Promise.all(
      revokeResult.value.map((x) => systemGrantRepository.pruneGrantsForAuthorization(x, [], uow)),
    );
    return ok({ token: publicLink.linkToken() });
  };
};
