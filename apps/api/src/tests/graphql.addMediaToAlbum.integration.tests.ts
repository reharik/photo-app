import { randomUUID } from 'node:crypto';

import { AlbumMemberRole, AppErrorCollection, MediaItemStatus } from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import {
  MINIMAL_PNG_1X1,
  seedIntegrationTestUploadedObject,
} from './integrationMediaObjectTestHelper';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID, TEST_VIEWER_A_ID } from './testViewerIds';

const missingAlbumId = '00000000-0000-4000-8000-000000000099';
const missingMediaItemId = '00000000-0000-4000-8000-000000000088';

const loggedInViewer1 = { isLoggedIn: true as const };

const loggedInViewerA = {
  isLoggedIn: true as const,
  user: {
    id: TEST_VIEWER_A_ID,
    firstName: 'Viewer',
    lastName: 'A',
    email: 'test-viewer-a@example.test',
  },
};

const createAlbumMutation = `
  mutation CreateAlbumForTest($title: String!) {
    createAlbum(input: { title: $title }) {
      data {
        albumId
      }
      errors {
        code
        message
      }
    }
  }
`;

const createMediaUploadMutation = `
  mutation {
    createMediaUpload(input: { kind: PHOTO, mimeType: "image/png" }) {
      data {
        mediaItemId
      }
      errors {
        code
        message
      }
    }
  }
`;

const finalizeMediaUploadMutation = `
  mutation FinalizeMedia($id: ID!) {
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
`;

const addMediaToAlbumMutation = `
  mutation AddMediaItemsToAlbum($albumId: ID!, $mediaItemIds: [ID!]!) {
    AddMediaItemsToAlbum(input: { albumId: $albumId, mediaItemIds: $mediaItemIds }) {
      data {
        albumId
        albumItemIds
      }
      errors {
        code
        message
      }
    }
  }
`;

type ContractErrorPayload = { code: string; message: string };

type WriteMutationResponse<T> = {
  data?: T;
  errors: ContractErrorPayload[];
};

const listCollection = `
  collectionInfo: {
    pageInfo: { limit: 50, offset: 0 }
    sortBy: CREATED_AT
    sortDir: ASC
  }
`;

// seems unused

// const viewerAlbumsWithItemsQuery = `
//   query ViewerAlbumsWithItems {
//     viewer {
//       id
//       albums(input: { ${listCollection} }) {
//         nodes {
//           id
//           title
//           items(input: { ${listCollection} }) {
//             nodes {
//               id
//               mediaItem {
//                 id
//                 status
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// `;

const insertViewerRoleMember = async (
  database: Knex,
  albumId: string,
  userId: string,
): Promise<void> => {
  const now = new Date();
  await database('albumMember').insert({
    id: randomUUID(),
    albumId,
    userId,
    role: AlbumMemberRole.contributor.value,
    createdAt: now,
    updatedAt: now,
    createdBy: TEST_VIEWER_A_ID,
    updatedBy: TEST_VIEWER_A_ID,
  });
};

const createUploadedMediaItemViaGraphQL = async (params: {
  executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  database: Knex;
  integrationTestMediaStorage: IntegrationTestMediaStorage;
  context?: Record<string, unknown>;
}): Promise<string> => {
  const {
    executeGraphQL,
    database,
    integrationTestMediaStorage,
    context = loggedInViewer1,
  } = params;

  const created = await executeGraphQL<{
    createMediaUpload: WriteMutationResponse<{ mediaItemId: string }>;
  }>({
    query: createMediaUploadMutation,
    context,
  });
  expect(created.json.errors).toBeUndefined();
  const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
  expect(created.json.data?.createMediaUpload.errors).toEqual([]);
  expect(mediaItemId).toBeTruthy();
  if (!mediaItemId) {
    throw new Error('expected mediaItemId');
  }

  await seedIntegrationTestUploadedObject(
    database,
    integrationTestMediaStorage,
    mediaItemId,
    MINIMAL_PNG_1X1,
  );

  const finalized = await executeGraphQL<{
    finalizeMediaUpload: WriteMutationResponse<{ mediaItemId: string; status: string }>;
  }>({
    query: finalizeMediaUploadMutation,
    variables: { id: mediaItemId },
    context,
  });
  expect(finalized.json.errors).toBeUndefined();
  expect(finalized.json.data?.finalizeMediaUpload.errors).toEqual([]);
  expect(finalized.json.data?.finalizeMediaUpload.data?.status).toBe(
    MediaItemStatus.processing.value,
  );

  return mediaItemId;
};

