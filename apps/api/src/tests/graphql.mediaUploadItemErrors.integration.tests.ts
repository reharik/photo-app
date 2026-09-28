import { ContractError } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import {
  buildCreateMediaUploadInput,
  isCreateMediaUploadItemError,
  isCreateMediaUploadPayload,
  presignMediaUploadBatch,
} from './integrationMediaObjectTestHelper';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';

/**
 * Low enough that an ordinary test item clears it and an oversized one does not, so a spec opts
 * into the refusal by declaring a bigger `size` rather than by uploading real bytes.
 */
const IMAGE_MAX_BYTES = 1024;
const OVERSIZED_BYTES = IMAGE_MAX_BYTES + 1;

/**
 * A size refusal fails only its own item: the rest of the batch still gets presigned. This is the
 * case the whole per-item union exists for — if it ever regresses to all-or-nothing, a user who
 * picks one huge photo out of fifty loses the other forty-nine silently.
 */
describe('GraphQL createMediaUpload per-item errors', () => {
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests({ imageMaxBytes: IMAGE_MAX_BYTES });
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database, undefined, () => integrationTestMediaStorage.clear());
  });

  describe('When one item in a batch exceeds the image size cap', () => {
    it('should refuse only that item and presign the rest of the same batch', async () => {
      const first = buildCreateMediaUploadInput();
      const oversized = buildCreateMediaUploadInput({ size: OVERSIZED_BYTES });
      const last = buildCreateMediaUploadInput();

      const { response, json, byClientId } = await presignMediaUploadBatch(
        executeGraphQL,
        { isLoggedIn: true },
        [first, oversized, last],
      );

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      // The batch itself succeeded: a per-item refusal must not surface as a top-level error,
      // which is what stops the client's whole queue.
      expect(json.data?.createMediaUpload.errors).toEqual([]);
      expect(byClientId.size).toBe(3);

      const refused = byClientId.get(oversized.clientId);
      expect(refused && isCreateMediaUploadItemError(refused)).toBe(true);
      if (!refused || !isCreateMediaUploadItemError(refused)) {
        return;
      }
      expect(refused.clientId).toBe(oversized.clientId);
      expect(refused.error.code).toBe(ContractError.ImageSizeTooLarge.value);
      // Display data the client needs to say *why*, and the limit it has to read off the error
      // rather than hard-code.
      expect(refused.error.context).toEqual({
        size: OVERSIZED_BYTES,
        maxBytes: IMAGE_MAX_BYTES,
      });

      for (const survivor of [first, last]) {
        const entry = byClientId.get(survivor.clientId);
        expect(entry && isCreateMediaUploadPayload(entry)).toBe(true);
        if (!entry || !isCreateMediaUploadPayload(entry)) {
          continue;
        }
        expect(entry.clientId).toBe(survivor.clientId);
        expect(entry.mediaItemId).toBeTruthy();
        expect(entry.uploadInstructions.method).toBe('PUT');
        expect(entry.uploadInstructions.url).toMatch(/^https:\/\/integration-test\.invalid\//);
      }

      // The refused item must leave no row behind: quota is reserved at presign, so a phantom
      // PENDING item would eat headroom nothing will ever finalize or clean up.
      const rows = await database('mediaItem').select('id');
      expect(rows).toHaveLength(2);
    });
  });
});
