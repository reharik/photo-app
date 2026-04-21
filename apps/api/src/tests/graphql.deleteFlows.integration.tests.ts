import { randomUUID } from 'node:crypto';

import { AlbumMemberRoleEnum, AppErrorCollection, MediaItemStatus } from '@packages/contracts';
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
import { TEST_VIEWER_1_ID, TEST_VIEWER_A_ID } from './testViewerIds';

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

type ContractErrorPayload = { code: string; message: string };

type WriteMutationResponse<T> = {
  data?: T;
  errors: ContractErrorPayload[];
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
  mutation AddMediaItemToAlbum($albumId: ID!, $mediaItemId: ID!) {
    AddMediaItemToAlbum(input: { albumId: $albumId, mediaItemId: $mediaItemId }) {
      data {
        albumId
        albumItemId
      }
      errors {
        code
        message
      }
    }
  }
`;

const deleteAlbumItemsFromAlbumMutation = `
  mutation DeleteAlbumItemsFromAlbum($input: DeleteAlbumItemsFromAlbumInput!) {
    DeleteAlbumItemsFromAlbum(input: $input) {
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

const deleteAlbumMutation = `
  mutation DeleteAlbum($albumId: ID!) {
    deleteAlbum(input: { albumId: $albumId }) {
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

const deleteMediaItemMutation = `
  mutation DeleteMediaItem($mediaItemId: ID!) {
    deleteMediaItem(input: { mediaItemId: $mediaItemId }) {
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

const deleteMediaItemsMutation = `
  mutation DeleteMediaItems($input: DeleteMediaItemsInput!) {
    deleteMediaItems(input: $input) {
      data {
        deletedMediaItemIds
      }
      errors {
        code
        message
      }
    }
  }
`;

const updateMediaItemDetailsMutation = `
  mutation UpdateMediaItemDetails($input: UpdateMediaItemDetailsInput!) {
    updateMediaItemDetails(input: $input) {
      data {
        mediaItemId
        title
        description
        takenAt
      }
      errors {
        code
        message
      }
    }
  }
`;

const listCollection = `
  collectionInfo: {
    pageInfo: { limit: 50, offset: 0 }
    sortBy: CREATED_AT
    sortDir: ASC
  }
`;

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

const insertAlbumMember = async (
  database: Knex,
  albumId: string,
  userId: string,
  role: (typeof AlbumMemberRoleEnum)[keyof typeof AlbumMemberRoleEnum],
): Promise<void> => {
  const now = new Date();
  await database('albumMember').insert({
    id: randomUUID(),
    albumId,
    userId,
    role: role.value,
    createdAt: now,
    updatedAt: now,
    createdBy: TEST_VIEWER_A_ID,
    updatedBy: TEST_VIEWER_A_ID,
  });
};

/** For cases where AddMediaItemToAlbum is not allowed (e.g. viewer role). */
const insertAlbumItem = async (
  database: Knex,
  albumId: string,
  mediaItemId: string,
): Promise<void> => {
  const now = new Date();
  await database('albumItem').insert({
    id: randomUUID(),
    albumId,
    mediaItemId,
    orderIndex: '1000000000000',
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
    MediaItemStatus.uploaded.value,
  );

  return mediaItemId;
};

describe('DeleteAlbumItemsFromAlbum', () => {
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

  describe('When the actor is an owner deleting an item that exists in the album', () => {
    it('should succeed and remove the album item from subsequent reads', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-item-owner-${randomUUID()}` },
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
      });

      const add = await executeGraphQL<{
        AddMediaItemToAlbum: WriteMutationResponse<{ albumId: string; albumItemId: string }>;
      }>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId },
        context: loggedInViewer1,
      });
      expect(add.json.data?.AddMediaItemToAlbum.errors).toEqual([]);
      const albumItemIdFromAdd = add.json.data?.AddMediaItemToAlbum.data?.albumItemId;
      expect(albumItemIdFromAdd).toBeTruthy();
      if (!albumItemIdFromAdd) {
        return;
      }

      const del = await executeGraphQL<{
        DeleteAlbumItemsFromAlbum: WriteMutationResponse<{
          albumId: string;
          albumItemIds: string[];
        }>;
      }>({
        query: deleteAlbumItemsFromAlbumMutation,
        variables: {
          input: { albumId, albumItemIds: [albumItemIdFromAdd] },
        },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.errors).toEqual([]);
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data?.albumId).toBe(albumId);
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data?.albumItemIds).toEqual([albumItemIdFromAdd]);

      const rows = await database('albumItem').where({ albumId, mediaItemId });
      expect(rows).toHaveLength(0);

      const q = await executeGraphQL<{
        viewer?: {
          album?: { items: { nodes: Array<{ mediaItem: { id: string } }> } };
        };
      }>({
        query: viewerAlbumByIdQuery,
        variables: { albumId },
        context: loggedInViewer1,
      });
      expect(q.json.data?.viewer?.album?.items.nodes ?? []).toHaveLength(0);
    });
  });

  describe('When the actor is an album admin (non-owner)', () => {
    it('should succeed', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-item-admin-${randomUUID()}` },
        context: loggedInViewerA,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      await insertAlbumMember(database, albumId, TEST_VIEWER_1_ID, AlbumMemberRoleEnum.admin);

      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      /** addAlbumItem resolves media via getForViewer(mediaItemId, viewerId); only the media owner can add. */
      const addResult = await executeGraphQL<{
        AddMediaItemToAlbum: WriteMutationResponse<{ albumId: string; albumItemId: string }>;
      }>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId },
        context: loggedInViewer1,
      });
      expect(addResult.json.errors).toBeUndefined();
      expect(addResult.json.data?.AddMediaItemToAlbum.errors).toEqual([]);
      const albumItemIdFromAdd = addResult.json.data?.AddMediaItemToAlbum.data?.albumItemId;
      expect(albumItemIdFromAdd).toBeTruthy();
      if (!albumItemIdFromAdd) {
        return;
      }

      const del = await executeGraphQL<{
        DeleteAlbumItemsFromAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: deleteAlbumItemsFromAlbumMutation,
        variables: {
          input: { albumId, albumItemIds: [albumItemIdFromAdd] },
        },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.errors).toEqual([]);
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data?.albumId).toBe(albumId);
    });
  });

  describe('When the actor is only a viewer member', () => {
    it('should fail with member not allowed to delete item', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-item-viewer-role-${randomUUID()}` },
        context: loggedInViewerA,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      await insertAlbumMember(database, albumId, TEST_VIEWER_1_ID, AlbumMemberRoleEnum.viewer);

      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      /** Viewers cannot add items; seed album_item as if an admin had added the media. */
      await insertAlbumItem(database, albumId, mediaItemId);
      const seededItem = await database('albumItem')
        .where({ albumId, mediaItemId })
        .select('id')
        .first();
      const albumItemId = String(seededItem?.id);
      expect(albumItemId).toBeTruthy();

      const del = await executeGraphQL<{
        DeleteAlbumItemsFromAlbum: WriteMutationResponse<unknown>;
      }>({
        query: deleteAlbumItemsFromAlbumMutation,
        variables: { input: { albumId, albumItemIds: [albumItemId] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data).toBeFalsy();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.MemberNotAllowedToDeleteItem.code,
      );
    });
  });

  describe('When the actor is not an album member', () => {
    it('should fail with user is not a member', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-item-not-member-${randomUUID()}` },
        context: loggedInViewerA,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      /** Album owner must own the media to add (getForViewer uses caller id and media owner). */
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewerA,
      });

      const addResult = await executeGraphQL<{
        AddMediaItemToAlbum: WriteMutationResponse<unknown>;
      }>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId },
        context: loggedInViewerA,
      });
      expect(addResult.json.errors).toBeUndefined();
      expect(addResult.json.data?.AddMediaItemToAlbum?.errors).toEqual([]);

      const albumItemId = addResult.json.data?.AddMediaItemToAlbum.data?.albumItemId;
      expect(albumItemId).toBeTruthy();
      if (!albumItemId) {
        return;
      }

      const del = await executeGraphQL<{
        DeleteAlbumItemsFromAlbum: WriteMutationResponse<unknown>;
      }>({
        query: deleteAlbumItemsFromAlbumMutation,
        variables: { input: { albumId, albumItemIds: [albumItemId] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data).toBeFalsy();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.UserIsNotMember.code,
      );
    });
  });

  describe('When an album item id is not in the album', () => {
    it('should fail with media item not in album', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-item-missing-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const del = await executeGraphQL<{
        DeleteAlbumItemsFromAlbum: WriteMutationResponse<unknown>;
      }>({
        query: deleteAlbumItemsFromAlbumMutation,
        variables: { input: { albumId, albumItemIds: [missingMediaItemId] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data).toBeFalsy();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.errors[0]?.code).toBe(
        AppErrorCollection.album.MediaItemNotInAlbum.code,
      );
    });
  });

  describe('When two items are removed in one batch', () => {
    it('should remove both album items', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-batch-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const m1 = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });
      const m2 = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const add1 = await executeGraphQL<{
        AddMediaItemToAlbum: WriteMutationResponse<{ albumItemId: string }>;
      }>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId: m1 },
        context: loggedInViewer1,
      });
      const add2 = await executeGraphQL<{
        AddMediaItemToAlbum: WriteMutationResponse<{ albumItemId: string }>;
      }>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId: m2 },
        context: loggedInViewer1,
      });
      const id1 = add1.json.data?.AddMediaItemToAlbum.data?.albumItemId;
      const id2 = add2.json.data?.AddMediaItemToAlbum.data?.albumItemId;
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      if (!id1 || !id2) {
        return;
      }

      const del = await executeGraphQL<{
        DeleteAlbumItemsFromAlbum: WriteMutationResponse<{
          albumId: string;
          albumItemIds: string[];
        }>;
      }>({
        query: deleteAlbumItemsFromAlbumMutation,
        variables: { input: { albumId, albumItemIds: [id1, id2] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.errors).toEqual([]);
      expect(del.json.data?.DeleteAlbumItemsFromAlbum?.data?.albumItemIds).toHaveLength(2);
      const rows = await database('albumItem').where({ albumId });
      expect(rows).toHaveLength(0);
    });
  });
});

