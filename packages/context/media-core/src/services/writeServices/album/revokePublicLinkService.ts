import { ContractError, fail, ok, OperationResult } from '@packages/contracts';
import { AlbumRepository, SystemGrantRepository } from '../../../repositories';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface RevokePublicLinkService extends WriteServiceBase {
  (input: RevokePublicLinkServiceInput): Promise<OperationResult<{ token: string }>>;
}

type RevokePublicLinkServiceInput = {
  albumId: string;
};
type RevokePublicLinkServiceDeps = {
  albumRepository: AlbumRepository;
  systemGrantRepository: SystemGrantRepository;
  viewerId: EntityId;
};

export const build__RevokePublicLinkService = ({
  albumRepository,
  systemGrantRepository,
  viewerId,
}: RevokePublicLinkServiceDeps): RevokePublicLinkService => {
  return async ({
    albumId,
  }: RevokePublicLinkServiceInput): Promise<OperationResult<{ token: string }>> => {
    const album = await albumRepository.getById(albumId);
    if (!album) {
      return fail(ContractError.AlbumNotFound);
    }
    const revokeResult = album.revokePublicLinks(viewerId);
    if (!revokeResult.success) {
      return revokeResult;
    }
    const publicLinkResult = album.grantPublicLink({
      actorId: viewerId,
    });
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    const publicLink = publicLinkResult.value;
    await albumRepository.save(album);

    await Promise.all(
      revokeResult.value.map((x) => systemGrantRepository.pruneGrantsForAuthorization(x, [])),
    );
    return ok({ token: publicLink.linkToken() });
  };
};
