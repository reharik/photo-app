import { AlbumMemberRole, AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { EntityId } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';

export type CreatePublicLinkForAlbumCommand = {
  viewerId: EntityId;
  albumId: EntityId;
  name?: string;
  expiresAt?: Date;
};

export type CreatePublicLinkResponse = {
  token: string;
};

export interface CreatePublicLinkForAlbum extends WriteServiceBase {
  (input: CreatePublicLinkForAlbumCommand): Promise<WriteResult<CreatePublicLinkResponse>>;
}

type CreatePublicLinkForAlbumDeps = {
  albumRepository: AlbumRepository;
};

export const build__CreatePublicLinkForAlbum = ({
  albumRepository,
}: CreatePublicLinkForAlbumDeps): CreatePublicLinkForAlbum => {
  return async (
    input: CreatePublicLinkForAlbumCommand,
  ): Promise<WriteResult<CreatePublicLinkResponse>> => {
    const loadedAlbum = await loadRequiredAlbum(input.albumId, albumRepository);
    if (!loadedAlbum.success) {
      return loadedAlbum;
    }
    const album = loadedAlbum.value;
    const member = album.getAlbumMember(input.viewerId);
    if (!member || !member.role().equals(AlbumMemberRole.owner)) {
      return fail(AppErrorCollection.album.NotAllowedToGrantAuthorizationForAlbum);
    }

    const publicLinkResult = album.grantPublicLink(input.viewerId, input.expiresAt);
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    const publicLink = publicLinkResult.value;

    await albumRepository.save(album);
    return ok({ token: publicLink.linkToken() });
  };
};
