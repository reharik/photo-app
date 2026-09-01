/**
 * Integration coverage for the `publicAccess` query — the unauthenticated share-link
 * read path — against real Postgres.
 *
 * Replaces the old `graphql.shareLink` suite, which was written against a design that
 * migration 0018 removed (a `share_link` / `share_link_grant` pair behind a
 * `shareLink(token:)` root field). Public access is now a single `access_grant` row
 * carrying `link_token`; its id IS the `publicLinkId` the request is scoped to.
 *
 * What this pins down:
 *  - the happy path resolves the grant, its album, and the album's items,
 *  - `mediaItem(id:)` is gated by the materialized `grant` rows — an item the link
 *    does not cover is NOT reachable through it,
 *  - revoked and expired links stop resolving,
 *  - the token → publicAccessId lookup (what the Koa layer does before GraphQL runs)
 *    honours the same revoked/expired filters.
 */
import { randomUUID } from 'node:crypto';

import {
  AlbumItemSortBy,
  AlbumMemberRole,
  MediaItemStatus,
  MediaKind,
  SortDir,
} from '@packages/contracts';
import type { TokenAccessReadRepository } from '@packages/media-core';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import { createExecuteGraphQL } from './executeGQL';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

/** The context factory only enters public mode when this header is present. */
const PUBLIC_HEADERS = { 'X-Access-Mode': 'public' };

const publicAccessQuery = `
  query PublicAccess($collectionInfo: PublicAlbumItemCollectionInput!) {
    publicAccess {
      id
      albumId
      grantedBy
      album {
        id
        title
        itemCount
        items(input: { collectionInfo: $collectionInfo }) {
          totalCount
          nodes {
            id
            mediaItem {
              id
              status
            }
          }
        }
      }
    }
  }
`;

const publicMediaItemQuery = `
  query PublicMediaItem($id: ID!) {
    publicAccess {
      mediaItem(id: $id) {
        id
        kind
        status
      }
    }
  }
`;

const collectionInfo = {
  pageInfo: { limit: 10, offset: 0 },
  sortBy: AlbumItemSortBy.createdAt.value,
  sortDir: SortDir.asc.value,
};

