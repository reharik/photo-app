import { ContractError } from '@packages/contracts';
import { Knex } from 'knex';
import { ensureMediaItemOwnedByViewer } from '../../../application/support/mediaItemGuard';
import { loadRequiredMediaItem } from '../../../application/support/resourceLoaders';
import { MediaItem } from '../../../domain';
import { fail, ok } from '../../../domain/utilities/writeResponse';
import { RunInTransaction } from '../../../infrastructure/repositories/runInTransaction';
import { MediaItemRepository } from '../../../repositories/domainRepositories/mediaItemRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import {
  UpdateMediaItemDetailsCommand,
  UpdateMediaItemDetailsResult,
} from './writeMediaItem.types';

export interface UpdateMediaItem extends WriteServiceBase {
  (
    input: UpdateMediaItemDetailsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<UpdateMediaItemDetailsResult>>;
}

type UpdateMediaItemDeps = {
  mediaItemRepository: MediaItemRepository;
  runInTransaction: RunInTransaction;
};

export const build__UpdateMediaItem = ({
  mediaItemRepository,
  runInTransaction,
}: UpdateMediaItemDeps): UpdateMediaItem => {
  return async (
    input: UpdateMediaItemDetailsCommand,
    trx?: Knex.Transaction,
  ): Promise<WriteResult<UpdateMediaItemDetailsResult>> => {
    const { viewerId, mediaItemId, takenAt } = input;

    const getResult = await loadRequiredMediaItem(mediaItemId, mediaItemRepository);
    if (!getResult.success) {
      return getResult;
    }
    const mediaItem = getResult.value;

    const ensureResult = ensureMediaItemOwnedByViewer(mediaItem.ownerId(), viewerId);
    if (!ensureResult.success) {
      return ensureResult;
    }

    if (!hasMutation(input, mediaItem)) {
      return fail(ContractError.MediaItemUpdateNoFieldsProvided);
    }

    let takenAtDate: Date | undefined;
    if (takenAt) {
      takenAtDate = input.takenAt instanceof Date ? input.takenAt : new Date(takenAt);
      if (Number.isNaN(takenAtDate.getTime())) {
        return fail(ContractError.InvalidMediaTakenAt);
      }
    }
    const updateResult = mediaItem.updateItemDetails({ ...input, takenAt: takenAtDate }, viewerId);
    if (!updateResult.success) {
      return updateResult;
    }
    await runInTransaction(trx, async (db) => await mediaItemRepository.save(mediaItem, db));

    return ok({
      mediaItemId: mediaItem.id(),
      title: mediaItem.title(),
      description: mediaItem.description(),
      takenAt: mediaItem.takenAt(),
    });
  };
};

export const hasMutation = (command: UpdateMediaItemDetailsCommand, mediaItem: MediaItem) => {
  if (
    command.title !== mediaItem.title() ||
    (command.title === null && mediaItem.title() != undefined)
  ) {
    return true;
  }
  if (
    command.description !== mediaItem.description() ||
    (command.description === null && mediaItem.description() != undefined)
  ) {
    return true;
  }
  if (
    command.takenAt !== mediaItem.takenAt() ||
    (command.takenAt === null && mediaItem.takenAt() != undefined)
  ) {
    return true;
  }
  return false;
};
