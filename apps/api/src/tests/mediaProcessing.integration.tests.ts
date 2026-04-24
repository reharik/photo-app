import { MediaAssetKind, MediaAssetStatus, MediaItemStatus, MediaKind } from '@packages/contracts';
import { Readable } from 'node:stream';

import type {
  MediaItemRepository,
  MediaProcessingJobRepository,
  MediaProcessingJobRow,
} from '@packages/media-core';
import {
  buildCreateMediaItemUpload,
  buildFinalizeMediaItemUpload,
  buildMediaAssetStorageKey,
  buildMediaItemBaseStorageKey,
  MediaItem,
  MediaProcessingJobStatus,
  type MediaStorage,
} from '@packages/media-core';
import type { MediaAssetRecord } from '../../../../packages/context/media-core/src/domain/MediaItem/MediaAsset';
import { buildProcessNextMediaImageJob } from '../../../media-worker/src/application/processNextMediaImageJob';

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

const createTrackingMediaStorage = (): MediaStorage & { objects: Map<string, ObjectState> } => {
  const objects = new Map<string, ObjectState>();
  return {
    objects,
    getUploadTarget: async ({ storageKey, mimeType }) => ({
      method: 'PUT' as const,
      url: `https://test.invalid/upload/${encodeURIComponent(storageKey)}`,
      headers: mimeType ? [{ name: 'Content-Type', value: mimeType }] : [],
    }),
    writeObject: async ({ storageKey, body, mimeType }) => {
      let buffer: Buffer;
      if (Buffer.isBuffer(body)) {
        buffer = body;
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of body) {
          if (Buffer.isBuffer(chunk)) chunks.push(chunk);
          else if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
          else chunks.push(Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      }
      objects.set(storageKey, { size: buffer.length, mimeType, body: buffer });
    },
    deleteObject: async (storageKey) => {
      objects.delete(storageKey);
    },
    getObjectMetadata: async (storageKey) => {
      const object = objects.get(storageKey);
      if (!object) {
        return undefined;
      }
      return { size: object.body?.length ?? object.size, mimeType: object.mimeType };
    },
    verifyExistence: async (storageKey) => objects.has(storageKey),
    getObjectAccessUrl: async ({ storageKey }) =>
      `https://test.invalid/object/${encodeURIComponent(storageKey)}`,
    getObjectStream: async (storageKey) => {
      const object = objects.get(storageKey);
      if (!object?.body) {
        return undefined;
      }
      return {
        body: Readable.from(object.body),
        mimeType: object.mimeType,
      };
    },
    getObjectBuffer: async (storageKey, maxBytes) => {
      const object = objects.get(storageKey);
      if (!object?.body) {
        return undefined;
      }
      return object.body.subarray(0, Math.min(maxBytes, object.body.length));
    },
  };
};

const createInMemoryMediaItemRepository = (): MediaItemRepository => {
  const byId = new Map<string, MediaItem>();
  return {
    getById: async (id) => byId.get(id),
    save: async (mediaItem) => {
      byId.set(mediaItem.id(), mediaItem);
    },
    delete: async (mediaItem) => {
      byId.delete(mediaItem.id());
    },
  };
};

const createInMemoryMediaProcessingJobRepository = (): MediaProcessingJobRepository & {
  jobs: MediaProcessingJobRow[];
} => {
  const jobs: MediaProcessingJobRow[] = [];
  return {
    jobs,
    enqueueIfNoneActive: async ({ mediaItemId, actorId }) => {
      const existing = jobs.find(
        (j) =>
          j.mediaItemId === mediaItemId &&
          (j.status === MediaProcessingJobStatus.pending ||
            j.status === MediaProcessingJobStatus.processing),
      );
      if (existing) {
        return;
      }
      const now = new Date();
      jobs.push({
        id: crypto.randomUUID(),
        mediaItemId,
        status: MediaProcessingJobStatus.pending,
        attemptCount: 0,
        availableAt: now,
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
      });
    },
    claimNextAvailableJob: async () => {
      const now = Date.now();
      const next = jobs
        .filter(
          (job) =>
            job.status === MediaProcessingJobStatus.pending && job.availableAt.getTime() <= now,
        )
        .sort((a, b) => a.availableAt.getTime() - b.availableAt.getTime())[0];
      if (!next) {
        return undefined;
      }
      next.status = MediaProcessingJobStatus.processing;
      next.attemptCount += 1;
      next.startedAt = new Date();
      next.updatedAt = new Date();
      return { ...next };
    },
    markSucceeded: async (jobId, actorId) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      job.status = MediaProcessingJobStatus.succeeded;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.updatedBy = actorId;
      job.lastError = undefined;
    },
    markFailed: async (jobId, actorId, lastError) => {
      const job = jobs.find((j) => j.id === jobId);
      if (!job) return;
      job.status = MediaProcessingJobStatus.failed;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      job.updatedBy = actorId;
      job.lastError = lastError;
    },
  };
};

