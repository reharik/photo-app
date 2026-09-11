import { describe, expect, it } from '@jest/globals';
import type { ActorId, EntityId } from '@packages/contracts';
import {
  AppErrorCollection,
  ContractError,
  MediaAssetKind,
  MediaAssetStatus,
  MediaItemStatus,
  MediaKind,
} from '@packages/contracts';
import type { MediaAssetRecord } from '../domain/MediaItem/MediaAsset';
import { MediaItem } from '../domain/MediaItem/MediaItem';

const OWNER_ID: ActorId = '11111111-1111-4111-8111-111111111111';
const MEDIA_ITEM_ID: EntityId = '33333333-3333-4333-8333-333333333333';

/**
 * `applyProcessingResults` is now the SOLE writer of every media_asset row in
 * the system — the API creates none. These cases moved here from
 * media-core's `albumAndMediaItem.domain.tests.ts` when asset ownership moved,
 * and run against the aggregate that actually implements the method.
 *
 * PROCESSING is reached by rehydrating, not by a transition: the pending →
 * PROCESSING move (`completeUploadedWithMetadata`) is the API's and is not on
 * worker-core's `MediaItem` at all.
 */
const processingItem = (assets: MediaAssetRecord[] = []): MediaItem =>
  MediaItem.rehydrate(
    {
      id: MEDIA_ITEM_ID,
      ownerId: OWNER_ID,
      kind: MediaKind.photo,
      status: MediaItemStatus.processing,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: OWNER_ID,
      updatedBy: OWNER_ID,
    },
    { assets },
  );

const pipelineResult = ({
  display = { width: 1, height: 1 },
  original = { width: 2400, height: 1600, mimeType: 'image/png', sizeBytes: 8192 },
}: {
  display?: { width: number; height: number };
  original?: { width: number; height: number; mimeType: string; sizeBytes: number };
} = {}) => ({
  capture: {},
  displayAsset: {
    kind: MediaAssetKind.display,
    mimeType: 'image/jpeg',
    sizeBytes: 2048,
    width: display.width,
    height: display.height,
  },
  thumbnailAsset: {
    kind: MediaAssetKind.thumbnail,
    mimeType: 'image/jpeg',
    sizeBytes: 512,
    width: 200,
    height: 200,
  },
  originalAsset: {
    kind: MediaAssetKind.original,
    mimeType: original.mimeType,
    sizeBytes: original.sizeBytes,
    width: original.width,
    height: original.height,
  },
});

/** The rows the aggregate would persist for its assets, keyed by kind. */
const persistedAssetsByKind = (item: MediaItem): Record<string, Record<string, unknown>> =>
  Object.fromEntries(
    item
      .childEntities()
      .assets.upsert.map((a) => a.toPersistence())
      .map((row) => [row.kind as string, row]),
  );

