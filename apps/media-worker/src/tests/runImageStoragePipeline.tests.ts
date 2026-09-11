/**
 * The `originalWasReplaced` contract, tested where it is actually consumed.
 *
 * Two halves, and they are deliberately asymmetric:
 *
 *  - The original's BYTES go to S3 only when the pipeline replaced them (HEIC).
 *    Re-uploading identical bytes on every other upload would be pure waste.
 *  - The original's ROW is built from `derivatives.original` in BOTH cases.
 *    `PipelineResult.originalAsset` is required, so the worker always records
 *    the original.
 *
 * The failure mode worth a test: a HEIC conversion whose JPEG never reaches S3
 * while the database happily records that it did. That is silent — the item
 * goes READY, the row says image/jpeg, and the object under the original key is
 * still undecodable HEIC. So the replaced case asserts the write happened with
 * the converted bytes, under the original's key, not merely that some write
 * happened.
 *
 * `generateImageDerivatives` and `extractCaptureTime` are mocked: this suite is
 * about what the caller DOES with a derivative result, and the generator has
 * its own suite.
 */
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { MediaAssetKind } from '@packages/contracts';
import type { Logger } from '@packages/infrastructure';
import type { MediaProcessingJobRow, MediaStorage } from '@packages/worker-core';
import { Readable } from 'node:stream';

import type { Config } from '../config.js';

type GeneratedDerivative = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
};

const generateImageDerivatives = jest.fn<() => Promise<unknown>>();
const extractCaptureTime = jest.fn<() => Promise<unknown>>();

const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const MEDIA_ITEM_ID = '33333333-3333-4333-8333-333333333333';
const JOB_ID = '44444444-4444-4444-8444-444444444444';

const BASE_KEY = `media/${OWNER_ID}/${MEDIA_ITEM_ID}`;
const ORIGINAL_KEY = `${BASE_KEY}/original`;
const DISPLAY_KEY = `${BASE_KEY}/display`;
const THUMBNAIL_KEY = `${BASE_KEY}/thumbnail`;

const ORIGINAL_BYTES = Buffer.from('the-bytes-already-in-s3');
const CONVERTED_JPEG = Buffer.from('converted-jpeg-bytes');

const derivative = (over: Partial<GeneratedDerivative> = {}): GeneratedDerivative => ({
  buffer: Buffer.from('derivative'),
  mimeType: 'image/jpeg',
  width: 100,
  height: 100,
  fileSizeBytes: 10,
  ...over,
});

const jobRow = (): MediaProcessingJobRow =>
  ({
    id: JOB_ID,
    mediaItemId: MEDIA_ITEM_ID,
    createdBy: OWNER_ID,
  }) as unknown as MediaProcessingJobRow;

type Write = { storageKey: string; body: Buffer; mimeType?: string };

const createMediaStorage = () => {
  const writes: Write[] = [];
  const mediaStorage = {
    getObjectStream: jest.fn(() =>
      Promise.resolve({ body: Readable.from([ORIGINAL_BYTES]), mimeType: 'image/heic' }),
    ),
    writeObject: jest.fn((input: Write) => {
      writes.push(input);
      return Promise.resolve();
    }),
  } as unknown as MediaStorage;
  return { mediaStorage, writes };
};

const createLogger = (): Logger =>
  ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

