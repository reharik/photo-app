import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { DBMediaItemRow, MediaItemCollectionInfo } from '../../services/readServices/types';
import { EntityId } from '../../types/types';

export type MediaItemReadRepository = {
  /** Loads by id only (no ownership filter). Used for authz after access rules are applied. */
  getByIdForAuthorization: ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }) => Promise<DBMediaItemRow | undefined>;
  getForViewer: ({
    mediaItemId,
    viewerId,
  }: {
    mediaItemId: EntityId;
    viewerId: EntityId;
  }) => Promise<DBMediaItemRow | undefined>;
  getManyForViewer: ({
    mediaItemIds,
    viewerId,
  }: {
    mediaItemIds: EntityId[];
    viewerId: EntityId;
  }) => Promise<DBMediaItemRow[]>;
  listForViewer(args: {
    viewerId: EntityId;
    collectionInfo: MediaItemCollectionInfo;
  }): Promise<DBMediaItemRow[]>;
  listTagsForMediaItemIds: (args: { mediaItemIds: EntityId[] }) => Promise<Map<EntityId, string[]>>;
};

type MediaItemReadRepositoryDeps = { database: Knex };

const DBmediaItemRowFields = [
  'media_item.id',
  'media_item.owner_id',
  'media_item.kind',
  'media_item.status',
  'media_item.mime_type',
  'media_item.size_bytes',
  'media_item.original_file_name',
  'media_item.width',
  'media_item.height',
  'media_item.duration_seconds',
  'media_item.title',
  'media_item.description',
  'media_item.taken_at',
  'media_item.created_at',
  'media_item.updated_at',
  'media_item.created_by',
  'media_item.updated_by',
  'media_item.reaction_counts',
];

export const build__MediaItemReadRepository = ({
  database,
}: MediaItemReadRepositoryDeps): MediaItemReadRepository => ({
  getByIdForAuthorization: async ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }): Promise<DBMediaItemRow | undefined> => {
    const row = await database<DBMediaItemRow>('mediaItem')
      .where({ id: mediaItemId })
      .first<DBMediaItemRow>(...DBmediaItemRowFields);

    return row;
  },
  getForViewer: async ({
    mediaItemId,
    viewerId,
  }: {
    mediaItemId: EntityId;
    viewerId: EntityId;
  }): Promise<DBMediaItemRow | undefined> => {
    const mediaItem = await withEnumRevival(
      database<DBMediaItemRow>('mediaItem')
        .where('id', mediaItemId)
        .first<DBMediaItemRow>(...DBmediaItemRowFields),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
      { strict: true },
    );

    if (!mediaItem) return undefined;
    if (mediaItem.ownerId === viewerId) return mediaItem;

    const hasGrant = await database<boolean>('grant')
      .where('mediaItemId', mediaItemId)
      .where('grantedToUser', viewerId)
      .first();

    return hasGrant ? mediaItem : undefined;
  },
  getManyForViewer: async ({
    mediaItemIds,
    viewerId,
  }: {
    mediaItemIds: EntityId[];
    viewerId: EntityId;
  }): Promise<DBMediaItemRow[]> => {
    const rows = await withEnumRevival(
      database<DBMediaItemRow>('mediaItem')
        .whereIn('id', mediaItemIds)
        .andWhere('ownerId', viewerId)
        .select<DBMediaItemRow[]>(...DBmediaItemRowFields),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
      { strict: true },
    );

    return rows;
  },
  listForViewer: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: MediaItemCollectionInfo;
  }): Promise<DBMediaItemRow[]> => {
    const rows = await withEnumRevival(
      database<DBMediaItemRow>('mediaItem')
        .where({ ownerId: viewerId })
        .andWhere('status', MediaItemStatus.ready.value)
        .orderBy(collectionInfo.sortBy.column, collectionInfo.sortDir.value)
        .orderBy('id', 'asc') // tie-breaker
        .select<DBMediaItemRow[]>(...DBmediaItemRowFields)
        .limit(collectionInfo.pageInfo.limit + 1)
        .offset(collectionInfo.pageInfo.offset),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
      { strict: true },
    );
    return rows;
  },
  listTagsForMediaItemIds: async ({
    mediaItemIds,
  }: {
    mediaItemIds: EntityId[];
  }): Promise<Map<EntityId, string[]>> => {
    const result = new Map<EntityId, string[]>();
    if (mediaItemIds.length === 0) {
      return result;
    }

    const rows = await database('media_item_tag')
      .join('mediaItem', 'mediaItemTag.mediaItemId', 'mediaItem.id')
      .join('userTag', 'mediaItemTag.userTagId', 'userTag.id')
      .whereIn('mediaItemTag.mediaItemId', mediaItemIds)
      .select<
        { mediaItemId: EntityId; label: string }[]
      >('mediaItemTag.mediaItemId', 'userTag.label')
      .orderBy('mediaItemTag.mediaItemId', 'asc')
      .orderBy('userTag.label', 'asc');

    for (const id of mediaItemIds) {
      result.set(id, []);
    }
    for (const row of rows) {
      const list = result.get(row.mediaItemId);
      if (list) {
        list.push(row.label);
      }
    }
    return result;
  },
});
