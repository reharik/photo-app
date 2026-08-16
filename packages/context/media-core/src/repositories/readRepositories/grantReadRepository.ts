import { withLiveAuthorizationFilter } from '../queryHelpers';
import type {
  GrantReadRepository,
  HasActiveAccessGrantPermissionInput,
  HasActiveGrantInput,
  HasActiveGrantPermissionInput,
  HasAlbumMembershipForMediaItemInput,
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
    return database('accessGrant')
      .join('grant', 'accessGrant.id', 'grant.accessGrantId')
      .where('accessGrant.linkToken', input.token)
      .where('grant.mediaItemId', input.mediaItemId)
      .modify(withLiveAuthorizationFilter(database))
      .first();
  },
  hasActiveGrantPermission: (input: HasActiveGrantPermissionInput): Promise<boolean> => {
    return database('grant')
      .join('access_grant as ag', 'ag.id', 'grant.access_grant_id')
      .where('grant.media_item_id', input.mediaItemId)
      .where('grant.granted_to_user', input.viewerId)
      .modify(withLiveAuthorizationFilter(database, 'ag'))
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
      .modify(withLiveAuthorizationFilter(database, 'ag'))
      .andWhereRaw('? = ANY(COALESCE("grant".operations, ag.operations))', [input.operation.value])
      .first();
  },
  hasAlbumMembershipForMediaItem: (
    input: HasAlbumMembershipForMediaItemInput,
  ): Promise<boolean> => {
    return database('albumItem')
      .join('albumMember', 'albumMember.albumId', 'albumItem.albumId')
      .where('albumItem.mediaItemId', input.mediaItemId)
      .where('albumMember.userId', input.viewerId)
      .first();
  },
});
