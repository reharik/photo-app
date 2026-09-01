import { Knex } from 'knex';
import { exists } from '../../infrastructure';
import { EntityId } from '../../types';
import { withLiveAuthorizationFilter } from '../queryHelpers';

export type HasActiveGrantInput = {
  mediaItemId: string;
  viewerId?: string;
  token?: string;
};

export type HasAlbumMembershipForMediaItemInput = {
  mediaItemId: string;
  viewerId: string;
};

export interface SystemMediaGrantRepository {
  hasActiveGrant: (input: HasActiveGrantInput) => Promise<boolean>;
  hasAlbumMembershipForMediaItem: (input: HasAlbumMembershipForMediaItemInput) => Promise<boolean>;
  getMediaItemOwnerId: ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }) => Promise<{ id: EntityId; ownerId: EntityId } | undefined>;
}

type SystemMediaGrantRepositoryDeps = { database: Knex };

export const build__SystemMediaGrantRepository = ({
  database,
}: SystemMediaGrantRepositoryDeps): SystemMediaGrantRepository => ({
  hasActiveGrant: async (input: HasActiveGrantInput): Promise<boolean> => {
    if (input.viewerId) {
      return exists(
        database('grant')
          .where('media_item_id', input.mediaItemId)
          .where('granted_to_user', input.viewerId),
      );
    }
    return exists(
      database('accessGrant')
        .join('grant', 'accessGrant.id', 'grant.accessGrantId')
        .where('accessGrant.linkToken', input.token)
        .where('grant.mediaItemId', input.mediaItemId)
        .modify(withLiveAuthorizationFilter(database)),
    );
  },
  hasAlbumMembershipForMediaItem: async (
    input: HasAlbumMembershipForMediaItemInput,
  ): Promise<boolean> => {
    return exists(
      database('albumItem')
        .join('albumMember', 'albumMember.albumId', 'albumItem.albumId')
        .where('albumItem.mediaItemId', input.mediaItemId)
        .where('albumMember.userId', input.viewerId),
    );
  },
  getMediaItemOwnerId: async ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }): Promise<{ id: EntityId; ownerId: EntityId } | undefined> => {
    const row = await database('mediaItem')
      .where({ id: mediaItemId })
      .first<{ id: EntityId; ownerId: EntityId }>('id', 'ownerId');
    return row;
  },
});
