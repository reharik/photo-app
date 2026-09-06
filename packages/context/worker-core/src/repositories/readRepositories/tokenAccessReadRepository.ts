import { AuthorizationKind } from '@packages/contracts';
import { Knex } from 'knex';
import { EntityId } from '../../types';
import { withLiveAuthorizationFilter } from '../queryHelpers';

export type TokenAccessIdRow = {
  tokenAccessId: EntityId;
};

export interface TokenAccessReadRepository {
  getTokenAccessIdByToken: (token: string) => Promise<TokenAccessIdRow | undefined>;
}

export type TokenAccessReadRepositoryDeps = { database: Knex };

export const build__TokenAccessReadRepository = ({
  database,
}: TokenAccessReadRepositoryDeps): TokenAccessReadRepository => ({
  getTokenAccessIdByToken: async (token: string) => {
    const tokenAccess = await database<TokenAccessIdRow>('accessGrant')
      .where('accessGrant.linkToken', token)
      .whereIn('kind', [AuthorizationKind.public.value, AuthorizationKind.pending.value])
      .modify(withLiveAuthorizationFilter(database))
      // camelCase alias: knex-stringcase wraps it to `token_access_id` on the way out
      // and camelCases it back on the way in, so a PascalCase alias here would come
      // back as `tokenAccessId` and never match the key the caller reads.
      .first<TokenAccessIdRow>('id as tokenAccessId');
    if (!tokenAccess) {
      return undefined;
    }
    return tokenAccess;
  },
});
