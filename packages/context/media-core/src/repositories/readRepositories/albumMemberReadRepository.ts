import { AlbumMemberRole } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { AlbumMemberReadRepository, AlbumMemberRow, ReadRepositoryDeps } from './types';

export const build__AlbumMemberReadRepository = ({
  database,
}: ReadRepositoryDeps): AlbumMemberReadRepository => ({
  getMemberByUserId: async (
    //   {
    //   albumId,
    //   viewerId,
    // }: {
    //   albumId: string;
    //   viewerId: string;
    // }
  ): Promise<AlbumMemberRow | undefined> => {
    return withEnumRevival(
      database<AlbumMemberRow>('albumMember')
        // .where({ albumId: albumId, userId: viewerId })
        .first<AlbumMemberRow>(),
      {
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
  },
});
