import type {
  GrantReadRepository,
  HasActiveAccessGrantPermissionInput,
  HasActiveGrantInput,
  HasActiveGrantPermissionInput,
  ReadRepositoryDeps,
} from './types';

export const build__GrantReadRepository = ({
  database,
}: ReadRepositoryDeps): GrantReadRepository => ({
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
      .where('shareLink.linkToken', input.token)
      .where('grant.mediaItemId', input.mediaItemId)
      .first();
  },
  hasActiveGrantPermission: (input: HasActiveGrantPermissionInput): Promise<boolean> => {
    return database('grant')
      .join('access_grant as ag', 'ag.id', 'grant.access_grant_id')
      .where('grant.media_item_id', input.mediaItemId)
      .where('grant.granted_to_user', input.viewerId)
      .whereRaw('? = ANY(COALESCE("grant".operations, ag.operations))', [input.operation.value])
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
      .andWhereRaw('? = ANY(COALESCE("grant".operations, ag.operations))', [input.operation.value])
      .first();
  },
});