describe('deleteAlbum', () => {
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

  describe('When the actor is the album owner', () => {
    it('should return albumId and remove the album from subsequent reads', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `delete-album-owner-${randomUUID()}` },
        context: loggedInViewer1,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      const del = await executeGraphQL<{
        deleteAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: deleteAlbumMutation,
        variables: { albumId },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteAlbum.errors).toEqual([]);
      expect(del.json.data?.deleteAlbum.data?.albumId).toBe(albumId);

      const row = await database('album').where({ id: albumId }).first();
      expect(row).toBeUndefined();

      const q = await executeGraphQL<{
        viewer?: { album?: { id: string } | null };
      }>({
        query: viewerAlbumByIdQuery,
        variables: { albumId },
        context: loggedInViewer1,
      });
      expect(q.json.data?.viewer?.album).toBeNull();
    });
  });

  describe('When the actor is an admin member', () => {
    it('should succeed', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `delete-album-admin-${randomUUID()}` },
        context: loggedInViewerA,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      await insertAlbumMember(database, albumId, TEST_VIEWER_1_ID, AlbumMemberRoleEnum.admin);

      const del = await executeGraphQL<{
        deleteAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: deleteAlbumMutation,
        variables: { albumId },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteAlbum.errors).toEqual([]);
      expect(del.json.data?.deleteAlbum.data?.albumId).toBe(albumId);
    });
  });

  describe('When the actor has only viewer role on the album', () => {
    it('should fail with member not allowed to delete album', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `delete-album-viewer-${randomUUID()}` },
        context: loggedInViewerA,
      });
      const albumId = albumResult.json.data?.createAlbum.data?.albumId;
      expect(albumId).toBeTruthy();
      if (!albumId) {
        return;
      }

      await insertAlbumMember(database, albumId, TEST_VIEWER_1_ID, AlbumMemberRoleEnum.viewer);

      const del = await executeGraphQL<{
        deleteAlbum: WriteMutationResponse<unknown>;
      }>({
        query: deleteAlbumMutation,
        variables: { albumId },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteAlbum.data).toBeFalsy();
      expect(del.json.data?.deleteAlbum.errors[0]?.code).toBe(
        AppErrorCollection.album.MemberNotAllowedToDeleteAlbum.code,
      );

      const row = await database('album').where({ id: albumId }).first();
      expect(row?.id).toBe(albumId);
    });
  });

  describe('When the album contains items and members', () => {
    it('should remove dependent album rows without leaving orphan album items', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `delete-album-deps-${randomUUID()}` },
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
      });

      const addToAlbum = await executeGraphQL<{
        AddMediaItemToAlbum: WriteMutationResponse<{ albumId: string; albumItemId: string }>;
      }>({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId },
        context: loggedInViewer1,
      });
      expect(addToAlbum.json.errors).toBeUndefined();
      expect(addToAlbum.json.data?.AddMediaItemToAlbum.errors).toEqual([]);
      expect(addToAlbum.json.data?.AddMediaItemToAlbum.data?.albumId).toBe(albumId);

      await insertAlbumMember(database, albumId, TEST_VIEWER_A_ID, AlbumMemberRoleEnum.viewer);

      await executeGraphQL<{
        deleteAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: deleteAlbumMutation,
        variables: { albumId },
        context: loggedInViewer1,
      });

      const items = await database('albumItem').where({ albumId });
      expect(items).toHaveLength(0);
      const members = await database('albumMember').where({ albumId });
      expect(members).toHaveLength(0);
    });
  });
});

