import type { Knex } from 'knex';
import { NamespacedMediaItemRow } from '../../services/readServices/viewerReadServices/viewerAlbumReadService.types';
import type { EntityId } from '../../types/types';

const mediaItemSelectColumns = [
  'mediaItem.id as mediaItemId',
  'mediaItem.ownerId as mediaItemOwnerId',
  'mediaItem.kind as mediaItemKind',
  'mediaItem.status as mediaItemStatus',
  'mediaItem.mimeType as mediaItemMimeType',
  'mediaItem.sizeBytes as mediaItemSizeBytes',
  'mediaItem.originalFileName as mediaItemOriginalFileName',
  'mediaItem.width as mediaItemWidth',
  'mediaItem.height as mediaItemHeight',
  'mediaItem.durationSeconds as mediaItemDurationSeconds',
  'mediaItem.title as mediaItemTitle',
  'mediaItem.description as mediaItemDescription',
  'mediaItem.takenAt as mediaItemTakenAt',
  'mediaItem.createdAt as mediaItemCreatedAt',
  'mediaItem.updatedAt as mediaItemUpdatedAt',
];

const albumWithCoverSelectColumns = [
  'album.id as albumId',
  'album.title as albumTitle',
  'album.createdAt as albumCreatedAt',
  'album.updatedAt as albumUpdatedAt',
  ...mediaItemSelectColumns,
];

const accessGrantFieldSelect = [
  'accessGrant.permission as permission',
  'accessGrant.id as id',
  'accessGrant.createdAt as sharedAt',
  'accessGrant.grantedBy as sharedBy',
];

export type SharedMediaItemRow = NamespacedMediaItemRow & {
  id: string;
  sharedBy: EntityId;
  sharedAt: Date;
  permission: string;
};

export type SharedAlbumRow = {
  id: string;
  albumId: string;
  albumTitle: string;
  albumCreatedAt: Date;
  albumUpdatedAt: Date;
  sharedBy: EntityId;
  sharedAt: Date;
  permission: string;
} & NamespacedMediaItemRow; // cover item

export type SharedWithMeReadRepository = {
  getItemsSharedWithMe: (viewerId: string) => Promise<{
    sharedWithMeMediaItems: SharedMediaItemRow[];
    sharedWithMeAlbums: SharedAlbumRow[];
  }>;
};

type SharedWithMeReadRepositoryDeps = { database: Knex };

const applyActiveUserGrant = <TRecord extends object, TResult>(
  q: Knex.QueryBuilder<TRecord, TResult>,
  { database, viewerId }: { database: Knex; viewerId: string },
): Knex.QueryBuilder<TRecord, TResult> => {
  return q
    .where('accessGrant.grantedToUser', viewerId)
    .whereNull('accessGrant.revokedAt')
    .where((b) => {
      b.whereNull('accessGrant.expiresAt').orWhere(
        'accessGrant.expiresAt',
        '>',
        database.raw('now()'),
      );
    });
};

export const buildSharedWithMeReadRepository = ({
  database,
}: SharedWithMeReadRepositoryDeps): SharedWithMeReadRepository => ({
  getItemsSharedWithMe: async (viewerId: string) => {
    const mediaQuery = applyActiveUserGrant(
      database<SharedMediaItemRow>('accessGrant')
        .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
        .whereNotNull('accessGrant.mediaItemId')
        .orderBy('accessGrant.createdAt', 'desc')
        .select<SharedMediaItemRow[]>(...accessGrantFieldSelect, ...mediaItemSelectColumns),
      { database, viewerId },
    );
    const mediaRows = await mediaQuery;

    const albumQuery = applyActiveUserGrant(
      database<SharedAlbumRow>('accessGrant')
        .innerJoin('album', 'album.id', 'accessGrant.albumId')
        .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
        .whereNotNull('accessGrant.albumId')
        .orderBy('accessGrant.createdAt', 'desc')
        .select<SharedAlbumRow[]>(...accessGrantFieldSelect, ...albumWithCoverSelectColumns),
      { database, viewerId },
    );
    const albumRows = await albumQuery;

    return { sharedWithMeMediaItems: mediaRows, sharedWithMeAlbums: albumRows };
  },
});
