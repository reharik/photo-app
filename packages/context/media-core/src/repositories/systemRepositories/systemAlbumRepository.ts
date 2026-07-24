import { Knex } from 'knex';
import { EntityId } from '../../types';
import { withAlbumItemCount } from '../queryHelpers';

export type SystemAlbumRepository = {
  getAlbumTitlesById: (albumIds: EntityId[]) => Promise<AlbumTitle[]>;
};

type SystemAlbumRepositoryDeps = {
  database: Knex;
};

type AlbumTitle = {
  id: EntityId;
  title: string;
  itemCount: number;
};
const AlbumFields = ['id', 'title'];

export const build__SystemAlbumRepository = ({
  database,
}: SystemAlbumRepositoryDeps): SystemAlbumRepository => ({
  getAlbumTitlesById: async (albumIds: EntityId[]) => {
    return database('album')
      .modify(withAlbumItemCount(database))
      .select<AlbumTitle[]>(AlbumFields)
      .whereIn('id', albumIds);
  },
});