describe('build__RunImageStoragePipeline', () => {
  let build__RunImageStoragePipeline: typeof import('../tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.js').build__RunImageStoragePipeline;

  beforeAll(async () => {
    jest.unstable_mockModule('../tasks/queue/mediaWorkers/imageDerivativeGenerator.js', () => ({
      generateImageDerivatives,
    }));
    jest.unstable_mockModule('../infrastructure/exif/extractCaptureTime.js', () => ({
      extractCaptureTime,
    }));
    ({ build__RunImageStoragePipeline } =
      await import('../tasks/queue/mediaWorkers/processMediaImage/runImageStoragePipeline.js'));
  });

  beforeEach(() => {
    generateImageDerivatives.mockReset();
    extractCaptureTime.mockReset();
    extractCaptureTime.mockResolvedValue({});
  });

  const build = () => {
    const { mediaStorage, writes } = createMediaStorage();
    const run = build__RunImageStoragePipeline({
      logger: createLogger(),
      config: { s3Bucket: 'test-bucket' } as Config,
      mediaStorage,
    });
    return { run, writes, mediaStorage };
  };

  describe('When the pipeline did NOT replace the original', () => {
    it('should not re-upload the original, yet still return an originalAsset row', async () => {
      generateImageDerivatives.mockResolvedValue({
        display: derivative({ width: 1600, height: 1200 }),
        thumbnail: derivative({ width: 480, height: 360 }),
        original: derivative({
          buffer: ORIGINAL_BYTES,
          mimeType: 'image/png',
          width: 4000,
          height: 3000,
          fileSizeBytes: ORIGINAL_BYTES.length,
        }),
        originalWasReplaced: false,
      });
      const { run, writes } = build();

      const result = await run(jobRow(), OWNER_ID);

      // The bytes under the original key are already correct — writing them
      // again would be a pointless S3 round trip on every single upload.
      expect(writes.map((w) => w.storageKey)).toEqual([DISPLAY_KEY, THUMBNAIL_KEY]);
      expect(writes.some((w) => w.storageKey === ORIGINAL_KEY)).toBe(false);

      // ...but the row is still written, from the original's own metadata.
      expect(result.status).toBe('continue');
      if (result.status !== 'continue') {
        return;
      }
      expect(result.pipelineResult.originalAsset).toEqual({
        kind: MediaAssetKind.original,
        mimeType: 'image/png',
        sizeBytes: ORIGINAL_BYTES.length,
        width: 4000,
        height: 3000,
      });
    });
  });

  describe('When the pipeline replaced the original (HEIC)', () => {
    it('should upload the converted bytes to the original key AND record them', async () => {
      generateImageDerivatives.mockResolvedValue({
        display: derivative({ width: 1600, height: 1200 }),
        thumbnail: derivative({ width: 480, height: 360 }),
        original: derivative({
          buffer: CONVERTED_JPEG,
          mimeType: 'image/jpeg',
          width: 4032,
          height: 3024,
          fileSizeBytes: CONVERTED_JPEG.length,
        }),
        originalWasReplaced: true,
      });
      const { run, writes } = build();

      const result = await run(jobRow(), OWNER_ID);

      // The half that must never silently go missing: without this write, S3
      // keeps undecodable HEIC under a key the DB says holds a JPEG.
      const originalWrite = writes.find((w) => w.storageKey === ORIGINAL_KEY);
      expect(originalWrite).toBeDefined();
      expect(originalWrite?.body).toBe(CONVERTED_JPEG);
      expect(originalWrite?.mimeType).toBe('image/jpeg');
      expect(writes).toHaveLength(3);

      expect(result.status).toBe('continue');
      if (result.status !== 'continue') {
        return;
      }
      // The row agrees with the bytes that were just written.
      expect(result.pipelineResult.originalAsset).toEqual({
        kind: MediaAssetKind.original,
        mimeType: 'image/jpeg',
        sizeBytes: CONVERTED_JPEG.length,
        width: 4032,
        height: 3024,
      });
    });
  });

  describe('When the original object is missing from storage', () => {
    it('should stop before generating anything, so no derivative is written', async () => {
      const { mediaStorage, writes } = createMediaStorage();
      (mediaStorage.getObjectStream as jest.Mock<() => Promise<unknown>>).mockResolvedValue(
        undefined,
      );
      const run = build__RunImageStoragePipeline({
        logger: createLogger(),
        config: { s3Bucket: 'test-bucket' } as Config,
        mediaStorage,
      });

      const result = await run(jobRow(), OWNER_ID);

      expect(result.status).toBe('stop');
      expect(generateImageDerivatives).not.toHaveBeenCalled();
      expect(writes).toEqual([]);
    });
  });
});
