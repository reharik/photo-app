import {
  AlbumMemberRole,
  AppErrorCollection,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import { Readable } from 'node:stream';
import type { MediaStorage } from '../application/media/MediaStorage';
import {
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
} from '../application/media/MediaStorage';
import { Album } from '../domain/Album/Album';
import type { MediaAssetRecord } from '../domain/MediaItem/MediaAsset';
import { MediaItem } from '../domain/MediaItem/MediaItem';
import type { MediaProcessingJobRepository } from '../domain/MediaProcessingJob/MediaProcessingJobRepository';
import type { AlbumRepository } from '../repositories/domainRepositories/albumRepository';
import type { MediaItemRepository } from '../repositories/domainRepositories/mediaItemRepository';
import type { DBMediaItemRow } from '../services/readServices/types';
import { build__AddAlbumItem } from '../services/writeServices/album/addAlbumItem';
import { build__AddMediaItemsToAlbum } from '../services/writeServices/album/addMediaItemsToAlbum';
import { build__CreateAlbum } from '../services/writeServices/album/createAlbum';
import { build__CreateMediaItemUpload } from '../services/writeServices/mediaItem/createMediaItemUpload';
import { build__FinalizeMediaItemUpload } from '../services/writeServices/mediaItem/finalizeMediaItemUpload';
import { EntityId } from '../types/types';
import { TEST_VIEWER_A_ID, TEST_VIEWER_B_ID, TEST_VIEWER_ONLY_ID } from './testViewerIds';

/** 1×1 PNG — used so finalize can read width/height from uploaded bytes. */
const MINIMAL_PNG_1X1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

type ObjectState = { size: number; mimeType?: string; body?: Buffer };

const findAssetRecord = (item: MediaItem, kind: MediaAssetKind): MediaAssetRecord | undefined =>
  item.toPersistence().assets.find((a: MediaAssetRecord) => {
    const k = a.kind as unknown;
    if (typeof k === 'string') {
      return k === kind.value;
    }
    return (k as { value: string }).value === kind.value;
  });

const createNoopMediaProcessingJobRepository = (): MediaProcessingJobRepository => ({
  enqueueIfNoneActive: async () => {},
  claimNextAvailableJob: async () => undefined,
  markSucceeded: async () => {},
  markFailed: async () => {},
});

const createTrackingMediaProcessingJobRepository = (): MediaProcessingJobRepository & {
  enqueued: { mediaItemId: string; actorId: string }[];
} => {
  const enqueued: { mediaItemId: string; actorId: string }[] = [];
  return {
    enqueued,
    enqueueIfNoneActive: async (input) => {
      enqueued.push(input);
    },
    claimNextAvailableJob: async () => undefined,
    markSucceeded: async () => {},
    markFailed: async () => {},
  };
};

const createInMemoryMediaItemRepository = (): MediaItemRepository => {
  const byId = new Map<string, MediaItem>();
  return {
    getById: async (id: string) => byId.get(id),
    save: async (item: MediaItem) => {
      byId.set(item.id(), item);
    },
    delete: async (item: MediaItem) => {
      byId.delete(item.id());
    },
    updateReactionCounts: async () => {},
  };
};

const createInMemoryAlbumRepository = (): AlbumRepository => {
  const byId = new Map<string, Album>();
  return {
    getById: async (id: string) => byId.get(id),
    save: async (album: Album) => {
      byId.set(album.id(), album);
    },
    delete: async (album: Album) => {
      byId.delete(album.id());
    },
  };
};

const createTrackingMediaStorage = (
  serverUrl: string,
): MediaStorage & { objects: Map<string, ObjectState> } => {
  const objects = new Map<string, ObjectState>();
  return {
    objects,
    getUploadTarget: async ({ storageKey, mimeType }) => ({
      method: 'PUT' as const,
      url: `${serverUrl}/presigned?key=${encodeURIComponent(storageKey)}`,
      headers: mimeType ? [{ name: 'Content-Type', value: mimeType }] : [],
    }),
    writeObject: async () => {
      return;
    },
    deleteObject: async (storageKey: string) => {
      objects.delete(storageKey);
    },
    getObjectMetadata: async (storageKey: string) => {
      const o = objects.get(storageKey);
      if (!o) {
        return undefined;
      }
      const size = o.body !== undefined ? o.body.length : o.size;
      return { size, mimeType: o.mimeType };
    },
    verifyExistence: async (storageKey: string) => objects.has(storageKey),
    getObjectAccessUrl: async ({ storageKey }) =>
      `${serverUrl}/api/media/objects/${encodeURIComponent(storageKey)}`,
    getObjectStream: async (storageKey: string) => {
      const object = objects.get(storageKey);
      if (!object) {
        return undefined;
      }
      const buf = object.body ?? Buffer.alloc(object.size);
      return {
        body: Readable.from(buf),
        mimeType: object.mimeType,
      };
    },
    getObjectBuffer: async (storageKey: string, maxBytes: number) => {
      const object = objects.get(storageKey);
      if (!object) {
        return undefined;
      }
      const raw = object.body ?? Buffer.alloc(object.size);
      return raw.subarray(0, Math.min(raw.length, maxBytes));
    },
  };
};

const projectionFromAggregate = (item: MediaItem): DBMediaItemRow => {
  const p = item.toPersistence();
  return {
    id: item.id(),
    ownerId: item.ownerId(),
    kind: item.kind(),
    status: item.status(),
    mimeType: p.mimeType,
    sizeBytes: p.sizeBytes ?? 0,
    width: p.width,
    height: p.height,
    durationSeconds: p.durationSeconds,
    title: p.title ?? '',
    originalFileName: p.originalFileName,
    description: p.description,
    takenAt: p.takenAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    reactionCounts: { total: 0, byEmoji: [] },
  };
};

describe('Media upload pipeline (application services)', () => {
  const viewerA = TEST_VIEWER_A_ID;
  const viewerB = TEST_VIEWER_B_ID;
  const serverUrl = 'http://localhost:3999';

  describe('When createMediaUpload runs', () => {
    it('should persist a pending media item and return upload instructions', async () => {
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaStorage = createTrackingMediaStorage(serverUrl);
      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });

      const result = await createUpload({
        viewerId: viewerA,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
        originalFileName: '  vacation.jpg ',
      });

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }
      expect(result.value.status).toBe(MediaItemStatus.pending);
      expect(result.value.uploadTarget.method).toBe('PUT');
      expect(result.value.uploadTarget.url).toContain('/presigned?');

      const stored = await mediaItemRepository.getById(result.value.mediaItemId);
      expect(stored).toBeDefined();
      expect(stored?.status()).toBe(MediaItemStatus.pending);
      const persisted = stored?.toPersistence();
      expect(persisted?.originalFileName).toBe('vacation.jpg');
      expect(persisted?.title).toBeUndefined();
      expect(findAssetRecord(stored!, MediaAssetKind.original)?.status).toBe(
        MediaAssetStatus.pending.value,
      );
    });
  });

  describe('When bytes are recorded in storage then finalize runs', () => {
    it('should transition the item to processing and return confirmed size and mime type', async () => {
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaStorage = createTrackingMediaStorage(serverUrl);
      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const created = await createUpload({
        viewerId: viewerA,
        kind: MediaKind.photo,
        mimeType: 'image/png',
      });
      expect(created.success).toBe(true);
      if (!created.success) {
        return;
      }
      const item = await mediaItemRepository.getById(created.value.mediaItemId);
      expect(item).toBeDefined();
      if (!item) {
        return;
      }
      const originalAsset = findAssetRecord(item, MediaAssetKind.original);
      expect(originalAsset).toBeDefined();
      if (!originalAsset) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );

      const finalized = await finalize({
        viewerId: viewerA,
        mediaItemId: created.value.mediaItemId,
      });
      expect(finalized.success).toBe(true);
      if (!finalized.success) {
        return;
      }
      expect(finalized.value.status).toBe(MediaItemStatus.processing);
      expect(finalized.value.size).toBe(MINIMAL_PNG_1X1.length);
      expect(finalized.value.mimeType).toBe('image/png');

      const after = await mediaItemRepository.getById(created.value.mediaItemId);
      expect(after?.status()).toBe(MediaItemStatus.processing);
      expect(after?.width()).toBeUndefined();
      expect(after?.height()).toBeUndefined();
      expect(findAssetRecord(after!, MediaAssetKind.original)?.status).toBe(
        MediaAssetStatus.ready.value,
      );
    });

    it('should enqueue a background processing job for photo media', async () => {
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaStorage = createTrackingMediaStorage(serverUrl);
      const jobRepository = createTrackingMediaProcessingJobRepository();
      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: jobRepository,
      });

      const created = await createUpload({
        viewerId: viewerA,
        kind: MediaKind.photo,
        mimeType: 'image/png',
      });
      expect(created.success).toBe(true);
      if (!created.success) {
        return;
      }
      const item = await mediaItemRepository.getById(created.value.mediaItemId);
      expect(item).toBeDefined();
      if (!item) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );

      const finalized = await finalize({
        viewerId: viewerA,
        mediaItemId: created.value.mediaItemId,
      });
      expect(finalized.success).toBe(true);
      expect(jobRepository.enqueued).toEqual([
        { mediaItemId: created.value.mediaItemId, actorId: viewerA },
      ]);
    });
  });

  describe('When finalize runs before any object exists in storage', () => {
    it('should fail and leave the media item pending', async () => {
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaStorage = createTrackingMediaStorage(serverUrl);
      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const created = await createUpload({
        viewerId: viewerA,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(created.success).toBe(true);
      if (!created.success) {
        return;
      }

      const finalized = await finalize({
        viewerId: viewerA,
        mediaItemId: created.value.mediaItemId,
      });
      expect(finalized.success).toBe(false);

      const after = await mediaItemRepository.getById(created.value.mediaItemId);
      expect(after?.status()).toBe(MediaItemStatus.pending);
    });
  });

  describe('When a different viewer tries to finalize another user media', () => {
    it('should fail with not owned by viewer', async () => {
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaStorage = createTrackingMediaStorage(serverUrl);
      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const created = await createUpload({
        viewerId: viewerA,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(created.success).toBe(true);
      if (!created.success) {
        return;
      }
      const item = await mediaItemRepository.getById(created.value.mediaItemId);
      if (!item) {
        return;
      }
      const originalAsset = findAssetRecord(item, MediaAssetKind.original);
      if (!originalAsset) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );

      const finalized = await finalize({
        viewerId: viewerB,
        mediaItemId: created.value.mediaItemId,
      });
      expect(finalized.success).toBe(false);
      let code = '';
      if (!finalized.success) {
        code = finalized.error.code;
      }
      expect(code).toBe(AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer.code);
    });
  });
});

describe('Album integration (application services)', () => {
  const viewerId = TEST_VIEWER_A_ID;

  describe('When createAlbum runs', () => {
    it('should persist a new album and return its id', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const createAlbum = build__CreateAlbum({ albumRepository });
      const result = await createAlbum({ viewerId, title: 'Summer' });
      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }
      const loaded = await albumRepository.getById(result.value.albumId);
      expect(loaded).toBeDefined();
    });
  });

  describe('When addAlbumItem is called for pending media', () => {
    it('should fail with media not ready', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const projectionFromReadRepo = new Map<string, DBMediaItemRow>();

      const createAlbum = build__CreateAlbum({ albumRepository });
      const albumResult = await createAlbum({ viewerId, title: 'Summer' });
      expect(albumResult.success).toBe(true);
      if (!albumResult.success) {
        return;
      }

      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage: createTrackingMediaStorage('http://localhost:0'),
      });
      const mediaResult = await createUpload({
        viewerId,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(mediaResult.success).toBe(true);
      if (!mediaResult.success) {
        return;
      }
      const item = await mediaItemRepository.getById(mediaResult.value.mediaItemId);
      if (!item) {
        return;
      }
      projectionFromReadRepo.set(item.id(), projectionFromAggregate(item));

      const addAlbumItem = build__AddAlbumItem({
        albumRepository,
        mediaItemReadRepository: {
          getForViewer: async ({ mediaItemId }: { mediaItemId: EntityId }) =>
            projectionFromReadRepo.get(mediaItemId),
        } as never,
      });

      const add = await addAlbumItem({
        viewerId,
        albumId: albumResult.value.albumId,
        mediaItemId: item.id(),
      });
      expect(add.success).toBe(false);
      let code = '';
      if (!add.success) {
        code = add.error.code;
      }
      expect(code).toBe(AppErrorCollection.mediaItem.MediaItemNotReady.code);
    });
  });

  describe('When addAlbumItem is called by an album contributor member', () => {
    it('should allow adding the item', async () => {
      const ownerId = TEST_VIEWER_A_ID;
      const viewerOnlyId = TEST_VIEWER_ONLY_ID;
      const albumRepository = createInMemoryAlbumRepository();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const projectionFromReadRepo = new Map<string, DBMediaItemRow>();
      const mediaStorage = createTrackingMediaStorage('http://localhost:0');

      const createAlbum = build__CreateAlbum({ albumRepository });
      const albumResult = await createAlbum({ viewerId: ownerId, title: 'Summer' });
      expect(albumResult.success).toBe(true);
      if (!albumResult.success) {
        return;
      }

      const album = await albumRepository.getById(albumResult.value.albumId);
      if (!album) {
        return;
      }
      const memberResult = album.addMember(viewerOnlyId, AlbumMemberRole.contributor, ownerId);
      expect(memberResult.success).toBe(true);
      await albumRepository.save(album, ownerId);

      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const mediaResult = await createUpload({
        viewerId: viewerOnlyId,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(mediaResult.success).toBe(true);
      if (!mediaResult.success) {
        return;
      }
      const item = await mediaItemRepository.getById(mediaResult.value.mediaItemId);
      if (!item) {
        return;
      }
      const originalAsset = findAssetRecord(item, MediaAssetKind.original);
      if (!originalAsset) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );
      const fin = await finalize({ viewerId: viewerOnlyId, mediaItemId: item.id() });
      expect(fin.success).toBe(true);
      if (!fin.success) {
        return;
      }
      const afterFinalize = await mediaItemRepository.getById(item.id());
      if (!afterFinalize) {
        return;
      }
      const readyMark = afterFinalize.markReadyAfterDerivatives(
        { displayWidth: 1, displayHeight: 1 },
        viewerOnlyId,
      );
      expect(readyMark.success).toBe(true);
      await mediaItemRepository.save(afterFinalize);
      const readyItem = await mediaItemRepository.getById(item.id());
      if (!readyItem) {
        return;
      }
      projectionFromReadRepo.set(readyItem.id(), projectionFromAggregate(readyItem));

      const addAlbumItem = build__AddAlbumItem({
        albumRepository,
        mediaItemReadRepository: {
          // eslint-disable-next-line @typescript-eslint/require-await
          getForViewer: async ({ mediaItemId }: { mediaItemId: EntityId }) =>
            projectionFromReadRepo.get(mediaItemId),
        },
      } as never);

      const add = await addAlbumItem({
        viewerId: viewerOnlyId,
        albumId: albumResult.value.albumId,
        mediaItemId: readyItem.id(),
      });
      expect(add.success).toBe(true);
    });
  });

  describe('When addAlbumItem is called for ready media', () => {
    it('should persist the album item', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const projectionFromReadRepo = new Map<string, DBMediaItemRow>();
      const mediaStorage = createTrackingMediaStorage('http://localhost:0');

      const createAlbum = build__CreateAlbum({ albumRepository });
      const albumResult = await createAlbum({ viewerId, title: 'Summer' });
      expect(albumResult.success).toBe(true);
      if (!albumResult.success) {
        return;
      }

      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const mediaResult = await createUpload({
        viewerId,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(mediaResult.success).toBe(true);
      if (!mediaResult.success) {
        return;
      }
      const item = await mediaItemRepository.getById(mediaResult.value.mediaItemId);
      if (!item) {
        return;
      }
      const originalAsset = findAssetRecord(item, MediaAssetKind.original);
      if (!originalAsset) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );
      const fin = await finalize({ viewerId, mediaItemId: item.id() });
      expect(fin.success).toBe(true);
      if (!fin.success) {
        return;
      }
      const afterFinalize = await mediaItemRepository.getById(item.id());
      if (!afterFinalize) {
        return;
      }
      const readyMark = afterFinalize.markReadyAfterDerivatives(
        { displayWidth: 1, displayHeight: 1 },
        viewerId,
      );
      expect(readyMark.success).toBe(true);
      await mediaItemRepository.save(afterFinalize);
      const readyItem = await mediaItemRepository.getById(item.id());
      if (!readyItem) {
        return;
      }
      projectionFromReadRepo.set(readyItem.id(), projectionFromAggregate(readyItem));

      const addAlbumItem = build__AddAlbumItem({
        albumRepository,
        mediaItemReadRepository: {
          // eslint-disable-next-line @typescript-eslint/require-await
          getForViewer: async ({ mediaItemId }: { mediaItemId: EntityId }) =>
            projectionFromReadRepo.get(mediaItemId),
        } as never,
      });

      const add = await addAlbumItem({
        viewerId,
        albumId: albumResult.value.albumId,
        mediaItemId: readyItem.id(),
      });
      expect(add.success).toBe(true);
      if (!add.success) {
        return;
      }

      const album = await albumRepository.getById(albumResult.value.albumId);
      const persisted = album?.toPersistence();
      expect(persisted?.items?.length).toBe(1);
    });
  });

  describe('When addAlbumItem is called twice for the same media', () => {
    it('should reject the duplicate when the aggregate disallows it', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const projectionFromReadRepo = new Map<string, DBMediaItemRow>();
      const mediaStorage = createTrackingMediaStorage('http://localhost:0');

      const createAlbum = build__CreateAlbum({ albumRepository });
      const albumResult = await createAlbum({ viewerId, title: 'Summer' });
      expect(albumResult.success).toBe(true);
      if (!albumResult.success) {
        return;
      }

      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const mediaResult = await createUpload({
        viewerId,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(mediaResult.success).toBe(true);
      if (!mediaResult.success) {
        return;
      }
      const item = await mediaItemRepository.getById(mediaResult.value.mediaItemId);
      if (!item) {
        return;
      }
      const originalAsset = findAssetRecord(item, MediaAssetKind.original);
      if (!originalAsset) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );
      await finalize({ viewerId, mediaItemId: item.id() });
      const afterFinalize = await mediaItemRepository.getById(item.id());
      if (!afterFinalize) {
        return;
      }
      const readyMark = afterFinalize.markReadyAfterDerivatives(
        { displayWidth: 1, displayHeight: 1 },
        viewerId,
      );
      expect(readyMark.success).toBe(true);
      await mediaItemRepository.save(afterFinalize);
      const readyItem = await mediaItemRepository.getById(item.id());
      if (!readyItem) {
        return;
      }
      projectionFromReadRepo.set(readyItem.id(), projectionFromAggregate(readyItem));

      const addAlbumItem = build__AddAlbumItem({
        albumRepository,
        mediaItemReadRepository: {
          // eslint-disable-next-line @typescript-eslint/require-await
          getForViewer: async ({ mediaItemId }: { mediaItemId: EntityId }) =>
            projectionFromReadRepo.get(mediaItemId),
        } as never,
      });

      const first = await addAlbumItem({
        viewerId,
        albumId: albumResult.value.albumId,
        mediaItemId: readyItem.id(),
      });
      expect(first.success).toBe(true);
      const second = await addAlbumItem({
        viewerId,
        albumId: albumResult.value.albumId,
        mediaItemId: readyItem.id(),
      });
      expect(second.success).toBe(false);
      let code = '';
      if (!second.success) {
        code = second.error.code;
      }
      expect(code).toBe(AppErrorCollection.album.MediaAlreadyInAlbum.code);
    });
  });

  describe('When addMediaItemsToAlbum is called', () => {
    it('should reject when both albumId and newAlbum are provided', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const addMany = build__AddMediaItemsToAlbum({
        albumRepository,
        mediaItemReadRepository: { getForViewer: async () => undefined } as never,
      });

      const result = await addMany({
        viewerId,
        mediaItemIds: ['a'],
        albumId: 'x',
        newAlbum: { title: 'N' },
      });
      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }
      expect(result.error.code).toBe(AppErrorCollection.album.AddMediaToAlbumInvalidTarget.code);
    });

    it('should reject when neither albumId nor newAlbum is provided', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const addMany = build__AddMediaItemsToAlbum({
        albumRepository,
        mediaItemReadRepository: { getForViewer: async () => undefined } as never,
      });

      const result = await addMany({
        viewerId,
        mediaItemIds: ['a'],
      });
      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }
      expect(result.error.code).toBe(AppErrorCollection.album.AddMediaToAlbumInvalidTarget.code);
    });

    it('should reject an empty list after deduplication', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const addMany = build__AddMediaItemsToAlbum({
        albumRepository,
        mediaItemReadRepository: { getForViewer: async () => undefined } as never,
      });

      const result = await addMany({
        viewerId,
        mediaItemIds: [],
        newAlbum: { title: 'No items' },
      });
      expect(result.success).toBe(false);
      if (result.success) {
        return;
      }
      expect(result.error.code).toBe(AppErrorCollection.album.AddMediaToAlbumEmptyMediaList.code);
    });

    it('should create a new album and add two items in a single save', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const projectionFromReadRepo = new Map<string, DBMediaItemRow>();
      const mediaStorage = createTrackingMediaStorage('http://localhost:0');

      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const addMany = build__AddMediaItemsToAlbum({
        albumRepository,
        mediaItemReadRepository: {
          // eslint-disable-next-line @typescript-eslint/require-await
          getForViewer: async ({ mediaItemId }: { mediaItemId: EntityId }) =>
            projectionFromReadRepo.get(mediaItemId),
          getManyForViewer: async ({
            mediaItemIds,
          }: {
            mediaItemIds: EntityId[];
            viewerId: EntityId;
          }) =>
            mediaItemIds
              .map((id) => projectionFromReadRepo.get(id))
              .filter((r): r is DBMediaItemRow => r != null),
        } as never,
      });

      const ids: string[] = [];
      for (let i = 0; i < 2; i += 1) {
        const mediaResult = await createUpload({
          viewerId,
          kind: MediaKind.photo,
          mimeType: 'image/jpeg',
        });
        expect(mediaResult.success).toBe(true);
        if (!mediaResult.success) {
          return;
        }
        const item = await mediaItemRepository.getById(mediaResult.value.mediaItemId);
        if (!item) {
          return;
        }
        const originalAsset = findAssetRecord(item, MediaAssetKind.original);
        if (!originalAsset) {
          return;
        }
        mediaStorage.objects.set(
          buildMediaAssetStorageKey(
            buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
            MediaAssetKind.original,
          ),
          {
            size: MINIMAL_PNG_1X1.length,
            mimeType: 'image/png',
            body: MINIMAL_PNG_1X1,
          },
        );
        const fin = await finalize({ viewerId, mediaItemId: item.id() });
        expect(fin.success).toBe(true);
        if (!fin.success) {
          return;
        }
        const afterFin = await mediaItemRepository.getById(item.id());
        if (!afterFin) {
          return;
        }
        const rm = afterFin.markReadyAfterDerivatives(
          { displayWidth: 1, displayHeight: 1 },
          viewerId,
        );
        expect(rm.success).toBe(true);
        await mediaItemRepository.save(afterFin);
        const readyItem = await mediaItemRepository.getById(item.id());
        if (!readyItem) {
          return;
        }
        projectionFromReadRepo.set(readyItem.id(), projectionFromAggregate(readyItem));
        ids.push(readyItem.id());
      }

      const batch = await addMany({
        viewerId,
        mediaItemIds: ids,
        newAlbum: { title: 'Batch new' },
      });
      expect(batch.success).toBe(true);
      if (!batch.success) {
        return;
      }
      expect(batch.value.albumItemIds).toHaveLength(2);

      const reloaded = await albumRepository.getById(batch.value.albumId);
      expect(reloaded).toBeDefined();
      if (!reloaded) {
        return;
      }
      expect(reloaded.toPersistence().items).toHaveLength(2);
    });

    it('should add a single item when the same id appears twice in the input', async () => {
      const albumRepository = createInMemoryAlbumRepository();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const projectionFromReadRepo = new Map<string, DBMediaItemRow>();
      const mediaStorage = createTrackingMediaStorage('http://localhost:0');

      const createAlbum = build__CreateAlbum({ albumRepository });
      const albumResult = await createAlbum({ viewerId, title: 'Summer' });
      expect(albumResult.success).toBe(true);
      if (!albumResult.success) {
        return;
      }

      const createUpload = build__CreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      });
      const finalize = build__FinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository: createNoopMediaProcessingJobRepository(),
      });

      const mediaResult = await createUpload({
        viewerId,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(mediaResult.success).toBe(true);
      if (!mediaResult.success) {
        return;
      }
      const item = await mediaItemRepository.getById(mediaResult.value.mediaItemId);
      if (!item) {
        return;
      }
      const originalAsset = findAssetRecord(item, MediaAssetKind.original);
      if (!originalAsset) {
        return;
      }
      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: MINIMAL_PNG_1X1.length,
          mimeType: 'image/png',
          body: MINIMAL_PNG_1X1,
        },
      );
      const fin = await finalize({ viewerId, mediaItemId: item.id() });
      expect(fin.success).toBe(true);
      if (!fin.success) {
        return;
      }
      const afterFin = await mediaItemRepository.getById(item.id());
      if (!afterFin) {
        return;
      }
      const rm = afterFin.markReadyAfterDerivatives(
        { displayWidth: 1, displayHeight: 1 },
        viewerId,
      );
      expect(rm.success).toBe(true);
      await mediaItemRepository.save(afterFin);
      const readyItem = await mediaItemRepository.getById(item.id());
      if (!readyItem) {
        return;
      }
      projectionFromReadRepo.set(readyItem.id(), projectionFromAggregate(readyItem));

      const addMany = build__AddMediaItemsToAlbum({
        albumRepository,
        mediaItemReadRepository: {
          // eslint-disable-next-line @typescript-eslint/require-await
          getForViewer: async ({ mediaItemId }: { mediaItemId: EntityId }) =>
            projectionFromReadRepo.get(mediaItemId),
          getManyForViewer: async ({
            mediaItemIds,
          }: {
            mediaItemIds: EntityId[];
            viewerId: EntityId;
          }) =>
            mediaItemIds
              .map((id) => projectionFromReadRepo.get(id))
              .filter((r): r is DBMediaItemRow => r != null),
        } as never,
      });

      const result = await addMany({
        viewerId,
        mediaItemIds: [readyItem.id(), readyItem.id()],
        albumId: albumResult.value.albumId,
      });
      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }
      expect(result.value.albumItemIds).toHaveLength(1);
      const album = await albumRepository.getById(albumResult.value.albumId);
      expect(album?.toPersistence().items).toHaveLength(1);
    });
  });
});
