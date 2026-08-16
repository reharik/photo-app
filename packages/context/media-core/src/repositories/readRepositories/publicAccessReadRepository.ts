import { AuthorizationKind } from '@packages/contracts';
import { withLiveAuthorizationFilter } from '../queryHelpers';
import type {
  PublicAccessIdRow,
  PublicAccessReadRepository,
  PublicAccessRow,
  ReadRepositoryDeps,
} from './types';

export const build__PublicAccessReadRepository = ({
  database,
}: ReadRepositoryDeps): PublicAccessReadRepository => ({
  getPublicAccessIdByToken: async (token: string) => {
    const publicAccess = await database<PublicAccessIdRow>('accessGrant')
      .where('accessGrant.linkToken', token)
      .whereIn('kind', [AuthorizationKind.public.value, AuthorizationKind.pending.value])
      .modify(withLiveAuthorizationFilter(database))
      .first<PublicAccessIdRow>('id as publicAccessId');
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
  getPublicAccessById: async (publicAccessId: string) => {
    const publicAccess = await database('accessGrant')
      .where('accessGrant.id', publicAccessId)
      .whereIn('kind', [AuthorizationKind.public.value, AuthorizationKind.pending.value])
      .modify(withLiveAuthorizationFilter(database))
      .first<PublicAccessRow>();
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
});
