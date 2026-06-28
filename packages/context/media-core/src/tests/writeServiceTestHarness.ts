import type { Knex } from 'knex';

import type { MediaStorage } from '../application/media/MediaStorage.js';
import type { Album } from '../domain/Album/Album.js';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository.js';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository.js';
import type { MediaProcessingJobRepository } from '../repositories/mediaProcessingJob/mediaProcessingJobRepository.js';
import type { MediaItemReadRepository } from '../repositories/readRepositories/types.js';
import { build__AddAlbumItem } from '../services/writeServices/album/addAlbumItem.js';
import { build__AddMediaItemsToAlbum } from '../services/writeServices/album/addMediaItemsToAlbum.js';
import { build__CreateAlbum } from '../services/writeServices/album/createAlbum.js';
import { build__CreateMediaItemUpload } from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import { build__FinalizeMediaItemUpload } from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';

// Stand-in transaction handle. The write services no longer own a transaction
// primitive (the unit-of-work refactor moved that to the caller), but the
// repository test doubles in these specs still accept an optional `trx`
// argument, so this sentinel is threaded through their `save(...)` calls.
export const testTrx = {} as Knex.Transaction;

export const createTestDatabase = (): Knex => {
  const transaction = async <R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> =>
    callback(testTrx);
  return { transaction } as unknown as Knex;
};

export type WriteTestHarness = {
  database: Knex;
};

export const createWriteTestHarness = (): WriteTestHarness => {
  return {
    database: createTestDatabase(),
  };
};

export const albumActiveItems = (album: Album) => album.childEntities().items.upsert;

const createEmptyAlbumRepository = (): AlbumRepository => ({
  getById: async () => undefined,
  save: async () => {},
  delete: async () => {},
});

// The `_harness` parameter is retained on these builders as a stable seam (it
// carries the fake database / `testTrx`); the services themselves no longer take
// a transaction dependency.
export const createUploadService = (
  _harness: WriteTestHarness,
  mediaItemRepository: MediaItemRepository,
  mediaStorage: MediaStorage,
  albumRepository: AlbumRepository = createEmptyAlbumRepository(),
) =>
  build__CreateMediaItemUpload({
    mediaItemRepository,
    albumRepository,
    mediaStorage,
  });

export const createFinalizeService = (
  _harness: WriteTestHarness,
  mediaItemRepository: MediaItemRepository,
  mediaStorage: MediaStorage,
  mediaProcessingJobRepository: MediaProcessingJobRepository,
) =>
  build__FinalizeMediaItemUpload({
    mediaItemRepository,
    mediaStorage,
    mediaProcessingJobRepository,
  });

export const createAlbumService = (_harness: WriteTestHarness, albumRepository: AlbumRepository) =>
  build__CreateAlbum({
    albumRepository,
  });

export const createAddAlbumItemService = (
  _harness: WriteTestHarness,
  albumRepository: AlbumRepository,
  mediaItemReadRepository: MediaItemReadRepository,
) =>
  build__AddAlbumItem({
    albumRepository,
    mediaItemReadRepository,
  });

export const createAddMediaItemsToAlbumService = (
  _harness: WriteTestHarness,
  albumRepository: AlbumRepository,
  mediaItemReadRepository: MediaItemReadRepository,
) =>
  build__AddMediaItemsToAlbum({
    albumRepository,
    mediaItemReadRepository,
  });
