import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { DBPublicMediaItemRow } from '../../services/readServices/types';
import { EntityId } from '../../types/types';

const DBPublicMediaItemRowFields = [
  'media_item.id',
  'media_item.kind',
  'media_item.status',
  'media_item.title',
  'media_item.mime_type',
  'media_item.width',
  'media_item.height',
  'media_item.duration_seconds',
  'media_item.reaction_counts',
];

type PublicMediaItemReadRepositoryDeps = { database: Knex };

export type PublicMediaItemReadRepository = {
  getPublicMediaItem: ({
    mediaItemId,
    publicLinkId,
  }: {
    mediaItemId: EntityId;
    publicLinkId: EntityId;
  }) => Promise<DBPublicMediaItemRow | undefined>;
};

export const build__PublicMediaItemReadRepository = ({
  database,
}: PublicMediaItemReadRepositoryDeps): PublicMediaItemReadRepository => ({
  getPublicMediaItem: async ({
    mediaItemId,
    publicLinkId,
  }: {
    mediaItemId: EntityId;
    publicLinkId: EntityId;
  }): Promise<DBPublicMediaItemRow | undefined> => {
    const mediaItem = await withEnumRevival(
      database('mediaItem')
        .join('grant', 'mediaItem.id', 'grant.mediaItemId')
        .join('accessGrant', 'accessGrant.id', 'grant.accessGrantId')
        .where('accessGrant.shareLinkId', publicLinkId)
        .whereNull('accessGrant.revokedAt')
        .where((b) => {
          b.whereNull('accessGrant.expiresAt').orWhere(
            'accessGrant.expiresAt',
            '>',
            database.fn.now(),
          );
        })
        .where('mediaItem.id', mediaItemId)
        .first<DBPublicMediaItemRow>(...DBPublicMediaItemRowFields),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
      { strict: true },
    );
    if (!mediaItem) return undefined;
    return mediaItem;
  },
});
