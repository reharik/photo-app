import type { Knex } from 'knex';

import type { MediaStorage } from '../application/media/MediaStorage.js';
import type { Album } from '../domain/Album/Album.js';
import {
  build__RunInTransaction,
  type RunInTransaction,
} from '../infrastructure/repositories/runInTransaction.js';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository.js';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository.js';
import type { MediaProcessingJobRepository } from '../repositories/MediaProcessingJob/MediaProcessingJobRepository.js';
import type { MediaItemReadRepository } from '../repositories/readRepositories/types.js';
import { build__AddAlbumItem } from '../services/writeServices/album/addAlbumItem.js';
import { build__AddMediaItemsToAlbum } from '../services/writeServices/album/addMediaItemsToAlbum.js';
import { build__CreateAlbum } from '../services/writeServices/album/createAlbum.js';
import { build__CreateMediaItemUpload } from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import { build__FinalizeMediaItemUpload } from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';

export const testTrx = {} as Knex.Transaction;

export const createTestDatabase = (): Knex => {
  const transaction = async <R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> =>
    callback(testTrx);
  return { transaction } as unknown as Knex;
};

export type WriteTestHarness = {
  database: Knex;
  runInTransaction: RunInTransaction;
};

export const createWriteTestHarness = (): WriteTestHarness => {
  const database = createTestDatabase();
  return {
    database,
    runInTransaction: build__RunInTransaction({ database }),
  };
};

export const albumActiveItems = (album: Album) => album.childEntities().items.upsert;

export const createUploadService = (
  harness: WriteTestHarness,
  mediaItemRepository: MediaItemRepository,
  mediaStorage: MediaStorage,
) =>
  build__CreateMediaItemUpload({
    mediaItemRepository,
    mediaStorage,
    database: harness.database,
  });

export const createFinalizeService = (
  harness: WriteTestHarness,
  mediaItemRepository: MediaItemRepository,
  mediaStorage: MediaStorage,
  mediaProcessingJobRepository: MediaProcessingJobRepository,
) =>
  build__FinalizeMediaItemUpload({
    mediaItemRepository,
    mediaStorage,
    mediaProcessingJobRepository,
    database: harness.database,
  });

export const createAlbumService = (harness: WriteTestHarness, albumRepository: AlbumRepository) =>
  build__CreateAlbum({
    albumRepository,
    runInTransaction: harness.runInTransaction,
  });

export const createAddAlbumItemService = (
  harness: WriteTestHarness,
  albumRepository: AlbumRepository,
  mediaItemReadRepository: MediaItemReadRepository,
) =>
  build__AddAlbumItem({
    albumRepository,
    mediaItemReadRepository,
    runInTransaction: harness.runInTransaction,
  });

export const createAddMediaItemsToAlbumService = (
  harness: WriteTestHarness,
  albumRepository: AlbumRepository,
  mediaItemReadRepository: MediaItemReadRepository,
) =>
  build__AddMediaItemsToAlbum({
    albumRepository,
    mediaItemReadRepository,
    runInTransaction: harness.runInTransaction,
  });