describe('deleteMediaItem', () => {
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

  describe('When the viewer owns the media item', () => {
    it('should succeed and remove the media item row', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const del = await executeGraphQL<{
        deleteMediaItem: WriteMutationResponse<{ mediaItemId: string }>;
      }>({
        query: deleteMediaItemMutation,
        variables: { mediaItemId },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItem.errors).toEqual([]);
      expect(del.json.data?.deleteMediaItem.data?.mediaItemId).toBe(mediaItemId);

      const row = await database('mediaItem').where({ id: mediaItemId }).first();
      expect(row).toBeUndefined();
    });
  });

  describe('When another user attempts to delete the media item', () => {
    it('should fail with media item not owned by viewer', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewer1,
      });

      const del = await executeGraphQL<{
        deleteMediaItem: WriteMutationResponse<unknown>;
      }>({
        query: deleteMediaItemMutation,
        variables: { mediaItemId },
        context: loggedInViewerA,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItem.data).toBeFalsy();
      expect(del.json.data?.deleteMediaItem.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer.code,
      );

      const row = await database('mediaItem').where({ id: mediaItemId }).first();
      expect(row?.id).toBe(mediaItemId);
    });
  });

  describe('When the media item appears in an album and is referenced as cover', () => {
    it('should remove album item linkage and clear cover reference', async () => {
      const albumResult = await executeGraphQL<{
        createAlbum: WriteMutationResponse<{ albumId: string }>;
      }>({
        query: createAlbumMutation,
        variables: { title: `del-media-cover-${randomUUID()}` },
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
      });

      await executeGraphQL({
        query: addMediaToAlbumMutation,
        variables: { albumId, mediaItemId },
        context: loggedInViewer1,
      });

      await database('album').where({ id: albumId }).update({ coverMediaId: mediaItemId });

      const del = await executeGraphQL<{
        deleteMediaItem: WriteMutationResponse<{ mediaItemId: string }>;
      }>({
        query: deleteMediaItemMutation,
        variables: { mediaItemId },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItem.errors).toEqual([]);

      const albumRow = await database('album').where({ id: albumId }).first();
      expect(albumRow?.coverMediaId).toBeNull();

      const albumItems = await database('albumItem').where({ mediaItemId });
      expect(albumItems).toHaveLength(0);
    });
  });
});

