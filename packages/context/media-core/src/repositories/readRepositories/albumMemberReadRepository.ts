import { AlbumMemberRole } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';

type AlbumMemberRow = {
  id: string;
  role: AlbumMemberRole;
};

export type AlbumMemberReadRepository = {
  getMemberByUserId: ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }) => Promise<AlbumMemberRow | undefined>;
};

type AlbumMemberReadRepositoryDeps = { database: Knex };

export const build__AlbumMemberReadRepository = ({
  database,
}: AlbumMemberReadRepositoryDeps): AlbumMemberReadRepository => ({
  getMemberByUserId: async ({
    albumId,
    viewerId,
  }: {
    albumId: string;
    viewerId: string;
  }): Promise<AlbumMemberRow | undefined> => {
    return withEnumRevival(
      database<AlbumMemberRow>('albumMember')
        .where({ albumId: albumId, userId: viewerId })
        .first<AlbumMemberRow>(),
      {
        viewerMemberRole: AlbumMemberRole,
      },
      { strict: true },
    );
  },
});
