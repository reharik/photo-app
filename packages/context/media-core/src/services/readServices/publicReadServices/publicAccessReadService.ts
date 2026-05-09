import {
  PublicAccessReadRepository,
  PublicAccessRow,
} from '../../../repositories/readRepositories/publicAccessReadRepository';

export interface PublicAccessReadService {
  validateHashedToken: (tokenHash: string) => Promise<string | undefined>;
  getPublicAccessById: (publicAccessId: string) => Promise<PublicAccessRow | undefined>;
}

type PublicAccessReadServiceDeps = {
  publicAccessReadRepository: PublicAccessReadRepository;
};

export const build__PublicAccessReadService = ({
  publicAccessReadRepository,
}: PublicAccessReadServiceDeps): PublicAccessReadService => {
  return {
    validateHashedToken: async (tokenHash: string): Promise<string | undefined> => {
      const publicAccess =
        await publicAccessReadRepository.getPublicAccessIdByHashedToken(tokenHash);
      if (!publicAccess) {
        return undefined;
      }
      return publicAccess.publicAccessId;
    },
    getPublicAccessById: async (publicLinkId: string): Promise<PublicAccessRow | undefined> => {
      const publicAccess = await publicAccessReadRepository.getPublicAccessById(publicLinkId);
      if (!publicAccess) {
        return undefined;
      }
      return publicAccess;
    },
  };
};
