import { ViewerOperation } from '@packages/contracts';
import { Knex } from 'knex';

export type HasActiveGrantInput = {
  mediaItemId: string;
  viewerId?: string;
  tokenHash?: string;
};

export type HasActiveGrantPermissionInput = {
  mediaItemId: string;
  viewerId: string;
  permission: ViewerOperation;
};

export type HasActiveAccessGrantPermissionInput = {
  albumId: string;
  viewerId: string;
  permission: ViewerOperation;
};

export type GrantReadRepository = {
  hasActiveGrant: (input: HasActiveGrantInput) => Promise<boolean>;
  hasActiveGrantPermission: (input: HasActiveGrantPermissionInput) => Promise<boolean>;
  hasActiveAccessGrantPermission: (input: HasActiveAccessGrantPermissionInput) => Promise<boolean>;
};

type GrantReadRepositoryDeps = { database: Knex };

export const build__GrantReadRepository = ({
  database,
}: GrantReadRepositoryDeps): GrantReadRepository => ({
  hasActiveGrant: (input: HasActiveGrantInput): Promise<boolean> => {
    if (input.viewerId) {
      return database('grant')
        .where('media_item_id', input.mediaItemId)
        .where('granted_to_user', input.viewerId)
        .first();
    }
    return database('shareLink')
      .join('accessGrant', 'accessGrant.shareLinkId', 'shareLink.id')
      .join('grant', 'accessGrant.id', 'grant.accessGrantId')
      .where('shareLink.linkToken', input.tokenHash)
      .where('grant.mediaItemId', input.mediaItemId)
      .first();
  },
  hasActiveGrantPermission: (input: HasActiveGrantPermissionInput): Promise<boolean> => {
    return database('grant')
      .where('media_item_id', input.mediaItemId)
      .where('granted_to_user', input.viewerId)
      .whereRaw(`',' || permissions || ',' LIKE ?`, [`%,${input.permission.value},%`])
      .first();
  },
  hasActiveAccessGrantPermission: (
    input: HasActiveAccessGrantPermissionInput,
  ): Promise<boolean> => {
    return database('accessGrant as ag')
      .join('grant', 'ag.id', 'grant.accessGrantId')
      .where('ag.albumId', input.albumId)
      .where('grant.granted_to_user', input.viewerId)
      .whereNull('ag.revokedAt')
      .andWhere((expiry) => {
        expiry.whereNull('ag.expiresAt').orWhere('ag.expiresAt', '>', database.fn.now());
      })
      .andWhereRaw(`',' || permissions || ',' LIKE ?`, [`%,${input.permission.value},%`])
      .first();
  },
});
