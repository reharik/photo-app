import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { DBPublicMediaItemRow } from '../../services/readServices/types';
import type { EntityId } from '../../types/types';
import type { PublicMediaItemReadRepository, ReadRepositoryDeps } from './types';

export type { PublicMediaItemReadRepository } from './types';

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

export const build__PublicMediaItemReadRepository = ({
  database,
}: ReadRepositoryDeps): PublicMediaItemReadRepository => ({
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
        .where('accessGrant.id', publicLinkId)
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
