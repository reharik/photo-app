import { UnitOfWork } from '../../infrastructure';
import { EntityId } from '../../types';
import { withAlbumItemCount } from '../queryHelpers';

export type SystemAlbumRepository = {
  getAlbumTitlesById: (albumIds: EntityId[]) => Promise<AlbumTitle[]>;
};

type SystemAlbumRepositoryDeps = {
  uow: UnitOfWork;
};

type AlbumTitle = {
  id: EntityId;
  title: string;
  itemCount: number;
};
const AlbumFields = ['id', 'title'];

export const build__SystemAlbumRepository = ({
  uow,
}: SystemAlbumRepositoryDeps): SystemAlbumRepository => ({
  getAlbumTitlesById: async (albumIds: EntityId[]) => {
    await uow.join();
    return uow
      .db()('album')
      .modify(withAlbumItemCount(uow.db()))
      .select<AlbumTitle[]>(AlbumFields)
      .whereIn('id', albumIds);
  },
});
