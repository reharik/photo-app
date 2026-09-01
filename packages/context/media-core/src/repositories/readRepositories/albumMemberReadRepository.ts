import { AlbumMemberRole } from '@packages/contracts';
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
    await uow.join();
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
    await uow.join();
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
});
