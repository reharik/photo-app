import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemAlbumRepository = {
  getAlbumTitlesById: (albumIds: EntityId[]) => Promise<AlbumTitle[]>;
};

type SystemAlbumRepositoryDeps = {
  database: Knex;
};

type AlbumTitle = {
  id: EntityId;
  title: string;
};
const AlbumFields = ['id', 'title'];

export const build__SystemAlbumRepository = ({
  database,
}: SystemAlbumRepositoryDeps): SystemAlbumRepository => ({
  getAlbumTitlesById: async (albumIds: EntityId[]) => {
    return database('album').select<AlbumTitle[]>(AlbumFields).whereIn('id', albumIds);
  },
});
