import { ok, WriteResult } from '@packages/contracts';
import { Album } from '../../../domain/Album/Album';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { CreateAlbumCommand, CreateAlbumResult } from './writeAlbum.types';

export interface CreateAlbum extends WriteServiceBase {
  (input: CreateAlbumCommand): Promise<WriteResult<CreateAlbumResult>>;
}

type CreateAlbumDeps = {
  albumRepository: AlbumRepository;
};

export const build__CreateAlbum = ({ albumRepository }: CreateAlbumDeps): CreateAlbum => {
  return async (input: CreateAlbumCommand): Promise<WriteResult<CreateAlbumResult>> => {
    const { viewerId, title } = input;
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
