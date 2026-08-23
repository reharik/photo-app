import { ok, OperationResult } from '@packages/contracts';
import { Album } from '../../../domain/Album/Album';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreateAlbumCommand, CreateAlbumResult } from './writeAlbum.types';

export interface CreateAlbum extends WriteServiceBase {
  (input: CreateAlbumCommand): Promise<OperationResult<CreateAlbumResult>>;
}

type CreateAlbumDeps = {
  albumRepository: AlbumRepository;
  viewerId: EntityId;
};

export const build__CreateAlbum = ({ viewerId, albumRepository }: CreateAlbumDeps): CreateAlbum => {
  return async (input: CreateAlbumCommand): Promise<OperationResult<CreateAlbumResult>> => {
    const { title } = input;
    const album = Album.create(
      {
        title,
      },
      viewerId,
    );

    await albumRepository.save(album);

    return ok({
      albumId: album.id(),
    });
  };
};
