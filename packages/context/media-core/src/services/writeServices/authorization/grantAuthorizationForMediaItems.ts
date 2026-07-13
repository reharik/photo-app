import { AppErrorCollection, ContractError, fail, ok, WriteResult } from '@packages/contracts';
import { dedupeIds, indexBy, Logger } from '@packages/infrastructure';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { PendingUser, PublicLinkSharedWithUser } from '../../../domain';
import { Album } from '../../../domain/Album/Album';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { UnitOfWork } from '../../../infrastructure';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { CreateUserWriteService } from '../user/createUserWriteService';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand, GrantUserAuthorizationResult } from './grantTypes';
import {
  getOrCreateAllUsers,
  invitePendingUsers,
  inviteUsersForMediaItems,
  saveNewShareContacts,
} from './inviteUsersService';

export interface GrantAuthorizationForMediaItems extends WriteServiceBase {
  (input: GrantUserAuthorizationCommand): Promise<WriteResult<GrantUserAuthorizationResult>>;
}

type GrantAuthorizationForMediaItemsDeps = {
  mediaItemRepository: MediaItemRepository;
  userRepository: UserRepository;
  shareContactRepository: ShareContactRepository;
  albumRepository: AlbumRepository;
  createUserWriteService: CreateUserWriteService;
  logger: Logger;
  uow: UnitOfWork;
};

/**
 * Grants the same authorization (single recipient OR single token) across many media items
 * in one database transaction. Any failure rolls back every grant in the batch.
 */
export const build__GrantAuthorizationForMediaItems = ({
  mediaItemRepository,
  userRepository,
  shareContactRepository,
  albumRepository,
  createUserWriteService,
  logger,
  uow,
}: GrantAuthorizationForMediaItemsDeps): GrantAuthorizationForMediaItems => {
  return async (
    input: GrantUserAuthorizationCommand,
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
    // setup and validation
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

    // invitations
    const userResult = await getOrCreateAllUsers(
      grantedToHandles,
      userRepository,
      createUserWriteService,
      input.viewerId,
    );
    if (!userResult.success) {
      return userResult;
    }
    const users = userResult.value;
    const pendingUsers = users.filter((u): u is PendingUser => u.kind === 'pending');
    let pendingUserServiceEvents: PublicLinkSharedWithUser[] = [];
    if (pendingUsers.length > 0) {
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
      const pendingUserInviteResult = invitePendingUsers(pendingUsers, album, input, logger);
      if (!pendingUserInviteResult.success) {
        logger.warn('PendingUser mediaItem invite failed', {
          failures: pendingUsers.map((d) => ({
            userId: d.id(),
            itemIds: mediaItems.map((x) => x.id()),
            error: pendingUserInviteResult.error,
          })),
        });
      } else {
        await albumRepository.save(album);
        pendingUserServiceEvents = pendingUserInviteResult.value;
      }
    }

    const mediaItemInviteResult = inviteUsersForMediaItems(users, mediaItems, input, logger);

    const userMap = indexBy(users, (x) => x.id());
    const mediaItemMap = indexBy(mediaItems, (x) => x.id());

    // --- media items: throw on a miss instead of `!` ---
    const mediaItemPromises = mediaItemInviteResult.authorizations.flatMap((authz) => {
      const mediaItemId = authz.mediaItemId();
      if (!mediaItemId) return [];
      const item = mediaItemMap.get(mediaItemId);
      if (!item) throw new Error(`No media item ${mediaItemId} for authorization ${authz.id()}`);
      return [mediaItemRepository.save(item)];
    });
    await Promise.all(mediaItemPromises);

    uow.collectEvents([...mediaItemInviteResult.serviceEvents, ...pendingUserServiceEvents]);

    // --- resolve the invitee for each user-authorization, ONCE ---
    const invitees = mediaItemInviteResult.authorizations.flatMap((authz) => {
      const userId = authz.grantedToUser();
      if (!userId) return []; // public-link auth — expected, skip
      const invitee = userMap.get(userId);
      if (!invitee) {
        throw new Error(`No resolved user ${userId} for authorization ${authz.id()}`);
      }
      return [invitee]; // User[], no nulls, no `!`
    });

    await saveNewShareContacts(invitees, granter, shareContactRepository);

    if (mediaItemInviteResult.errorDetail.length) {
      logger.warn('partial media grant', {
        failures: mediaItemInviteResult.errorDetail.map((d) => ({
          userId: d.user.id(),
          itemId: d.mediaItem.id(),
          code: d.error.code,
        })),
      });
    }

    // ALL-OR-NOTHING GUARD — remove when client surfaces partial `errors` to the user.
    // Until the share UI renders the errors array, a partial failure is a silent
    // lie ("shared!" when it wasn't), so we fail the whole op. See RAI-XX.
    if (mediaItemInviteResult.errors.length > 0) {
      return fail(ContractError.PartialShareFailure); // rolls back uow
    }

    return ok({ invitedUsers: invitees, errors: mediaItemInviteResult.errors });
  };
};
