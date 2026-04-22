import { AppErrorCollection, MediaItemStatus } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import {
  MINIMAL_PNG_1X1,
  seedIntegrationTestUploadedObject,
} from './integrationMediaObjectTestHelper';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_B_ID } from './testViewerIds';

describe('GraphQL media upload integration', () => {
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<IocGeneratedCradle>;
  let database: Knex;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database, undefined, () => integrationTestMediaStorage.clear());
  });

  describe('When createMediaUpload runs for an authenticated viewer', () => {
    it('should return pending status and upload instructions', async () => {
      const { response, json } = await executeGraphQL<{
        createMediaUpload: {
          data?: {
            mediaItemId: string;
            status: string;
            uploadInstructions: { method: string; url: string };
          };
          errors: { code: string }[];
        };
      }>({
        query: `
          mutation {
            createMediaUpload(input: { kind: PHOTO, mimeType: "image/jpeg" }) {
              data {
                mediaItemId
                status
                uploadInstructions {
                  method
                  url
                }
              }
              errors {
                code
                message
              }
            }
          }
        `,
        context: { isLoggedIn: true },
      });

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.createMediaUpload.errors).toEqual([]);
      const payload = json.data?.createMediaUpload.data;
      expect(payload?.status).toBe(MediaItemStatus.pending.value);
      expect(payload?.uploadInstructions.method).toBe('PUT');
      expect(payload?.uploadInstructions.url).toMatch(/^https:\/\/integration-test\.invalid\//);
      expect(payload?.mediaItemId).toBeTruthy();
    });
  });

  describe('When finalizeMediaUpload runs before the object exists in storage', () => {
    it('should surface a client-safe failure without an unhandled exception', async () => {
      const created = await executeGraphQL<{
        createMediaUpload: { data?: { mediaItemId: string }; errors: { code: string }[] };
      }>({
        query: `
          mutation {
            createMediaUpload(input: { kind: PHOTO, mimeType: "image/jpeg" }) {
              data {
                mediaItemId
              }
              errors {
                code
              }
            }
          }
        `,
        context: { isLoggedIn: true },
      });
      expect(created.json.errors).toBeUndefined();
      expect(created.json.data?.createMediaUpload.errors).toEqual([]);
      const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
      expect(mediaItemId).toBeTruthy();
      if (!mediaItemId) {
        return;
      }

      const { response, json } = await executeGraphQL<{
        finalizeMediaUpload: {
          data?: { mediaItemId: string; status: string; size: number };
          errors: { code: string; message: string }[];
        };
      }>({
        query: `
          mutation ($id: ID!) {
            finalizeMediaUpload(input: { mediaItemId: $id }) {
              data {
                mediaItemId
                status
                size
              }
              errors {
                code
                message
              }
            }
          }
        `,
        variables: { id: mediaItemId },
        context: { isLoggedIn: true },
      });

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.finalizeMediaUpload.data).toBeFalsy();
      expect(json.data?.finalizeMediaUpload.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaBytesNotFound.code,
      );
      expect(json.data?.finalizeMediaUpload.errors[0]?.message).toBe(
        AppErrorCollection.mediaItem.MediaBytesNotFound.display,
      );
    });
  });

  describe('When bytes exist in storage then finalizeMediaUpload runs', () => {
    it('should transition the media item to uploaded', async () => {
      const created = await executeGraphQL<{
        createMediaUpload: { data?: { mediaItemId: string }; errors: { code: string }[] };
      }>({
        query: `
          mutation {
            createMediaUpload(input: { kind: PHOTO, mimeType: "image/jpeg" }) {
              data {
                mediaItemId
              }
              errors {
                code
              }
            }
          }
        `,
        context: { isLoggedIn: true },
      });
      expect(created.json.errors).toBeUndefined();
      expect(created.json.data?.createMediaUpload.errors).toEqual([]);
      const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
      expect(mediaItemId).toBeTruthy();
      if (!mediaItemId) {
        return;
      }

      await seedIntegrationTestUploadedObject(
        database,
        integrationTestMediaStorage,
        mediaItemId,
        MINIMAL_PNG_1X1,
      );

      const { response, json } = await executeGraphQL<{
        finalizeMediaUpload: {
          data?: { mediaItemId: string; status: string; size: number };
          errors: { code: string }[];
        };
      }>({
        query: `
          mutation ($id: ID!) {
            finalizeMediaUpload(input: { mediaItemId: $id }) {
              data {
                mediaItemId
                status
                size
              }
              errors {
                code
              }
            }
          }
        `,
        variables: { id: mediaItemId },
        context: { isLoggedIn: true },
      });

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.finalizeMediaUpload.errors).toEqual([]);
      expect(json.data?.finalizeMediaUpload.data?.mediaItemId).toBe(mediaItemId);
      expect(json.data?.finalizeMediaUpload.data?.status).toBe(MediaItemStatus.processing.value);
      expect(json.data?.finalizeMediaUpload.data?.size).toBeGreaterThan(0);
    });
  });

  describe('When finalizeMediaUpload is invoked by a different viewer than the owner', () => {
    it('should fail without transitioning the media item for the attacker', async () => {
      const created = await executeGraphQL<{
        createMediaUpload: { data?: { mediaItemId: string }; errors: { code: string }[] };
      }>({
        query: `
          mutation {
            createMediaUpload(input: { kind: PHOTO, mimeType: "image/jpeg" }) {
              data {
                mediaItemId
              }
              errors {
                code
              }
            }
          }
        `,
        context: { isLoggedIn: true },
      });
      expect(created.json.errors).toBeUndefined();
      expect(created.json.data?.createMediaUpload.errors).toEqual([]);
      const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
      if (!mediaItemId) {
        return;
      }

      const { json } = await executeGraphQL<{
        finalizeMediaUpload: {
          data?: { mediaItemId: string; status: string };
          errors: { code: string; message: string }[];
        };
      }>({
        query: `
          mutation ($id: ID!) {
            finalizeMediaUpload(input: { mediaItemId: $id }) {
              data {
                mediaItemId
                status
              }
              errors {
                code
                message
              }
            }
          }
        `,
        variables: { id: mediaItemId },
        context: {
          isLoggedIn: true,
          user: {
            id: TEST_VIEWER_B_ID,
            firstName: 'B',
            lastName: 'B',
            email: 'b@example.com',
          },
        },
      });

      expect(json.errors).toBeUndefined();
      expect(json.data?.finalizeMediaUpload.data).toBeFalsy();
      expect(json.data?.finalizeMediaUpload.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer.code,
      );
    });
  });
});
