import { AppErrorCollection, fail, ok, UserStatus, WriteResult } from '@packages/contracts';
import { dedupeIds, indexBy, Logger } from '@packages/infrastructure';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { Album } from '../../../domain/Album/Album';
import { MediaItem } from '../../../domain/MediaItem/MediaItem';
import { User } from '../../../domain/User/User';
import { UnitOfWork } from '../../../infrastructure';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand, GrantUserAuthorizationResult } from './grantTypes';
import {
  getOrCreateAllUsers,
  inviteUsers,
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
    const users = await getOrCreateAllUsers(grantedToHandles, userRepository, input.viewerId);
    const pendingUsers = users.filter((x) => x.userStatus().equals(UserStatus.pending));
    const existingUsers = users.filter((x) => x.userStatus().equals(UserStatus.active)) as User[];

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
      const pendingUserInviteResults = inviteUsers(pendingUsers, album, input);
      await saveNewShareContacts(
        pendingUserInviteResults.invitedUsers,
        granter,
        shareContactRepository,
      );

      await albumRepository.save(album);
    }

    const existingResult = inviteUsersForMediaItems(existingUsers, mediaItems, input);
    // if nothing happened in inviteUsers then we're done, return
    if (existingResult.authorizations.length === 0) {
      return ok({
        invitedUsers: pendingUsers,
        errors: existingResult.errors,
      });
    }

    const existingUserMap = indexBy(existingUsers, (x) => x.id());
    const mediaItemMap = indexBy(mediaItems, (x) => x.id());

    // --- media items: throw on a miss instead of `!` ---
    const mediaItemPromises = existingResult.authorizations.flatMap((authz) => {
      const mediaItemId = authz.mediaItemId();
      if (!mediaItemId) return [];
      const item = mediaItemMap.get(mediaItemId);
      if (!item) throw new Error(`No media item ${mediaItemId} for authorization ${authz.id()}`);
      return [mediaItemRepository.save(item)];
    });
    await Promise.all(mediaItemPromises);

    uow.collectEvents(existingResult.serviceEvents);

    // --- resolve the invitee for each user-authorization, ONCE ---
    const invitees = existingResult.authorizations.flatMap((authz) => {
      const userId = authz.grantedToUser();
      if (!userId) return []; // public-link auth — expected, skip
      const invitee = existingUserMap.get(userId);
      if (!invitee) {
        throw new Error(`No resolved user ${userId} for authorization ${authz.id()}`);
      }
      return [invitee]; // User[], no nulls, no `!`
    });

    await saveNewShareContacts(invitees, granter, shareContactRepository);

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
      invitedUsers: users,
      errors: existingResult.errors,
    });
  };
};
