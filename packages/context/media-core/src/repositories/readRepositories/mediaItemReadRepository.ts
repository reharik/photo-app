import { EntityId, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import {
  DBMediaItemRow,
  MediaItemCollectionInfo,
  PagedList,
} from '../../services/readServices/types';
import { toPagedResult } from '../queryHelpers';
import type { MediaItemReadRepository, MediaItemTagRow, ReadRepositoryDeps } from './types';

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
  'media_item.taken_at_utc_offset_minutes',
];

export const build__MediaItemReadRepository = ({
  uow,
}: ReadRepositoryDeps): MediaItemReadRepository => ({
  getByIdForAuthorization: async ({
    mediaItemId,
  }: {
    mediaItemId: EntityId;
  }): Promise<DBMediaItemRow | undefined> => {
    const row = await uow
      .db()<DBMediaItemRow>('mediaItem')
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
      uow
        .db()<DBMediaItemRow>('mediaItem')
        .where('id', mediaItemId)
        .first<DBMediaItemRow>(...DBmediaItemRowFields),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
    );

    if (!mediaItem) return undefined;
    if (mediaItem.ownerId === viewerId) return mediaItem;

    const hasGrant = await uow
      .db()('grant')
      .where('mediaItemId', mediaItemId)
      .where('grantedToUser', viewerId)
      .first<{ id: string }>('id');

    if (hasGrant) return mediaItem;

    const hasMembership = await uow
      .db()('albumItem')
      .join('albumMember', 'albumMember.albumId', 'albumItem.albumId')
      .where('albumItem.mediaItemId', mediaItemId)
      .where('albumMember.userId', viewerId)
      .first<{ id: string }>('albumMember.id');

    return hasMembership ? mediaItem : undefined;
  },
  getManyForViewer: async ({
    mediaItemIds,
    viewerId,
  }: {
    mediaItemIds: EntityId[];
    viewerId: EntityId;
  }): Promise<DBMediaItemRow[]> => {
    const rows = await withEnumRevival(
      uow
        .db()<DBMediaItemRow>('mediaItem')
        .whereIn('id', mediaItemIds)
        .andWhere('ownerId', viewerId)
        .select<DBMediaItemRow[]>(...DBmediaItemRowFields),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
    );

    return rows;
  },
  listForViewer: async ({
    viewerId,
    collectionInfo,
  }: {
    viewerId: EntityId;
    collectionInfo: MediaItemCollectionInfo;
  }): Promise<PagedList<DBMediaItemRow>> => {
    const rows = (await withEnumRevival(
      uow
        .db()('mediaItem')
        .where({ ownerId: viewerId })
        .andWhere('status', MediaItemStatus.ready.value)
        .orderBy(
          `${collectionInfo.sortBy.table}.${collectionInfo.sortBy.column}`,
          collectionInfo.sortDir.value,
          collectionInfo.sortBy.nulls,
        )
        .orderBy('mediaItem.id', 'asc') // tie-breaker
        .select<(DBMediaItemRow & { totalCount: number })[]>(...DBmediaItemRowFields)
        .select(uow.db().raw('COUNT(*) OVER ()::int AS "totalCount"'))
        .limit(collectionInfo.pageInfo.limit)
        .offset(collectionInfo.pageInfo.offset),
      {
        kind: MediaKind,
        status: MediaItemStatus,
      },
    )) as (DBMediaItemRow & { totalCount: number })[];
    return toPagedResult(rows);
  },
  listTagsForMediaItemIds: async ({
    mediaItemIds,
  }: {
    mediaItemIds: EntityId[];
  }): Promise<MediaItemTagRow[]> => {
    if (mediaItemIds.length === 0) {
      return [];
    }

    return uow
      .db()('media_item_tag')
      .join('mediaItem', 'mediaItemTag.mediaItemId', 'mediaItem.id')
      .join('userTag', 'mediaItemTag.userTagId', 'userTag.id')
      .whereIn('mediaItemTag.mediaItemId', mediaItemIds)
      .select<MediaItemTagRow[]>('mediaItemTag.mediaItemId', 'userTag.label')
      .orderBy('mediaItemTag.mediaItemId', 'asc')
      .orderBy('userTag.label', 'asc');
  },
});
