import {
  PublicAccessReadRepository,
  PublicAccessRow,
} from '../../../repositories/readRepositories/types';
import { AgnosticReadServiceBase } from '../readServiceBaseType';

export interface PublicAccessReadService extends AgnosticReadServiceBase {
  validateToken: (token: string) => Promise<string | undefined>;
  getPublicAccessById: (publicAccessId: string) => Promise<PublicAccessRow | undefined>;
}

type PublicAccessReadServiceDeps = {
  publicAccessReadRepository: PublicAccessReadRepository;
};

export const build__PublicAccessReadService = ({
  publicAccessReadRepository,
}: PublicAccessReadServiceDeps): PublicAccessReadService => {
  return {
    validateToken: async (token: string): Promise<string | undefined> => {
      const publicAccess = await publicAccessReadRepository.getPublicAccessIdByToken(token);
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
