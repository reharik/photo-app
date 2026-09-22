import { randomUUID } from 'node:crypto';

import { MediaAssetKind } from '@packages/contracts';
import type { Knex } from 'knex';

import { buildMediaAssetStorageKey, buildMediaItemBaseStorageKey } from '@packages/media-core';

import type { createExecuteGraphQL } from './executeGQL';
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

export const createMediaUploadMutation = `
  mutation CreateMediaUpload($input: [CreateMediaUploadInput!]!) {
    createMediaUpload(input: $input) {
      data {
        clientId
        mediaItemId
        status
        uploadInstructions {
          method
          url
        }
      }
      errors {
        code
      }
    }
  }
`;

export type CreateMediaUploadInputForTest = {
  clientId: string;
  kind: string;
  mimeType: string;
  size: number;
  originalFileName?: string;
  albumId?: string;
};

export type CreateMediaUploadResultItem = {
  clientId: string;
  mediaItemId: string;
  status: string;
  uploadInstructions: { method: string; url: string };
};

export type CreateMediaUploadMutationData = {
  createMediaUpload: {
    data?: CreateMediaUploadResultItem[] | null;
    errors: { code: string }[] | null;
  };
};

/**
 * One presign input item. `size` defaults to MINIMAL_PNG_1X1.length because that is what the
 * tests seed into fake storage — finalize rejects any other declared size with
 * MEDIA_ITEM_UPLOAD_SIZE_MISMATCH.
 */
export const buildCreateMediaUploadInput = (
  overrides: Partial<CreateMediaUploadInputForTest> = {},
): CreateMediaUploadInputForTest => ({
  clientId: randomUUID(),
  kind: 'PHOTO',
  mimeType: 'image/png',
  size: MINIMAL_PNG_1X1.length,
  ...overrides,
});

/**
 * Runs createMediaUpload for a single item and returns the raw response plus the result item
 * matched by clientId (never by index).
 */
export const presignMediaUpload = async (
  executeGraphQL: ReturnType<typeof createExecuteGraphQL>,
  context: Record<string, unknown>,
  overrides: Partial<CreateMediaUploadInputForTest> = {},
) => {
  const input = buildCreateMediaUploadInput(overrides);
  const result = await executeGraphQL<CreateMediaUploadMutationData>({
    query: createMediaUploadMutation,
    variables: { input: [input] },
    context,
  });
  const item = result.json.data?.createMediaUpload.data?.find((d) => d.clientId === input.clientId);
  return { ...result, input, item };
};
