import type {
  PublicAccessIdRow,
  PublicAccessReadRepository,
  PublicAccessRow,
  ReadRepositoryDeps,
} from './types';

export const build__PublicAccessReadRepository = ({
  database,
}: ReadRepositoryDeps): PublicAccessReadRepository => ({
  getPublicAccessIdByHashedToken: async (tokenHash: string) => {
    const publicAccess = await database<PublicAccessIdRow>('shareLink')
      .where('shareLink.linkToken', tokenHash)
      .whereNull('shareLink.revokedAt')
      .where((b) => {
        b.whereNull('shareLink.expiresAt').orWhere('shareLink.expiresAt', '>', database.fn.now());
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
  canAccessMediaWithLink: async ({ tokenHash, mediaItemId }) => {
    const q = database('shareLink')
      .join('accessGrant', 'accessGrant.shareLinkId', 'shareLink.id')
      .join('grant', 'accessGrant.id', 'grant.accessGrantId')
      .where('shareLink.linkToken', tokenHash)
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
