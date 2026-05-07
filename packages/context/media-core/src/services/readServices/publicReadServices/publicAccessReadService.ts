import { ViewerOperation } from 'packages/foundation/contracts/src/enums/viewerOperations';
import { AlbumReadRepository } from '../../../repositories/readRepositories/albumReadRepository';
import { MediaItemReadRepository } from '../../../repositories/readRepositories/mediaItemReadRepository';
import { PublicAccessReadRepository } from '../../../repositories/readRepositories/publicAccessReadRepository';
import { PublicAccessProjection } from '../types';

export interface PublicAccessReadService {
  publicAccessByTokenHash: (tokenHash: string) => Promise<PublicAccessProjection | undefined>;
}

type PublicAccessReadServiceDeps = {
  albumReadRepository: AlbumReadRepository;
  mediaItemReadRepository: MediaItemReadRepository;
  publicAccessReadRepository: PublicAccessReadRepository;
};

export const build__PublicAccessReadService = ({
  publicAccessReadRepository,
}: PublicAccessReadServiceDeps): PublicAccessReadService => {
  return {
    publicAccessByTokenHash: async (
      tokenHash: string,
    ): Promise<PublicAccessProjection | undefined> => {
      const publicAccessRow =
        await publicAccessReadRepository.findActiveWithGrantsByTokenHash(tokenHash);
      if (!publicAccessRow) {
        return undefined;
      }
      const grant = publicAccessRow.publicAccess.grants[0];
      if (!grant || !grant.albumId) {
        return undefined;
      }
      const permissions = grant.permission
        .split(',')
        .map((p) => ViewerOperation.fromValue(p.trim()));

      return {
        publicLinkId: publicAccessRow.publicAccess.id,
        albumId: grant.albumId,
        permissions,
      };
    },
  };
};
