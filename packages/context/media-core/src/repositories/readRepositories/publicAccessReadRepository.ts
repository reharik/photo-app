import type { Knex } from 'knex';

export type PublicAccessRow = {
  id: string;
  albumId: string;
  linkToken: string;
  grantedBy: string;
  expiresAt?: Date;
  revokedAt?: Date;
};

export type PublicAccessReadRepository = {
  getPublicAccessIdByHashedToken: (
    tokenHash: string,
  ) => Promise<{ publicAccessId: string } | undefined>;
  getPublicAccessById: (publicAccessId: string) => Promise<PublicAccessRow | undefined>;
  canAccessMediaWithLink: (input: { tokenHash: string; mediaItemId: string }) => Promise<boolean>;
};

type PublicAccessReadRepositoryDeps = { database: Knex };

export const build__PublicAccessReadRepository = ({
  database,
}: PublicAccessReadRepositoryDeps): PublicAccessReadRepository => ({
  getPublicAccessIdByHashedToken: async (tokenHash: string) => {
    const publicAccess = await database<{ publicAccessId: string }>('shareLink')
      .where('shareLink.linkToken', tokenHash)
      .whereNull('shareLink.revokedAt')
      .where((b) => {
        b.whereNull('shareLink.expiresAt').orWhere('shareLink.expiresAt', '>', database.fn.now());
      })
      .first<{ publicAccessId: string }>('id as publicAccessId');
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
