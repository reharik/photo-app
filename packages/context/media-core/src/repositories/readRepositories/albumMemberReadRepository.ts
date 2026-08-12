import { AlbumMemberRole } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { AlbumMemberCollectionInfo, PagedList } from '../../services';
import { toPagedResult, withCollectionInfo } from '../queryHelpers';
import type { AlbumMemberReadRepository, AlbumMemberRow, ReadRepositoryDeps } from './types';

export const build__AlbumMemberReadRepository = ({
  database,
}: ReadRepositoryDeps): AlbumMemberReadRepository => ({
  getMemberByUserId: async ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }): Promise<AlbumMemberRow | undefined> => {
    return withEnumRevival(
      database<AlbumMemberRow>('albumMember')
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
      database<AlbumMemberRow>('albumMember')
        .innerJoin('user', 'user.id', 'albumMember.userId')
        .where('albumMember.albumId', albumId)
        .whereExists(
          database
            .select(database.raw('1'))
            .from('albumMember as viewerMember')
            .where('viewerMember.albumId', database.ref('albumMember.albumId'))
            .where('viewerMember.userId', viewerId),
        )
        .modify(withCollectionInfo(database, collectionInfo))
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
});