describe('MediaItem.applyProcessingResults (worker-core)', () => {
  describe('When called from processing with display dimensions', () => {
    it('should transition to ready and set width and height from the display derivative', () => {
      const item = processingItem();

      const result = item.applyProcessingResults(
        pipelineResult({ display: { width: 1200, height: 800 } }),
        OWNER_ID,
      );

      expect(result.success).toBe(true);
      const persisted = item.toPersistence();
      expect(persisted.status).toBe(MediaItemStatus.ready.value);
      // Item dimensions track the DISPLAY derivative, not the original.
      expect(persisted.width).toBe(1200);
      expect(persisted.height).toBe(800);
    });
  });

  describe('When the item is not awaiting derivatives', () => {
    it('should fail with media item not processing', () => {
      const item = MediaItem.create({ kind: MediaKind.photo }, OWNER_ID);

      const result = item.applyProcessingResults(pipelineResult(), OWNER_ID);

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.mediaItem.MediaItemNotProcessing.code,
        }),
      });
    });
  });

  describe('When called again after the item is already ready', () => {
    it('should fail with media item not processing', () => {
      const item = processingItem();
      const first = item.applyProcessingResults(
        pipelineResult({ display: { width: 10, height: 10 } }),
        OWNER_ID,
      );
      expect(first.success).toBe(true);

      const second = item.applyProcessingResults(
        pipelineResult({ display: { width: 20, height: 20 } }),
        OWNER_ID,
      );

      // The status guard runs first, so a replay is rejected for the status —
      // not for the three assets the first apply added.
      expect(second).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.mediaItem.MediaItemNotProcessing.code,
        }),
      });
    });
  });

  describe('When the display derivative has no usable dimensions', () => {
    it('should reject rather than persist a zero-sized item', () => {
      const item = processingItem();

      const result = item.applyProcessingResults(
        pipelineResult({ display: { width: 0, height: 0 } }),
        OWNER_ID,
      );

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({ code: ContractError.InvalidMediaDimensions.code }),
      });
      // A rejected apply must leave the item untouched — still PROCESSING, and
      // still carrying no assets for a retry to write.
      expect(item.toPersistence().status).toBe(MediaItemStatus.processing.value);
      expect(item.childEntities().assets.upsert).toEqual([]);
    });
  });

  describe('When a successful apply writes the asset rows', () => {
    it('should create all three — original, display and thumbnail — in one go', () => {
      const item = processingItem();

      const result = item.applyProcessingResults(pipelineResult(), OWNER_ID);

      expect(result.success).toBe(true);
      const assets = persistedAssetsByKind(item);
      // All three, or the item is READY with derivatives S3 has but the DB does not.
      expect(Object.keys(assets).sort()).toEqual(
        [
          MediaAssetKind.original.value,
          MediaAssetKind.display.value,
          MediaAssetKind.thumbnail.value,
        ].sort(),
      );
      expect(item.childEntities().assets.upsert).toHaveLength(3);
    });

    it('should record the ORIGINAL row from the pipeline original, not from the display derivative', () => {
      const item = processingItem();

      item.applyProcessingResults(
        pipelineResult({
          display: { width: 1600, height: 1200 },
          original: { width: 4032, height: 3024, mimeType: 'image/png', sizeBytes: 9_000_000 },
        }),
        OWNER_ID,
      );

      const original = persistedAssetsByKind(item)[MediaAssetKind.original.value];
      // The original's own bytes and mime — the failure this pins is an original
      // row that silently inherits the JPEG derivative's metadata.
      expect(original.mimeType).toBe('image/png');
      expect(original.width).toBe(4032);
      expect(original.height).toBe(3024);
      expect(original.fileSizeBytes).toBe(9_000_000);
      expect(original.mediaItemId).toBe(MEDIA_ITEM_ID);
    });

    it('should mark every asset READY — a PENDING row means bytes that never landed', () => {
      const item = processingItem();

      item.applyProcessingResults(pipelineResult(), OWNER_ID);

      const assets = persistedAssetsByKind(item);
      for (const kind of [
        MediaAssetKind.original,
        MediaAssetKind.display,
        MediaAssetKind.thumbnail,
      ]) {
        expect(assets[kind.value].status).toBe(MediaAssetStatus.ready.value);
      }
    });
  });

  describe('When the item already carries an asset row', () => {
    it('should refuse rather than add a second row for the same kind', () => {
      // The pre-existing-data case: an item uploaded through the OLD API, which
      // inserted the original's row itself, arrives here with one asset.
      const existingOriginal: MediaAssetRecord = {
        id: '55555555-5555-4555-8555-555555555555',
        mediaItemId: MEDIA_ITEM_ID,
        kind: MediaAssetKind.original,
        mimeType: 'image/jpeg',
        status: MediaAssetStatus.pending,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: OWNER_ID,
        updatedBy: OWNER_ID,
      };
      const item = processingItem([existingOriginal]);

      const result = item.applyProcessingResults(pipelineResult(), OWNER_ID);

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: AppErrorCollection.mediaItem.AssetKindAlreadyExists.code,
        }),
      });
      expect(item.toPersistence().status).toBe(MediaItemStatus.processing.value);
      // Still just the one it arrived with — no duplicate insert to violate the
      // unique index on (media_item_id, kind).
      expect(item.childEntities().assets.upsert).toHaveLength(1);
    });
  });

  describe('When the pipeline recovered a capture time', () => {
    it('should adopt it, since the item had none', () => {
      const item = processingItem();
      const takenAtUtc = new Date('2024-07-04T18:30:00.000Z');

      item.applyProcessingResults(
        { ...pipelineResult(), capture: { takenAtUtc, takenAtUtcOffsetMinutes: -300 } },
        OWNER_ID,
      );

      const persisted = item.toPersistence();
      expect(persisted.takenAt).toBe(takenAtUtc.toISOString());
      expect(persisted.takenAtUtcOffsetMinutes).toBe(-300);
    });
  });
});

describe('MediaItem.markProcessingFailed (worker-core)', () => {
  describe('When a processing item fails', () => {
    it('should move it to FAILED so the upload stops hanging', () => {
      const item = processingItem();

      const result = item.markProcessingFailed(OWNER_ID);

      expect(result.success).toBe(true);
      expect(item.toPersistence().status).toBe(MediaItemStatus.failed.value);
    });
  });

  describe('When the item is already FAILED', () => {
    it('should be idempotent rather than error, so a retry sweep is safe', () => {
      const item = processingItem();
      item.markProcessingFailed(OWNER_ID);

      const again = item.markProcessingFailed(OWNER_ID);

      expect(again.success).toBe(true);
      expect(item.toPersistence().status).toBe(MediaItemStatus.failed.value);
    });
  });

  describe('When a failed job races an item that already went READY', () => {
    it('should refuse to drag it back to FAILED', () => {
      const item = processingItem();
      item.applyProcessingResults(pipelineResult(), OWNER_ID);

      const result = item.markProcessingFailed(OWNER_ID);

      expect(result.success).toBe(false);
      expect(item.toPersistence().status).toBe(MediaItemStatus.ready.value);
    });
  });
});
