import { AppErrorCollection, fail, ok, WriteResult } from '@packages/contracts';
import { dedupeIds, Logger } from '@packages/infrastructure';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { Authorization } from '../../../domain';
import { Album } from '../../../domain/Album/Album';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { GrantRepository } from '../../../repositories/domainRepositories/grantRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { ShareContactRepository } from '../../../repositories/readRepositories/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import {
  GrantEmailDTO,
  GrantUserAuthorizationCommand,
  GrantUserAuthorizationResult,
  InviteNonUsersResult,
} from './grantTypes';
import { inviteNonUsers, inviteUsersForMediaItems, segregateUsers } from './inviteUsersService';

export interface GrantAuthorizationForMediaItems extends WriteServiceBase {
  (input: GrantUserAuthorizationCommand): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantAuthorizationForMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  userRepository: UserRepository;
  grantRepository: GrantRepository;
  shareContactRepository: ShareContactRepository;
  runInTransaction: RunInTransaction;
  albumRepository: AlbumRepository;
  logger: Logger;
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
  logger,
}: GrantAuthorizationForMediaItemsDeps): GrantAuthorizationForMediaItems => {
  return async (
    input: GrantUserAuthorizationCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    const { viewerId, grantedToHandles, label } = input;
    const dedupedIds = dedupeIds(input.entityIds);

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

    const { existing, nonExisting } = await segregateUsers(grantedToHandles, userRepository);
    let nonExistingResult: InviteNonUsersResult = {
      authorizations: [] as Authorization[],
      emailDTOs: [] as GrantEmailDTO[],
    };

    if (nonExisting.length > 0) {
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
      nonExistingResult = inviteNonUsers(nonExisting, album, input, album.title(), granter);
      if (!nonExistingResult.publicLinkFailure) {
        await runInTransaction(trx, async (db) => {
          await albumRepository.save(album, db);
        });
      }
    }

    const existingResult = inviteUsersForMediaItems(existing, mediaItems, input, granter);
    if (!existingResult.grants.length && !existingResult.addedInvitees.length) {
      return ok({
        authorizations: nonExistingResult.authorizations,
        emailDTOs: [...nonExistingResult.emailDTOs, ...existingResult.emailDTOs],
        errors: existingResult.errors,
        publicLinkFailure: nonExistingResult.publicLinkFailure,
      });
    }

    await runInTransaction(trx, async (db) => {
      for (const { mediaItem, authorization } of existingResult.grants) {
        await mediaItemRepository.save(mediaItem, db);
        await grantRepository.createGrant(
          {
            id: crypto.randomUUID(),
            mediaItemId: mediaItem.id(),
            accessGrantId: authorization.id(),
            grantedToUser: authorization.grantedToUser(),
            operations: authorization.operations(),
            createdAt: new Date(),
          },
          db,
        );
      }
      await Promise.all(
        existingResult.addedInvitees.flatMap((invitee) => [
          shareContactRepository.upsertContact(viewerId, invitee.id(), invitee.handle(), db),
          shareContactRepository.upsertContact(invitee.id(), viewerId, granter.handle(), db),
        ]),
      );
    });

    if (existingResult.errorDetail.length) {
      logger.warn('partial media grant', {
        failures: existingResult.errorDetail.map((d) => ({
          userId: d.user.id(),
          itemId: d.mediaItem.id(),
          code: d.error.code,
        })),
      });
    }

    return ok({
      authorizations: [
        ...nonExistingResult.authorizations,
        ...existingResult.grants.map((g) => g.authorization),
      ],
      emailDTOs: [...nonExistingResult.emailDTOs, ...existingResult.emailDTOs],
      errors: existingResult.errors,
      publicLinkFailure: nonExistingResult.publicLinkFailure,
    });
  };
};
