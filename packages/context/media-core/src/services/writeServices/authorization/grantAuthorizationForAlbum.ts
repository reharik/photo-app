import { AppErrorCollection, fail, ok, Operation, OperationResult } from '@packages/contracts';
import { dedupeIds, Logger } from '@packages/infrastructure';
import { ensureMediaItemInReadyState, ensureMediaItemOwnedByViewer } from '../../../application';
import {
  loadRequiredAlbum,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { Album, MediaItem, PendingUser, User } from '../../../domain';
import {
  formatFailures,
  IndependentGroupResult,
} from '../../../infrastructure/writeServices/groupActionStrategy';
import { MediaItemRepository } from '../../../repositories';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { CreateUserWriteService } from '../user/createUserWriteService';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand } from './grantTypes';
import {
  getOrCreateAllUsers,
  GrantedAuthorization,
  inviteUsers,
  saveNewShareContacts,
} from './inviteUsersService';

export interface GrantUserAuthorization extends WriteServiceBase {
  (
    input: GrantUserAuthorizationCommand,
    mediaItems: boolean,
  ): Promise<OperationResult<IndependentGroupResult<User | PendingUser, GrantedAuthorization>>>;
}

type GrantUserAuthorizationDeps = {
  albumRepository: AlbumRepository;
  userRepository: UserRepository;
  mediaItemRepository: MediaItemRepository;
  shareContactRepository: ShareContactRepository;
  createUserWriteService: CreateUserWriteService;
  logger: Logger;
};

const validateExistingAlbum = async (
  albumRepository: AlbumRepository,
  input: GrantUserAuthorizationCommand,
): Promise<OperationResult<Album>> => {
  const { viewerId, entityIds } = input;
  const albumId = entityIds[0];

  const getResult = await loadRequiredAlbum(albumId, albumRepository);
  if (!getResult.success) {
    return getResult;
  }
  const album = getResult.value;

  const member = album.getAlbumMemberByUserId(viewerId);
  if (!member || !member.role().can(Operation.grantAlbumAuthorization)) {
    return fail(Operation.grantAlbumAuthorization.deniedError);
  }

  return ok(album);
};

const validateMediaItemsCreateShadowAlbum = async (
  mediaItemRepository: MediaItemRepository,
  input: GrantUserAuthorizationCommand,
): Promise<OperationResult<Album>> => {
  const { viewerId, entityIds, label, viewerFirstName } = input;
  const dedupedIds = dedupeIds(entityIds);

  if (dedupedIds.length === 0) {
    return fail(AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList);
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
    const isReady = ensureMediaItemInReadyState(loaded.value);
    if (!isReady.success) {
      return isReady;
    }
    mediaItems.push(loaded.value);
  }
  const album = Album.create(
    {
      title: label ?? `Photos from ${viewerFirstName}`,
      isShadowAlbum: true,
    },
    input.viewerId,
  );
  mediaItems.forEach((mediaItem) => {
    album.addItem(mediaItem.id(), viewerId, mediaItem.kind());
  });
  return ok(album);
};

export const build__GrantUserAuthorization = ({
  albumRepository,
  userRepository,
  mediaItemRepository,
  shareContactRepository,
  createUserWriteService,
  logger,
}: GrantUserAuthorizationDeps): GrantUserAuthorization => {
  return async (
    input: GrantUserAuthorizationCommand,
    mediaItems: boolean,
  ): Promise<OperationResult<IndependentGroupResult<User | PendingUser, GrantedAuthorization>>> => {
    // setup and validation
    const { viewerId, grantedToHandles } = input;
    const granter = await userRepository.getById(viewerId);
    if (!granter) {
      return fail(AppErrorCollection.user.UserNotFound);
    }
    const isValid = mediaItems
      ? await validateMediaItemsCreateShadowAlbum(mediaItemRepository, input)
      : await validateExistingAlbum(albumRepository, input);

    if (!isValid.success) {
      return isValid;
    }
    const album = isValid.value;
    // invitations
    const userResult = await getOrCreateAllUsers(
      grantedToHandles,
      userRepository,
      createUserWriteService,
      viewerId,
    );
    if (!userResult.success) {
      return userResult;
    }

    // active → album.grantAuthorization emits its own domain events, runs for
    // both pending and active.  In event handler pending users don't get grants.
    // Once they activate the grants will be created.
    const inviteResult = inviteUsers(userResult.value, album, input);
    if (inviteResult.failed.length > 0) {
      logger.warn(formatFailures(inviteResult.failed, 'partial album grant', (x) => x.id()));
    }

    // only persist contacts for people who actually got a grant
    await saveNewShareContacts(
      inviteResult.succeeded.map((x) => x.item),
      granter,
      shareContactRepository,
    );
    await albumRepository.save(album);

    return ok(inviteResult);
  };
};
