import { ok, OperationResult } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { EntityId } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type CreatePublicLinkForAlbumCommand = {
  albumId: EntityId;
  name?: string;
  expiresAt?: Date;
};

export type CreatePublicLinkResponse = {
  token: string;
};

export interface CreatePublicLinkForAlbum extends WriteServiceBase {
  (input: CreatePublicLinkForAlbumCommand): Promise<OperationResult<CreatePublicLinkResponse>>;
}

type CreatePublicLinkForAlbumDeps = {
  viewerId: EntityId;
  albumRepository: AlbumRepository;
};

export const build__CreatePublicLinkForAlbum = ({
  albumRepository,
  viewerId,
}: CreatePublicLinkForAlbumDeps): CreatePublicLinkForAlbum => {
  return async (
    input: CreatePublicLinkForAlbumCommand,
  ): Promise<OperationResult<CreatePublicLinkResponse>> => {
    const loadedAlbum = await loadRequiredAlbum(input.albumId, albumRepository);
    if (!loadedAlbum.success) {
      return loadedAlbum;
    }
    const album = loadedAlbum.value;

    const publicLinkResult = album.grantPublicLink({
      actorId: viewerId,
    });
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    const publicLink = publicLinkResult.value;

    await albumRepository.save(album);
    return ok({ token: publicLink.linkToken() });
  };
};