describe('publicAccess query (integration)', () => {
  const viewerId = TEST_VIEWER_1_ID;

  let executeGraphQL: ReturnType<typeof createExecuteGraphQL>;
  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let tokenAccessReadRepository: TokenAccessReadRepository;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    executeGraphQL = setup.executeGraphQL;
    database = container.resolve('database');
    tokenAccessReadRepository = container.resolve('tokenAccessReadRepository');
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database, undefined, () => integrationTestMediaStorage.clear());
  });

  const now = () => new Date();

  const insertAlbumWithMember = async (albumId: string, title: string): Promise<void> => {
    const at = now();
    await database('album').insert({
      id: albumId,
      title,
      createdAt: at,
      updatedAt: at,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
    await database('albumMember').insert({
      id: randomUUID(),
      albumId,
      userId: viewerId,
      role: AlbumMemberRole.owner.value,
      createdAt: at,
      updatedAt: at,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
  };

  const insertReadyMediaItem = async (mediaItemId: string): Promise<void> => {
    const at = now();
    await database('mediaItem').insert({
      id: mediaItemId,
      ownerId: viewerId,
      kind: MediaKind.photo.value,
      mimeType: 'image/jpeg',
      sizeBytes: 1,
      width: 1,
      height: 1,
      status: MediaItemStatus.ready.value,
      createdAt: at,
      updatedAt: at,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
  };

  const insertAlbumItem = async (albumId: string, mediaItemId: string): Promise<string> => {
    const at = now();
    const id = randomUUID();
    await database('albumItem').insert({
      id,
      albumId,
      mediaItemId,
      orderIndex: '1000000000000',
      createdAt: at,
      updatedAt: at,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
    return id;
  };

  /**
   * The public link itself: an album-scoped access_grant whose grantee is a token rather
   * than a user — kind 'PUBLIC' under the discriminator model (migration 0024:
   * granted_to_user NULL, link_token NOT NULL, kind NOT NULL with no default).
   */
  const insertPublicLinkGrant = async (
    albumId: string,
    overrides: { expiresAt?: Date; revokedAt?: Date } = {},
  ): Promise<{ accessGrantId: string; linkToken: string }> => {
    const at = now();
    const accessGrantId = randomUUID();
    const linkToken = `hashed-token-${randomUUID()}`;
    await database('accessGrant').insert({
      id: accessGrantId,
      albumId,
      mediaItemId: null,
      grantedBy: viewerId,
      grantedToUser: null,
      linkToken,
      kind: 'PUBLIC',
      // OWNER: this seeds the canonical owner-minted link (0026 made origin NOT NULL).
      origin: 'OWNER',
      // COMMENT, not VIEW: the DB CHECK admits 'VIEW' but the domain Operation
      // smart-enum has no such member, so revival throws on read. Mirror the client.
      operations: ['COMMENT'],
      expiresAt: overrides.expiresAt ?? null,
      revokedAt: overrides.revokedAt ?? null,
      createdAt: at,
      updatedAt: at,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
    return { accessGrantId, linkToken };
  };

  /**
   * Materialized per-item grant. `getPublicMediaItem` joins through this, so an album
   * item is only reachable as a single media item once its row exists.
   */
  const insertMaterializedGrant = async (
    accessGrantId: string,
    mediaItemId: string,
  ): Promise<void> => {
    await database('grant').insert({
      id: randomUUID(),
      mediaItemId,
      accessGrantId,
      grantedToUser: null,
      // COMMENT, not VIEW — see insertPublicLinkGrant.
      operations: ['COMMENT'],
      createdAt: now(),
    });
  };

  const queryPublicAccess = (publicAccessId: string) =>
    executeGraphQL({
      query: publicAccessQuery,
      variables: { collectionInfo },
      context: { isLoggedIn: false, publicAccessId },
      headers: PUBLIC_HEADERS,
    });

  describe('When the link is active', () => {
    it('should resolve the grant, its album, and the album items', async () => {
      const albumId = randomUUID();
      const mediaItemId = randomUUID();
      await insertAlbumWithMember(albumId, 'Holiday');
      await insertReadyMediaItem(mediaItemId);
      const albumItemId = await insertAlbumItem(albumId, mediaItemId);
      const { accessGrantId } = await insertPublicLinkGrant(albumId);

      const { response, json } = await queryPublicAccess(accessGrantId);

      expect(response.status).toBe(200);
      expect(json.errors).toBeUndefined();
      expect(json.data?.publicAccess).toEqual(
        expect.objectContaining({
          id: accessGrantId,
          albumId,
          grantedBy: viewerId,
        }),
      );
      expect(json.data?.publicAccess?.album).toEqual(
        expect.objectContaining({ id: albumId, title: 'Holiday' }),
      );
      expect(json.data?.publicAccess?.album?.items?.totalCount).toBe(1);
      expect(json.data?.publicAccess?.album?.items?.nodes).toEqual([
        expect.objectContaining({
          id: albumItemId,
          mediaItem: expect.objectContaining({ id: mediaItemId }),
        }),
      ]);
    });
  });

  describe('When the link has been revoked', () => {
    it('should not resolve public access', async () => {
      const albumId = randomUUID();
      await insertAlbumWithMember(albumId, 'Revoked');
      const { accessGrantId } = await insertPublicLinkGrant(albumId, { revokedAt: new Date() });

      const { json } = await queryPublicAccess(accessGrantId);

      // The resolver throws rather than returning null, so this surfaces as a GraphQL error.
      expect(json.errors).toBeDefined();
      expect(json.data?.publicAccess ?? null).toBeNull();
    });
  });

  describe('When the link has expired', () => {
    it('should not resolve public access', async () => {
      const albumId = randomUUID();
      await insertAlbumWithMember(albumId, 'Expired');
      const { accessGrantId } = await insertPublicLinkGrant(albumId, {
        expiresAt: new Date(Date.now() - 60_000),
      });

      const { json } = await queryPublicAccess(accessGrantId);

      expect(json.errors).toBeDefined();
      expect(json.data?.publicAccess ?? null).toBeNull();
    });
  });

  describe('When public mode is requested with no publicAccessId', () => {
    it('should reject the request at the context boundary', async () => {
      const { json } = await executeGraphQL({
        query: publicAccessQuery,
        variables: { collectionInfo },
        context: { isLoggedIn: false },
        headers: PUBLIC_HEADERS,
      });

      expect(json.errors).toBeDefined();
      expect(json.data?.publicAccess ?? null).toBeNull();
    });
  });

  describe('mediaItem(id:) gating', () => {
    it('should return an item the link covers and reject one it does not', async () => {
      const albumId = randomUUID();
      const coveredId = randomUUID();
      const uncoveredId = randomUUID();
      await insertAlbumWithMember(albumId, 'Gated');
      await insertReadyMediaItem(coveredId);
      await insertReadyMediaItem(uncoveredId);
      await insertAlbumItem(albumId, coveredId);
      await insertAlbumItem(albumId, uncoveredId);
      const { accessGrantId } = await insertPublicLinkGrant(albumId);
      // Only the covered item gets a materialized grant row.
      await insertMaterializedGrant(accessGrantId, coveredId);

      const covered = await executeGraphQL({
        query: publicMediaItemQuery,
        variables: { id: coveredId },
        context: { isLoggedIn: false, publicAccessId: accessGrantId },
        headers: PUBLIC_HEADERS,
      });
      expect(covered.json.errors).toBeUndefined();
      expect(covered.json.data?.publicAccess?.mediaItem).toEqual(
        expect.objectContaining({ id: coveredId }),
      );

      const uncovered = await executeGraphQL({
        query: publicMediaItemQuery,
        variables: { id: uncoveredId },
        context: { isLoggedIn: false, publicAccessId: accessGrantId },
        headers: PUBLIC_HEADERS,
      });
      // Being in the album is not enough — the link must actually grant the item.
      expect(uncovered.json.errors).toBeDefined();
      expect(uncovered.json.data?.publicAccess?.mediaItem ?? null).toBeNull();
    });
  });

  describe('token lookup (the pre-GraphQL step the Koa layer performs)', () => {
    it('should resolve an active token to its grant id and drop it once revoked', async () => {
      const albumId = randomUUID();
      await insertAlbumWithMember(albumId, 'Token');
      const { accessGrantId, linkToken } = await insertPublicLinkGrant(albumId);

      await expect(tokenAccessReadRepository.getTokenAccessIdByToken(linkToken)).resolves.toEqual({
        tokenAccessId: accessGrantId,
      });

      await database('accessGrant').where({ id: accessGrantId }).update({ revokedAt: new Date() });

      await expect(
        tokenAccessReadRepository.getTokenAccessIdByToken(linkToken),
      ).resolves.toBeUndefined();
    });
  });
});