describe('deleteMediaItems', () => {
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

  describe('When the viewer deletes a single media item by id list', () => {
    it('should remove the row and return the id', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const del = await executeGraphQL<{
        deleteMediaItems: WriteMutationResponse<{ deletedMediaItemIds: string[] }>;
      }>({
        query: deleteMediaItemsMutation,
        variables: { input: { mediaItemIds: [mediaItemId] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItems.errors).toEqual([]);
      expect(del.json.data?.deleteMediaItems.data?.deletedMediaItemIds).toEqual([mediaItemId]);

      const row = await database('mediaItem').where({ id: mediaItemId }).first();
      expect(row).toBeUndefined();
    });
  });

  describe('When the viewer deletes multiple media items', () => {
    it('should remove all rows and preserve id order in the payload', async () => {
      const m1 = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });
      const m2 = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const del = await executeGraphQL<{
        deleteMediaItems: WriteMutationResponse<{ deletedMediaItemIds: string[] }>;
      }>({
        query: deleteMediaItemsMutation,
        variables: { input: { mediaItemIds: [m1, m2] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItems.errors).toEqual([]);
      expect(del.json.data?.deleteMediaItems.data?.deletedMediaItemIds).toEqual([m1, m2]);

      const rows = await database('mediaItem').whereIn('id', [m1, m2]);
      expect(rows).toHaveLength(0);
    });
  });

  describe('When mediaItemIds is empty', () => {
    it('should fail with empty list error', async () => {
      const del = await executeGraphQL<{
        deleteMediaItems: WriteMutationResponse<unknown>;
      }>({
        query: deleteMediaItemsMutation,
        variables: { input: { mediaItemIds: [] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItems.data).toBeFalsy();
      expect(del.json.data?.deleteMediaItems.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.DeleteMediaItemsEmptyList.code,
      );
    });
  });

  describe('When the list references a missing id', () => {
    it('should fail without deleting other items', async () => {
      const m1 = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const del = await executeGraphQL<{
        deleteMediaItems: WriteMutationResponse<unknown>;
      }>({
        query: deleteMediaItemsMutation,
        variables: { input: { mediaItemIds: [m1, missingMediaItemId] } },
        context: loggedInViewer1,
      });
      expect(del.json.errors).toBeUndefined();
      expect(del.json.data?.deleteMediaItems.data).toBeFalsy();
      expect(del.json.data?.deleteMediaItems.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemNotFound.code,
      );

      const row = await database('mediaItem').where({ id: m1 }).first();
      expect(row?.id).toBe(m1);
    });
  });
});

describe('updateMediaItemDetails', () => {
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

  describe('When the viewer owns the media item', () => {
    it('should update title, description, and takenAt', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });
      const takenAtIso = '2024-01-15T12:00:00.000Z';

      const updated = await executeGraphQL<{
        updateMediaItemDetails: WriteMutationResponse<{
          mediaItemId: string;
          title?: string;
          description?: string;
          takenAt?: string;
        }>;
      }>({
        query: updateMediaItemDetailsMutation,
        variables: {
          input: {
            mediaItemId,
            title: 'Sunset',
            description: 'At the beach',
            takenAt: takenAtIso,
          },
        },
        context: loggedInViewer1,
      });
      expect(updated.json.errors).toBeUndefined();
      expect(updated.json.data?.updateMediaItemDetails.errors).toEqual([]);
      expect(updated.json.data?.updateMediaItemDetails.data?.title).toBe('Sunset');
      expect(updated.json.data?.updateMediaItemDetails.data?.description).toBe('At the beach');
      expect(updated.json.data?.updateMediaItemDetails.data?.takenAt).toBe(takenAtIso);

      const row = await database('mediaItem').where({ id: mediaItemId }).first();
      expect(row?.title).toBe('Sunset');
      expect(row?.description).toBe('At the beach');
      expect(row?.takenAt).toEqual(new Date(takenAtIso));
    });
  });

  describe('When the input omits all optional fields', () => {
    it('should return MediaItemUpdateNoFieldsProvided', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
      });

      const result = await executeGraphQL<{
        updateMediaItemDetails: WriteMutationResponse<unknown>;
      }>({
        query: updateMediaItemDetailsMutation,
        variables: { input: { mediaItemId } },
        context: loggedInViewer1,
      });
      expect(result.json.errors).toBeUndefined();
      expect(result.json.data?.updateMediaItemDetails.data).toBeFalsy();
      expect(result.json.data?.updateMediaItemDetails.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemUpdateNoFieldsProvided.code,
      );
    });
  });

  describe('When another user attempts to update the media item', () => {
    it('should fail with media item not owned by viewer', async () => {
      const mediaItemId = await createUploadedMediaItemViaGraphQL({
        executeGraphQL,
        database,
        integrationTestMediaStorage,
        context: loggedInViewer1,
      });

      const result = await executeGraphQL<{
        updateMediaItemDetails: WriteMutationResponse<unknown>;
      }>({
        query: updateMediaItemDetailsMutation,
        variables: {
          input: { mediaItemId, title: 'Nope' },
        },
        context: loggedInViewerA,
      });
      expect(result.json.errors).toBeUndefined();
      expect(result.json.data?.updateMediaItemDetails.data).toBeFalsy();
      expect(result.json.data?.updateMediaItemDetails.errors[0]?.code).toBe(
        AppErrorCollection.mediaItem.MediaItemNotOwnedByViewer.code,
      );
    });
  });
});
