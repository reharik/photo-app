import { MediaAssetKind } from '@packages/contracts';
import type { Knex } from 'knex';

import { buildMediaAssetStorageKey, buildMediaItemBaseStorageKey } from '@packages/media-core';

import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';

/** 1×1 PNG for integration tests that simulate an uploaded object. */
export const MINIMAL_PNG_1X1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

/**
 * Records bytes in the integration test MediaStorage under the original asset key for the item,
 * matching what finalize expects after a client PUT to the presigned URL.
 */
export const seedIntegrationTestUploadedObject = async (
  database: Knex,
  mediaStorage: IntegrationTestMediaStorage,
  mediaItemId: string,
  bytes: Buffer,
): Promise<void> => {
  const row = await database('mediaItem')
    .where({ id: mediaItemId })
    .first<{ id: string; ownerId: string; mimeType: string }>();

  if (!row) {
    throw new Error(`media item not found: ${mediaItemId}`);
  }

  const baseKey = buildMediaItemBaseStorageKey(row.ownerId, row.id);
  const assetStorageKey = buildMediaAssetStorageKey(baseKey, MediaAssetKind.original);
  const mimeType =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
      ? 'image/png'
      : row.mimeType;

  mediaStorage.objects.set(assetStorageKey, {
    size: bytes.length,
    mimeType,
    body: bytes,
  });
};
