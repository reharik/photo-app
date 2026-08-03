import {
  AppErrorCollection,
  ContractError,
  fail,
  ok,
  Operation,
  WriteResult,
} from '@packages/contracts';
import { dedupeIds, Logger } from '@packages/infrastructure';
import { ensureMediaItemOwnedByViewer } from '../../../application';
import {
  loadRequiredAlbum,
  loadRequiredMediaItem,
} from '../../../application/support/resourceLoaders';
import { Album, MediaItem } from '../../../domain';
import { MediaItemRepository } from '../../../repositories';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { ShareContactRepository } from '../../../repositories/domainRepositories/shareContactRepository';
import { UserRepository } from '../../../repositories/domainRepositories/userRepository';
import { CreateUserWriteService } from '../user/createUserWriteService';
import { WriteServiceBase } from '../writeServiceBaseType';
import { GrantUserAuthorizationCommand, GrantUserAuthorizationResult } from './grantTypes';
import { getOrCreateAllUsers, inviteUsers, saveNewShareContacts } from './inviteUsersService';

export interface GrantUserAuthorization extends WriteServiceBase {
  (
    input: GrantUserAuthorizationCommand,
    mediaItems: boolean,
  ): Promise<WriteResult<GrantUserAuthorizationResult>>;
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
): Promise<WriteResult<Album>> => {
  const { viewerId, entityIds } = input;
  const albumId = entityIds[0];

  const getResult = await loadRequiredAlbum(albumId, albumRepository);
  if (!getResult.success) {
    return getResult;
  }
  const album = getResult.value;

  const member = album.getAlbumMember(viewerId);
  if (!member || !member.role().can(Operation.grantAlbumAuthorization)) {
    return fail(Operation.grantAlbumAuthorization.deniedError);
  }

  return ok(album);
};

const validateMediaItemsCreateShadowAlbum = async (
  mediaItemRepository: MediaItemRepository,
  input: GrantUserAuthorizationCommand,
): Promise<WriteResult<Album>> => {
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
  ): Promise<WriteResult<GrantUserAuthorizationResult>> => {
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
    const activeResult = inviteUsers(userResult.value, album, input);

    // ALL-OR-NOTHING GUARD — Until the share UI renders the
    // errors array, a partial active-grant failure is a silent "shared!" lie, so fail the
    // whole op (rolls back uow). Pending failures stay non-fatal (logged above). See RAI-XX.
    if (activeResult.errors.length > 0) {
      logger.warn('partial album grant', {
        failures: activeResult.errors.map((d) => ({
          userId: d.user.id(),
          albumId: album.id(),
          code: d.error.code,
        })),
      });
      return fail(ContractError.PartialShareFailure);
    }

    // only persist contacts for people who actually got a grant
    await saveNewShareContacts(activeResult.invitedUsers, granter, shareContactRepository);
    await albumRepository.save(album);

    return ok({ invitedUsers: activeResult.invitedUsers, errors: activeResult.errors });
  };
};
