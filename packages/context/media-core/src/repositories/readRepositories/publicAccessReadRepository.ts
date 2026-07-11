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
    const publicAccess = await database('shareLink')
      .where('shareLink.id', publicAccessId)
      .whereNull('shareLink.revokedAt')
      .where((b) => {
        b.whereNull('shareLink.expiresAt').orWhere('shareLink.expiresAt', '>', database.fn.now());
      })
      .first<PublicAccessRow>();
    if (!publicAccess) {
      return undefined;
    }
    return publicAccess;
  },
  canAccessMediaWithLink: async ({ token, mediaItemId }) => {
    const q = database('shareLink')
      .join('accessGrant', 'accessGrant.shareLinkId', 'shareLink.id')
      .join('grant', 'accessGrant.id', 'grant.accessGrantId')
      .where('shareLink.linkToken', token)
      .whereNull('shareLink.revokedAt')
      .where((b) =>
        b.whereNull('shareLink.expiresAt').orWhere('shareLink.expiresAt', '>', database.fn.now()),
      )
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
