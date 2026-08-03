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
      .whereNull('accessGrant.revokedAt')
      .where((b) => {
        b.whereNull('accessGrant.expiresAt').orWhere(
          'accessGrant.expiresAt',
          '>',
          database.fn.now(),
        );
      })
      .first<PublicAccessIdRow>('id as publicAccessId');
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
  getPublicAccessById: async (publicAccessId: string) => {
    const publicAccess = await database('accessGrant')
      .where('accessGrant.id', publicAccessId)
      .whereNull('accessGrant.revokedAt')
      .where((b) => {
        b.whereNull('accessGrant.expiresAt').orWhere(
          'accessGrant.expiresAt',
          '>',
          database.fn.now(),
        );
      })
      .first<PublicAccessRow>();
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
});
