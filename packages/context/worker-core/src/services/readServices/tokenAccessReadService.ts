import { TokenAccessReadRepository } from '../../repositories/readRepositories/tokenAccessReadRepository';

export type TokenAccessRow = {
  id: string;
  albumId: string;
  linkToken: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export interface TokenAccessReadService {
  validateToken: (tokenAccessId: string) => Promise<string | undefined>;
}

type TokenAccessReadServiceDeps = {
  tokenAccessReadRepository: TokenAccessReadRepository;
};

export const build__TokenAccessReadService = ({
  tokenAccessReadRepository,
}: TokenAccessReadServiceDeps): TokenAccessReadService => {
  return {
    validateToken: async (tokenLinkId: string): Promise<string | undefined> => {
      const tokenAccess = await tokenAccessReadRepository.getTokenAccessIdByToken(tokenLinkId);
      if (!tokenAccess) {
        return undefined;
      }
      return tokenAccess.tokenAccessId;
    },
  };
};
