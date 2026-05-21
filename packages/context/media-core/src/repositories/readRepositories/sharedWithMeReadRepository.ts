import { AlbumMemberRole, MediaItemStatus, MediaKind } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type {
  ReadRepositoryDeps,
  SharedAlbumRow,
  SharedWithMedMediaItemRow,
  SharedWithMeReadRepository,
} from './types';

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
  'mediaItem.reactionCounts as mediaItemReactionCounts',
];

const albumWithCoverSelectColumns = [
  'album.id as albumId',
  'album.title as albumTitle',
  'album.createdAt as albumCreatedAt',
  'album.updatedAt as albumUpdatedAt',
  'albumMember.role as viewerMemberRole',
  ...mediaItemSelectColumns,
];

const accessGrantFieldSelect = [
  'accessGrant.id as id',
  'accessGrant.createdAt as sharedAt',
  'accessGrant.grantedBy as sharedBy',
];

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

export const build__SharedWithMeReadRepository = ({
  database,
}: ReadRepositoryDeps): SharedWithMeReadRepository => ({
  getMediaItemsSharedWithMe: async (viewerId: string): Promise<SharedWithMedMediaItemRow[]> => {
    return applyActiveUserGrant(
      withEnumRevival(
        database('accessGrant')
          .innerJoin('mediaItem', 'mediaItem.id', 'accessGrant.mediaItemId')
          .whereNotNull('accessGrant.mediaItemId')
          .orderBy('accessGrant.createdAt', 'desc')
          .select<SharedWithMedMediaItemRow[]>(
            ...accessGrantFieldSelect,
            ...mediaItemSelectColumns,
          ),
        { mediaItemKind: MediaKind, mediaItemStatus: MediaItemStatus },
        { strict: true },
      ),
      { database, viewerId },
    );
  },
  getAlbumsSharedWithMe: async (viewerId: string) => {
    return applyActiveUserGrant(
      withEnumRevival(
        database<SharedAlbumRow>('accessGrant')
          .innerJoin('album', 'album.id', 'accessGrant.albumId')
          .leftJoin('albumMember', (join) => {
            join
              .on('albumMember.albumId', 'album.id')
              .on('albumMember.userId', database.raw('?', [viewerId]));
          })
          .leftJoin('mediaItem', 'mediaItem.id', 'album.coverMediaId')
          .whereNotNull('accessGrant.albumId')
          .andWhere('album.isPublicLinkAlbum', false)
          .orderBy('accessGrant.createdAt', 'desc')
          .select<SharedAlbumRow[]>(...accessGrantFieldSelect, ...albumWithCoverSelectColumns),
        {
          mediaItemKind: MediaKind,
          mediaItemStatus: MediaItemStatus,
          viewerMemberRole: AlbumMemberRole,
        },
        { strict: true },
      ),
      { database, viewerId },
    );
  },
});