describe('addAlbumItem', () => {
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<AppCradle>;
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

  describe('When the media item is still pending upload', () => {
    it('should reject the add with a not-ready error', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `pending-album-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const created = await executeGraphQL<{
        createMediaUpload: WriteMutationResponse<{ mediaItemId: string }>;
      }>({
        query: createMediaUploadMutation,
        context: loggedInViewer1,
      });
      const mediaItemId = created.json.data?.createMediaUpload.data?.mediaItemId;
      expect(mediaItemId).toBeTruthy();
      if (!mediaItemId) {
        return;
      }

      const add = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemIds: [mediaItemId] },
        context: loggedInViewer1,
      });
      expect(add.json.errors).toBeUndefined();
      expect(add.json.data?.AddMediaItemsToAlbum?.data).toBeFalsy();
      expect(add.json.data?.AddMediaItemsToAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemNotReady.code,
      );

      const row = await database('albumItem').where({ albumId }).count('* as c').first();
      expect(Number((row as { c?: string | number })?.c ?? 0)).toBe(0);
    });
  });

  describe('When the media item is still processing (derivatives not ready)', () => {
    it('should reject the add with a not-ready error', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `processing-album-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewer1,
      });

      const add = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemIds: [mediaItemId] },
        context: loggedInViewer1,
      });
      expect(add.json.errors).toBeUndefined();
      expect(add.json.data?.AddMediaItemsToAlbum?.data).toBeFalsy();
      expect(add.json.data?.AddMediaItemsToAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemNotReady.code,
      );
    });
  });

  describe('When the media item belongs to another user', () => {
    it('should reject the add without exposing the item to the viewer', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `cross-owner-album-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const otherUsersMediaId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewerA,
      });

      const add = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemIds: [otherUsersMediaId] },
        context: loggedInViewer1,
      });
      expect(add.json.errors).toBeUndefined();
      expect(add.json.data?.AddMediaItemsToAlbum?.data).toEqual({
        albumId,
        albumItemIds: [],
      });
      expect(add.json.data?.AddMediaItemsToAlbum?.errors).toEqual([]);
    });
  });

  describe.skip('When the viewer is only an album member with the viewer role', () => {
    // AlbumMemberRole has no read-only variant; contributor/admin/owner all include addItems.
    it('should reject the add for insufficient album role', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `viewer-role-album-${randomUUID()}` },
        context: loggedInViewerA,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      await insertViewerRoleMember(database, albumId, TEST_VIEWER_1_ID);

      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewer1,
      });

      const add = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemIds: [mediaItemId] },
        context: loggedInViewer1,
      });
      expect(add.json.errors).toBeUndefined();
      expect(add.json.data?.AddMediaItemsToAlbum?.data).toBeFalsy();
      expect(add.json.data?.AddMediaItemsToAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.MemberNotAllowedToAddItems.code,
      );
    });
  });

  describe('When the album id does not exist', () => {
    it('should reject the add with album not found', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const add = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaToAlbumMutation,
        variables: { albumId: missingAlbumId, mediaItemIds: [mediaItemId] },
        context: loggedInViewer1,
      });
      expect(add.json.errors).toBeUndefined();
      expect(add.json.data?.AddMediaItemsToAlbum?.data).toBeFalsy();
      expect(add.json.data?.AddMediaItemsToAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.AlbumNotFound?.code,
      );
    });
  });

  describe('When the media item id does not exist for the viewer', () => {
    it('should reject the add with media item not found', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `missing-media-album-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const add = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemIds: [missingMediaItemId] },
        context: loggedInViewer1,
      });
      expect(add.json.errors).toBeUndefined();
      expect(add.json.data?.AddMediaItemsToAlbum?.data).toEqual({
        albumId,
        albumItemIds: [],
      });
      expect(add.json.data?.AddMediaItemsToAlbum?.errors).toEqual([]);
    });
  });

  const addMediaItemsToAlbumMutation = `
    mutation AddMediaItemsToAlbum($input: AddMediaItemsToAlbumInput!) {
      AddMediaItemsToAlbum(input: $input) {
        data {
          albumId
          albumItemIds
        }
        errors {
          code
          message
        }
      }
    }
  `;

  type AddMediaItemsToAlbumMutationData = {
    AddMediaItemsToAlbum?: WriteMutationResponse<{ albumId: string; albumItemIds: string[] }>;
  };

  describe('When AddMediaItemsToAlbum input is invalid', () => {
    it('should reject both albumId and newAlbum', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `invalid-target-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewer1,
      });

      const batch = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaItemsToAlbumMutation,
        variables: {
          input: {
            albumId,
            mediaItemIds: [mediaItemId],
            newAlbum: { title: 'Also set' },
          },
        },
        context: loggedInViewer1,
      });
      expect(batch.json.errors).toBeUndefined();
      expect(batch.json.data?.AddMediaItemsToAlbum?.data).toBeFalsy();
      expect(batch.json.data?.AddMediaItemsToAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.AddMediaToAlbumInvalidTarget.code,
      );
    });

    it('should reject an empty mediaItemIds list', async () => {
      const batch = await executeGraphQL<AddMediaItemsToAlbumMutationData>({
        query: addMediaItemsToAlbumMutation,
        variables: {
          input: {
            mediaItemIds: [],
            newAlbum: { title: 'empty' },
          },
        },
        context: loggedInViewer1,
      });
      expect(batch.json.errors).toBeUndefined();
      expect(batch.json.data?.AddMediaItemsToAlbum?.data).toBeFalsy();
      expect(batch.json.data?.AddMediaItemsToAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.AddMediaToAlbumEmptyMediaList.code,
      );
    });
  });

  describe('When viewer.album is queried', () => {
    const viewerAlbumByIdQuery = `
      query ViewerAlbumById($albumId: ID!) {
        viewer {
          id
          album(id: $albumId) {
            id
            title
            items(input: { ${listCollection} }) {
              nodes {
                id
                mediaItem {
                  id
                }
              }
            }
          }
        }
      }
    `;

    it('should return null when the album is not visible to the viewer', async () => {
      const q = await executeGraphQL<{
        viewer?: { album?: { id: string } | null };
      }>({
        query: viewerAlbumByIdQuery,
        variables: { albumId: missingAlbumId },
        context: loggedInViewer1,
      });
      expect(q.json.errors).toBeUndefined();
      expect(q.json.data?.viewer?.album).toBeNull();
    });
  });
});
