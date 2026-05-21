import { AlbumMemberRole, AppErrorCollection } from '@packages/contracts';
import crypto from 'crypto';
import { Knex } from 'knex';
import { hashToken } from '../../../application';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import {
  GrantRecord,
  GrantRepository,
} from '../../../repositories/domainRepositories/grantRepository';
import { EntityId, WriteResult } from '../../../types/types';
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
  database: Knex;
  grantRepository: GrantRepository;
};

export const build__CreatePublicLinkForAlbum = ({
  albumRepository,
  database,
  grantRepository,
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
    if (!member || member.role() !== AlbumMemberRole.owner) {
      return fail(AppErrorCollection.album.NotAllowedToGrantAuthorizationForAlbum);
    }
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    console.log('[CREATE] token:', JSON.stringify(token));
    console.log('[CREATE] hash:', tokenHash);

    const publicLinkResult = album.grantPublicLink(input.viewerId, tokenHash, input.expiresAt);
    if (!publicLinkResult.success) {
      return publicLinkResult;
    }
    const publicLink = publicLinkResult.value;
    const authorization = publicLink.authorization();

    const authorizationId = authorization.id();
    const mediaItemIds = album.getMediaItemIds();

    // this is outside of the AR because grants are a side-effect projection maintained by the write services.
    await database.transaction(async (trx) => {
      await albumRepository.save(album, input.viewerId, { trx });

      const now = new Date();
      const grants: GrantRecord[] = mediaItemIds.map((x) => {
        return {
          id: crypto.randomUUID(),
          mediaItemId: x,
          accessGrantId: authorizationId,
          operations: authorization.operations(),
          createdAt: now,
        };
      });
      await grantRepository.createGrants(grants, { trx });
    });
    // TODO: create share_link row with hashed token, create album-level access_grant, and wire grant table population.
    return ok({ token });
  };
};
