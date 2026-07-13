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
  canAccessMediaWithLink: async ({ token, mediaItemId }) => {
    const q = database('accessGrant')
      .join('grant', 'accessGrant.id', 'grant.accessGrantId')
      .where('accessGrant.linkToken', token)
      .whereNull('accessGrant.revokedAt')
      .where((b) =>
        b
          .whereNull('accessGrant.expiresAt')
          .orWhere('accessGrant.expiresAt', '>', database.fn.now()),
      )
      .where('grant.mediaItemId', mediaItemId);

    const row = await q.first<boolean>();
    return row !== undefined;
  },
});