describe('Media processing pipeline', () => {
  describe('When a pending media processing job is claimed and processed', () => {
    it('should create display + thumbnail assets and mark media item ready', async () => {
      const viewerId = 'viewer-a';
      const mediaStorage = createTrackingMediaStorage();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaProcessingJobRepository = createInMemoryMediaProcessingJobRepository();

      const createUpload = buildCreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      } as never);
      const finalize = buildFinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository,
      } as never);
      const processNextMediaImageJob = buildProcessNextMediaImageJob({
        config: { s3Bucket: 'integration-test-bucket' },
        mediaItemRepository,
        mediaProcessingJobRepository,
        mediaStorage,
        logger: { error: () => {}, info: () => {} },
      } as never);

      const created = await createUpload({
        viewerId,
        kind: MediaKind.photo,
        mimeType: 'image/png',
      });
      expect(created.success).toBe(true);
      if (!created.success) return;

      const item = await mediaItemRepository.getById(created.value.mediaItemId);
      expect(item).toBeDefined();
      if (!item) return;

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
        viewerId,
        mediaItemId: item.id(),
      });
      expect(finalized.success).toBe(true);
      expect(mediaProcessingJobRepository.jobs).toHaveLength(1);
      expect(mediaProcessingJobRepository.jobs[0]?.status).toBe(MediaProcessingJobStatus.pending);

      const processed = await processNextMediaImageJob();
      expect(processed).toBe('processed');
      const idle = await processNextMediaImageJob();
      expect(idle).toBe('idle');

      const ready = await mediaItemRepository.getById(item.id());
      expect(ready?.status()).toBe(MediaItemStatus.ready);

      const display = findAssetRecord(ready!, MediaAssetKind.display);
      const thumbnail = findAssetRecord(ready!, MediaAssetKind.thumbnail);
      expect(display).toBeDefined();
      expect(thumbnail).toBeDefined();
      expect(display?.status).toBe(MediaAssetStatus.ready.value);
      expect(thumbnail?.status).toBe(MediaAssetStatus.ready.value);

      const displayObject = mediaStorage.objects.get(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.display,
        ),
      );
      const thumbnailObject = mediaStorage.objects.get(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.thumbnail,
        ),
      );
      expect(displayObject?.size).toBeGreaterThan(0);
      expect(thumbnailObject?.size).toBeGreaterThan(0);
      expect(mediaProcessingJobRepository.jobs[0]?.status).toBe(MediaProcessingJobStatus.succeeded);
      expect(mediaProcessingJobRepository.jobs[0]?.attemptCount).toBe(1);
    });
  });

  describe('When processing fails for a claimed job', () => {
    it('should mark the job failed and keep media item uploaded', async () => {
      const viewerId = 'viewer-a';
      const mediaStorage = createTrackingMediaStorage();
      const mediaItemRepository = createInMemoryMediaItemRepository();
      const mediaProcessingJobRepository = createInMemoryMediaProcessingJobRepository();

      const createUpload = buildCreateMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
      } as never);
      const finalize = buildFinalizeMediaItemUpload({
        mediaItemRepository,
        mediaStorage,
        mediaProcessingJobRepository,
      } as never);
      const processNextMediaImageJob = buildProcessNextMediaImageJob({
        config: { s3Bucket: 'integration-test-bucket' },
        mediaItemRepository,
        mediaProcessingJobRepository,
        mediaStorage,
        logger: { error: () => {}, info: () => {} },
      } as never);

      const created = await createUpload({
        viewerId,
        kind: MediaKind.photo,
        mimeType: 'image/jpeg',
      });
      expect(created.success).toBe(true);
      if (!created.success) return;

      const item = await mediaItemRepository.getById(created.value.mediaItemId);
      expect(item).toBeDefined();
      if (!item) return;

      mediaStorage.objects.set(
        buildMediaAssetStorageKey(
          buildMediaItemBaseStorageKey(item.ownerId(), item.id()),
          MediaAssetKind.original,
        ),
        {
          size: 15,
          mimeType: 'image/jpeg',
          body: Buffer.from('not-a-real-image'),
        },
      );

      const finalized = await finalize({
        viewerId,
        mediaItemId: item.id(),
      });
      expect(finalized.success).toBe(true);

      await processNextMediaImageJob();

      const after = await mediaItemRepository.getById(item.id());
      expect(after?.status()).toBe(MediaItemStatus.processing);
      expect(mediaProcessingJobRepository.jobs[0]?.status).toBe(MediaProcessingJobStatus.failed);
      expect(mediaProcessingJobRepository.jobs[0]?.lastError).toBeTruthy();
      expect(mediaProcessingJobRepository.jobs[0]?.attemptCount).toBe(1);
    });
  });
});
