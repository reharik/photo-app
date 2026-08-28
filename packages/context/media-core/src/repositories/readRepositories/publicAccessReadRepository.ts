import { AuthorizationKind } from '@packages/contracts';
import { withLiveAuthorizationFilter } from '../queryHelpers';
import type {
  PublicAccessIdRow,
  PublicAccessReadRepository,
  PublicAccessRow,
  ReadRepositoryDeps,
} from './types';

export const build__PublicAccessReadRepository = ({
  uow,
}: ReadRepositoryDeps): PublicAccessReadRepository => ({
  getPublicAccessIdByToken: async (token: string) => {
    await uow.join();
    const publicAccess = await uow
      .db()<PublicAccessIdRow>('accessGrant')
      .where('accessGrant.linkToken', token)
      .whereIn('kind', [AuthorizationKind.public.value, AuthorizationKind.pending.value])
      .modify(withLiveAuthorizationFilter(uow.db()))
      .first<PublicAccessIdRow>('id as publicAccessId');
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
  getPublicAccessById: async (publicAccessId: string) => {
    await uow.join();
    const publicAccess = await uow
      .db()('accessGrant')
      .where('accessGrant.id', publicAccessId)
      .whereIn('kind', [AuthorizationKind.public.value, AuthorizationKind.pending.value])
      .modify(withLiveAuthorizationFilter(uow.db()))
      .first<PublicAccessRow>();
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
});
