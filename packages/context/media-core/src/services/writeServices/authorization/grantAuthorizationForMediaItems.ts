import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { dedupeIds } from '@packages/infrastructure';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import {
  ensureUserExists,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { Authorization } from '../../../domain/Authorization/Authorization';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/types';
import {
  GrantUserAuthorizationForMediaItemsCommand,
  GrantUserAuthorizationResult,
} from '../mediaItem/writeMediaItem.types';
import { WriteServiceBase } from '../writeServiceBaseType';

export interface GrantAuthorizationForMediaItems extends WriteServiceBase {
  (
    input: GrantUserAuthorizationForMediaItemsCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantAuthorizationForMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  runInTransaction: RunInTransaction;
  albumRepository: AlbumRepository;
};

/**
 * Grants the same authorization (single recipient OR single token) across many media items
 * in one database transaction. Any failure rolls back every grant in the batch.
 */
export const build__GrantAuthorizationForMediaItems = ({
  mediaItemRepository,
  userRepository,
  grantRepository,
  shareContactRepository,
  runInTransaction,
  albumRepository,
}: GrantAuthorizationForMediaItemsDeps): GrantAuthorizationForMediaItems => {
  return async (
    input: GrantUserAuthorizationForMediaItemsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    const { viewerId, operations, grantedToHandle, label, expiresAt } = input;
    const dedupedIds = dedupeIds(input.mediaItemIds);

    if (dedupedIds.length === 0) {
      return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
    }

    const granter = await userRepository.getById(viewerId);
    if (!granter) {
      return fail(AppErrorCollection.user.UserNotFound);
    }

    const mediaItems: MediaItem[] = [];
    for (const id of dedupedIds) {
      const loaded = await loadRequiredMediaItem(id, mediaItemRepository);
      if (!loaded.success) {
        return loaded;
      }
      const ownership = ensureMediaItemOwnedByViewer(loaded.value.ownerId(), viewerId);
      if (!ownership.success) {
        return ownership;
      }
      mediaItems.push(loaded.value);
    }

    const ensureUser = await ensureUserExists(grantedToHandle, userRepository);
    if (!ensureUser.success) {
      const album = Album.create(
        {
          title: label ?? 'Public Link Album',
          isPublicLinkAlbum: true,
        },
        input.viewerId,
      );
      mediaItems.forEach((mediaItem) => {
        album.addItem(mediaItem.id(), viewerId, mediaItem.kind());
      });

      const publicLinkResult = album.grantPublicLink(input.viewerId, input.expiresAt);
      if (!publicLinkResult.success) {
        return publicLinkResult;
      }
      const publicLink = publicLinkResult.value;
      await runInTransaction(trx, async (db) => {
        await albumRepository.save(album, db);
      });

      return ok({
        authorizationIds: [publicLink.id()],
        inviteeEmail: grantedToHandle,
        inviterName: granter?.fullName(),
        albumTitle: album.title(),
        tokenOrUserId: publicLink.linkToken(),
        isPublicLink: true,
      });
    }

    const invitee = ensureUser.value;
    const grants: { mediaItem: MediaItem; authorization: Authorization }[] = [];
    for (const mediaItem of mediaItems) {
      const result = mediaItem.grantAuthorization(
        operations,
        viewerId,
        invitee.id(),
        label,
        expiresAt,
      );
      if (!result.success) {
        return result;
      }
      grants.push({ mediaItem, authorization: result.value.authorization });
    }

    await runInTransaction(trx, async (db) => {
      for (const { mediaItem, authorization } of grants) {
        await mediaItemRepository.save(mediaItem, db);

        await grantRepository.createGrant(
          {
            id: crypto.randomUUID(),
            mediaItemId: mediaItem.id(),
            accessGrantId: authorization.id(),
            grantedToUser: invitee.id(),
            operations: authorization.operations(),
            createdAt: new Date(),
          },
          db,
        );
      }

      await shareContactRepository.upsertContact(viewerId, invitee.id(), invitee.handle(), db);
      await shareContactRepository.upsertContact(invitee.id(), viewerId, granter.handle(), db);
    });

    return ok({
      authorizationIds: grants.map((g) => g.authorization.id()),
      inviteeEmail: invitee.email(),
      inviterName: granter?.fullName(),
      albumTitle: '',
      tokenOrUserId: '',
    });
  };
};
