import type { Knex } from 'knex';

import type { MediaStorage } from '../application/media/MediaStorage.js';
import type { Album } from '../domain/Album/Album.js';
import type { UnitOfWork } from '../infrastructure/repositories/unitOfWork.js';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository.js';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository.js';
import type { MediaProcessingJobRepository } from '../repositories/mediaProcessingJob/mediaProcessingJobRepository.js';
import type { MediaItemReadRepository } from '../repositories/readRepositories/types.js';
import { build__AddAlbumItem } from '../services/writeServices/album/addAlbumItem.js';
import { build__AddMediaItemsToAlbum } from '../services/writeServices/album/addMediaItemsToAlbum.js';
import { build__CreateAlbum } from '../services/writeServices/album/createAlbum.js';
import type {
  AddAlbumItemCommand,
  AddMediaItemsToAlbumCommand,
  CreateAlbumCommand,
} from '../services/writeServices/album/writeAlbum.types.js';
import { build__CreateMediaItemUpload } from '../services/writeServices/mediaItem/createMediaItemUpload.js';
import { build__FinalizeMediaItemUpload } from '../services/writeServices/mediaItem/finalizeMediaItemUpload.js';
import type {
  CreateMediaUploadCommand,
  FinalizeMediaItemUploadCommand,
} from '../services/writeServices/mediaItem/writeMediaItem.types.js';
import type { EntityId } from '../types/types.js';

// Stand-in transaction handle. The write services no longer own a transaction
// primitive (the unit-of-work refactor moved that to the caller), but the
// repository test doubles in these specs still accept an optional `trx`
// argument, so this sentinel is threaded through their `save(...)` calls.
export const testTrx = {} as Knex.Transaction;

// Stand-in unit of work for services that pass their uow through to repo methods
// (e.g. finalize's transactional job enqueue). db() hands back the same sentinel.
export const testUow = { db: () => testTrx } as unknown as UnitOfWork;

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
//
// `viewerId` moved from the command argument to a scoped IoC dependency, so the
// factory has to be called once per viewer rather than once per test. Each
// builder therefore returns a caller that peels `viewerId` off the invocation
// and constructs the service bound to it — the acting viewer stays at the call
// site (where each test's intent lives) instead of being fixed when the double
// is wired up, which is what lets one test drive two different viewers.
type WithViewer<TCommand> = TCommand & { viewerId: EntityId };

export const createUploadService =
  (
    _harness: WriteTestHarness,
    mediaItemRepository: MediaItemRepository,
    mediaStorage: MediaStorage,
    albumRepository: AlbumRepository = createEmptyAlbumRepository(),
  ) =>
  ({ viewerId, ...input }: WithViewer<CreateMediaUploadCommand>) =>
    build__CreateMediaItemUpload({
      mediaItemRepository,
      albumRepository,
      mediaStorage,
      viewerId,
    })(input);

export const createFinalizeService =
  (
    _harness: WriteTestHarness,
    mediaItemRepository: MediaItemRepository,
    mediaStorage: MediaStorage,
    mediaProcessingJobRepository: MediaProcessingJobRepository,
  ) =>
  ({ viewerId, ...input }: WithViewer<FinalizeMediaItemUploadCommand>) =>
    build__FinalizeMediaItemUpload({
      mediaItemRepository,
      mediaStorage,
      mediaProcessingJobRepository,
      uow: testUow,
      viewerId,
    })(input);

export const createAlbumService =
  (_harness: WriteTestHarness, albumRepository: AlbumRepository) =>
  ({ viewerId, ...input }: WithViewer<CreateAlbumCommand>) =>
    build__CreateAlbum({
      albumRepository,
      viewerId,
    })(input);

export const createAddAlbumItemService =
  (
    _harness: WriteTestHarness,
    albumRepository: AlbumRepository,
    mediaItemReadRepository: MediaItemReadRepository,
  ) =>
  ({ viewerId, ...input }: WithViewer<AddAlbumItemCommand>) =>
    build__AddAlbumItem({
      albumRepository,
      mediaItemReadRepository,
      viewerId,
    })(input);

export const createAddMediaItemsToAlbumService =
  (
    _harness: WriteTestHarness,
    albumRepository: AlbumRepository,
    mediaItemReadRepository: MediaItemReadRepository,
  ) =>
  ({ viewerId, ...input }: WithViewer<AddMediaItemsToAlbumCommand>) =>
    build__AddMediaItemsToAlbum({
      albumRepository,
      mediaItemReadRepository,
      viewerId,
    })(input);
