import { AlbumMemberRole, EntityId } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { AlbumMemberCollectionInfo, PagedList } from '../../services';
import { toPagedResult, withCollectionInfo } from '../queryHelpers';
import type { AlbumMemberReadRepository, AlbumMemberRow, ReadRepositoryDeps } from './types';

export const build__AlbumMemberReadRepository = ({
  uow,
}: ReadRepositoryDeps): AlbumMemberReadRepository => ({
  getMemberByUserId: async ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }): Promise<AlbumMemberRow | undefined> => {
    return withEnumRevival(
      uow
        .db()<AlbumMemberRow>('albumMember')
        .where('albumId', albumId)
        .where('userId', viewerId)
        .first<AlbumMemberRow>(),
      {
        role: AlbumMemberRole,
      },
      { strict: true },
    );
  },
  getAlbumMembersForAlbum: async ({
    albumId,
    viewerId,
    collectionInfo,
  }: {
    albumId: string;
    viewerId: string;
    collectionInfo: AlbumMemberCollectionInfo;
  }): Promise<PagedList<AlbumMemberRow>> => {
    const rows = await withEnumRevival(
      uow
        .db()<AlbumMemberRow>('albumMember')
        .innerJoin('user', 'user.id', 'albumMember.userId')
        .where('albumMember.albumId', albumId)
        .whereExists(
          uow
            .db()
            .select(uow.db().raw('1'))
            .from('albumMember as viewerMember')
            .where('viewerMember.albumId', uow.db().ref('albumMember.albumId'))
            .where('viewerMember.userId', viewerId),
        )
        .modify(withCollectionInfo(uow.db(), collectionInfo))
        .select<(AlbumMemberRow & { totalCount: number })[]>([
          'albumMember.id',
          'albumMember.userId',
          'albumMember.role',
          'user.firstName',
          'user.lastName',
          'user.email',
          'albumMember.createdAt',
          'albumMember.updatedAt',
        ]),
      {
        role: AlbumMemberRole,
      },
    );
    return toPagedResult(rows);
  },
  hasMembershipRoleForMediaItem: async (
    mediaItemId: EntityId,
    viewerId: EntityId,
  ): Promise<{ role: AlbumMemberRole } | undefined> => {
    return withEnumRevival(
      uow
        .db()('albumItem')
        .join('albumMember', 'albumMember.albumId', 'albumItem.albumId')
        .where('albumItem.mediaItemId', mediaItemId)
        .where('albumMember.userId', viewerId)
        .first<{ role: AlbumMemberRole }>('role'),
      { role: AlbumMemberRole },
    );
  },

  hasMembershipRoleForMediaItems: async (
    mediaItemIds: EntityId[],
    viewerId: EntityId,
  ): Promise<{ mediaItemId: EntityId; role: AlbumMemberRole }[]> => {
    return withEnumRevival(
      uow
        .db()('albumItem as ai')
        .join('albumMember as am', 'am.albumId', 'ai.albumId')
        .whereIn('ai.mediaItemId', mediaItemIds)
        .where('am.userId', viewerId)
        .select<{ mediaItemId: EntityId; role: AlbumMemberRole }[]>(
          'ai.mediaItemId as mediaItemId',
          'am.role as role',
        ),
      { role: AlbumMemberRole },
    );
  },
});
