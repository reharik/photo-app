import { exists } from '../../infrastructure/repositories/exists';
import { withLiveAuthorizationFilter } from '../queryHelpers';
import type {
  GrantReadRepository,
  HasActiveAccessGrantPermissionInput,
  HasActiveGrantInput,
  HasActiveGrantPermissionInput,
  HasAlbumMembershipForMediaItemInput,
  ReadRepositoryDeps,
} from './types';

export const build__GrantReadRepository = ({ uow }: ReadRepositoryDeps): GrantReadRepository => ({
  hasActiveGrant: async (input: HasActiveGrantInput): Promise<boolean> => {
    await uow.join();
    if (input.viewerId) {
      return exists(
        uow
          .db()('grant')
          .where('media_item_id', input.mediaItemId)
          .where('granted_to_user', input.viewerId),
      );
    }
    return exists(
      uow
        .db()('accessGrant')
        .join('grant', 'accessGrant.id', 'grant.accessGrantId')
        .where('accessGrant.linkToken', input.token)
        .where('grant.mediaItemId', input.mediaItemId)
        .modify(withLiveAuthorizationFilter(uow.db())),
    );
  },
  hasActiveGrantPermission: async (input: HasActiveGrantPermissionInput): Promise<boolean> => {
    await uow.join();
    return exists(
      uow
        .db()('grant')
        .join('access_grant as ag', 'ag.id', 'grant.access_grant_id')
        .where('grant.media_item_id', input.mediaItemId)
        .where('grant.granted_to_user', input.viewerId)
        .modify(withLiveAuthorizationFilter(uow.db(), 'ag'))
        .whereRaw('? = ANY(COALESCE("grant".operations, ag.operations))', [input.operation.value]),
    );
  },
  hasActiveAccessGrantPermission: async (
    input: HasActiveAccessGrantPermissionInput,
  ): Promise<boolean> => {
    await uow.join();
    return exists(
      uow
        .db()('accessGrant as ag')
        .join('grant', 'ag.id', 'grant.accessGrantId')
        .where('ag.albumId', input.albumId)
        .where('grant.granted_to_user', input.viewerId)
        .modify(withLiveAuthorizationFilter(uow.db(), 'ag'))
        .andWhereRaw('? = ANY(COALESCE("grant".operations, ag.operations))', [
          input.operation.value,
        ]),
    );
  },
  hasAlbumMembershipForMediaItem: async (
    input: HasAlbumMembershipForMediaItemInput,
  ): Promise<boolean> => {
    await uow.join();
    return exists(
      uow
        .db()('albumItem')
        .join('albumMember', 'albumMember.albumId', 'albumItem.albumId')
        .where('albumItem.mediaItemId', input.mediaItemId)
        .where('albumMember.userId', input.viewerId),
    );
  },
});
