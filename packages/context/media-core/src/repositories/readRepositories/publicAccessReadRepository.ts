import type { Knex } from 'knex';

export type PublicAccessGrantRow = {
  id: string;
  shareLinkId: string;
  accessGrantId: string;
  mediaItemId?: string;
  albumId?: string;
  permission: string;
};

export type PublicAccessRow = {
  id: string;
  createdBy: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  grants: PublicAccessGrantRow[];
};

export type PublicAccessReadRepository = {
  findActiveWithGrantsByTokenHash: (
    tokenHash: string,
  ) => Promise<{ publicAccess: PublicAccessRow } | undefined>;
  canAccessMediaWithLink: (input: { tokenHash: string; mediaItemId: string }) => Promise<boolean>;
};

type PublicAccessReadRepositoryDeps = { database: Knex };

export const build__PublicAccessReadRepository = ({
  database,
}: PublicAccessReadRepositoryDeps): PublicAccessReadRepository => ({
  findActiveWithGrantsByTokenHash: async (tokenHash: string) => {
    const publicAccess = await database<PublicAccessRow>('shareLink')
      .where({ linkToken: tokenHash })
      .whereNull('revokedAt')
      .where((b) => {
        b.whereNull('expiresAt').orWhere('expiresAt', '>', database.fn.now());
      })
      .first();

    if (!publicAccess) {
      return undefined;
    }

    const grants = await database<PublicAccessGrantRow>('shareLinkGrant')
      .join('accessGrant', 'accessGrant.id', 'shareLinkGrant.accessGrantId')
      .where('shareLinkGrant.shareLinkId', publicAccess.id)
      .whereNull('accessGrant.revokedAt')
      .where((b) => {
        b.whereNull('accessGrant.expiresAt').orWhere(
          'accessGrant.expiresAt',
          '>',
          database.fn.now(),
        );
      })
      .select<PublicAccessGrantRow[]>(
        'shareLinkGrant.id as id',
        'shareLinkGrant.shareLinkId as publicAccessId',
        'accessGrant.id as accessGrantId',
        'accessGrant.mediaItemId as mediaItemId',
        'accessGrant.albumId as albumId',
        'accessGrant.permission as permission',
      );

    return { publicAccess: { ...publicAccess, grants } };
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
