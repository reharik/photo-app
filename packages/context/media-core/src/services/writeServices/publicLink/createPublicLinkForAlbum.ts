import { AlbumMemberRole, AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { Knex } from 'knex';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
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
  (
    input: CreatePublicLinkForAlbumCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<CreatePublicLinkResponse>>;
}

type CreatePublicLinkForAlbumDeps = {
  albumRepository: AlbumRepository;
  runInTransaction: RunInTransaction;
};

export const build__CreatePublicLinkForAlbum = ({
  albumRepository,
  runInTransaction,
}: CreatePublicLinkForAlbumDeps): CreatePublicLinkForAlbum => {
  return async (
    input: CreatePublicLinkForAlbumCommand,
    trx?: Knex.Transaction,
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

    await runInTransaction(trx, async (db) => {
      await albumRepository.save(album, db);
    });
    return ok({ token: publicLink.linkToken() });
  };
};
