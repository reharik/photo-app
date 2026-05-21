import { randomUUID } from 'node:crypto';

import { buildMediaItemBaseStorageKey, hashToken } from '@packages/media-core';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

const shareLinkQuery = `
  query ShareLink($token: String!) {
    shareLink(token: $token) {
      token
      viewerRelationship
      target {
        __typename
        ... on SharedAlbum {
          id
          title
        }
        ... on SharedWithMedMediaItemCollection {
          id
          items {
            id
            displayUrl
          }
        }
      }
    }
  }
`;

describe('shareLink query', () => {
  const viewerId = TEST_VIEWER_1_ID;
  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<IocGeneratedCradle>;
  let database: Knex;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
    database = container.resolve('database');
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database, undefined, () => integrationTestMediaStorage.clear());
  });

  const insertAlbumWithMember = async (params: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void> => {
    await database('album').insert({
      id: params.id,
      title: params.title,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
    await database('albumMember').insert({
      id: randomUUID(),
      albumId: params.id,
      userId: viewerId,
      role: 'admin',
      createdAt: params.updatedAt,
      updatedAt: params.updatedAt,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
  };

  const insertReadyMediaItem = async (params: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void> => {
    await database('mediaItem').insert({
      id: params.id,
      ownerId: viewerId,
      storageKey: buildMediaItemBaseStorageKey(viewerId, params.id),
      kind: 'photo',
      mimeType: 'image/jpeg',
      sizeBytes: 1,
      width: 800,
      height: 600,
      status: 'ready',
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
    await database('mediaAsset').insert({
      id: randomUUID(),
      mediaItemId: params.id,
      kind: 'display',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1,
      status: 'ready',
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
  };

  describe('When the token matches an active album share link', () => {
    it('should return SharedAlbum target with title', async () => {
      const now = new Date();
      const albumId = randomUUID();
      const shareLinkId = randomUUID();
      const rawToken = 'test-album-token-secret';

      await insertAlbumWithMember({
        id: albumId,
        title: 'Holiday',
        createdAt: now,
        updatedAt: now,
      });

      const accessGrantId = randomUUID();
      await database('accessGrant').insert({
        id: accessGrantId,
        albumId,
        mediaItemId: null,
        grantedBy: viewerId,
        grantedToUser: null,
        token: randomUUID(),
        operation: 'VIEW',
        createdAt: now,
        updatedAt: now,
        createdBy: viewerId,
        updatedBy: viewerId,
      });

      await database('shareLinks').insert({
        id: shareLinkId,
        linkToken: hashToken(rawToken),
        createdBy: viewerId,
        createdAt: now,
        updatedAt: now,
      });

      await database('shareLinkGrants').insert({
        id: randomUUID(),
        shareLinkId,
        accessGrantId,
      });

      const { response, json } = await executeGraphQL({
        query: shareLinkQuery,
        variables: { token: rawToken },
        context: { isLoggedIn: false },
      });

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.shareLink?.token).toBe(rawToken);
      expect(json.data?.shareLink?.viewerRelationship).toBe('ANONYMOUS');
      expect(json.data?.shareLink?.target.__typename).toBe('SharedAlbum');
      expect(json.data?.shareLink?.target).toEqual(
        expect.objectContaining({
          id: albumId,
          title: 'Holiday',
        }),
      );
    });
  });

  describe('When the token matches an active media-item share link', () => {
    it('should return SharedWithMedMediaItemCollection with items and display URLs', async () => {
      const now = new Date();
      const mediaA = randomUUID();
      const mediaB = randomUUID();
      const shareLinkId = randomUUID();
      const rawToken = 'test-media-token-secret';

      await insertReadyMediaItem({ id: mediaA, createdAt: now, updatedAt: now });
      await insertReadyMediaItem({ id: mediaB, createdAt: now, updatedAt: now });

      const accessGrantA = randomUUID();
      const accessGrantB = randomUUID();
      await database('accessGrant').insert([
        {
          id: accessGrantA,
          albumId: null,
          mediaItemId: mediaA,
          grantedBy: viewerId,
          grantedToUser: null,
          token: randomUUID(),
          operation: 'VIEW',
          createdAt: now,
          updatedAt: now,
          createdBy: viewerId,
          updatedBy: viewerId,
        },
        {
          id: accessGrantB,
          albumId: null,
          mediaItemId: mediaB,
          grantedBy: viewerId,
          grantedToUser: null,
          token: randomUUID(),
          operation: 'VIEW',
          createdAt: now,
          updatedAt: now,
          createdBy: viewerId,
          updatedBy: viewerId,
        },
      ]);

      await database('shareLinks').insert({
        id: shareLinkId,
        linkToken: hashToken(rawToken),
        createdBy: viewerId,
        createdAt: now,
        updatedAt: now,
      });

      await database('shareLinkGrants').insert([
        {
          id: randomUUID(),
          shareLinkId,
          accessGrantId: accessGrantA,
        },
        {
          id: randomUUID(),
          shareLinkId,
          accessGrantId: accessGrantB,
        },
      ]);

      const { response, json } = await executeGraphQL({
        query: shareLinkQuery,
        variables: { token: rawToken },
        context: { isLoggedIn: false },
      });

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.shareLink?.target.__typename).toBe('SharedWithMedMediaItemCollection');
      const target = json.data?.shareLink?.target as {
        items: Array<{ id: string; displayUrl: string }>;
      };
      expect(target.items).toHaveLength(2);
      expect(target.items[0]?.displayUrl).toContain(`/media/${mediaA}/`);
      expect(target.items[0]?.displayUrl).toContain('token=');
      expect(target.items[1]?.displayUrl).toContain(`/media/${mediaB}/`);
    });
  });

  describe('When the token does not match any share link', () => {
    it('should return null', async () => {
      const { response, json } = await executeGraphQL({
        query: shareLinkQuery,
        variables: { token: 'missing-token' },
        context: { isLoggedIn: false },
      });

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.shareLink).toBeNull();
    });
  });
});
