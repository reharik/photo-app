import { ok, OperationResult } from '@packages/contracts';
import { Logger } from '@packages/infrastructure';
import { PendingUser } from '../../../domain';
import { AlbumRepository, UserRepository } from '../../../repositories';
import { ActorId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';

type ActivateProps = { firstName: string; lastName: string; phone?: string; passwordHash: string };

export interface ActivatePendingUserWriteService extends WriteServiceBase {
  (input: ActivateProps, user: PendingUser, actorId: ActorId): Promise<OperationResult<void>>;
}

type ActivatePendingUserWriteServiceDeps = {
  logger: Logger;
  albumRepository: AlbumRepository;
  userRepository: UserRepository;
};

export const build__ActivatePendingUserWriteService =
  ({
    albumRepository,
    userRepository,
  }: ActivatePendingUserWriteServiceDeps): ActivatePendingUserWriteService =>
  async (
    activateInput: ActivateProps,
    user: PendingUser,
    actorId: ActorId,
  ): Promise<OperationResult<void>> => {
    const userResult = user.activate(activateInput, actorId);
    if (!userResult.success) {
      return userResult;
    }
    await userRepository.save(user);

    // this gets the albums, throws if there's an system error and
    // throws if the album doesn't exist because that indicates data corruption
    // quite ugly but it's gonna be ugly one way or the other
    const albumRefs = await Promise.all(
      user.authorizationRefs().map(async (ref) => {
        const album = await albumRepository.getById(ref.albumId).catch((cause) => {
          throw new Error(`Failed loading album ${ref.albumId} during activation`, { cause });
        });
        if (!album) throw new Error(`No album found with id: ${ref.albumId}`);
        return { ref, album };
      }),
    );

    for (const { album, ref } of albumRefs) {
      const result = album.activatePendingUserAuthorization(ref.authorizationId, user.id());
      if (!result.success) {
        return result;
      }
    }
    await Promise.all(albumRefs.map((x) => albumRepository.save(x.album)));

    return ok(undefined);
  };
