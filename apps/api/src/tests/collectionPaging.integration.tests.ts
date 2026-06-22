import { randomUUID } from 'node:crypto';

import {
  AlbumItemSortBy,
  AlbumMemberRole,
  AlbumSortBy,
  MediaKind,
  MediaItemStatus,
  SortDir,
} from '@packages/contracts';
import type { AwilixContainer } from 'awilix';
import type { Knex } from 'knex';

import type { AlbumItemCollectionInfo, AlbumReadRepository } from '@packages/media-core';
import { CollectionInfo } from '@packages/media-core';
import type { AppCradle } from '../di/generated/ioc-composed.js';
import { setupGraphqlIntegrationTests } from './graphqlIntegrationTestSetup';
import type { IntegrationTestMediaStorage } from './integrationTestMediaStorage';
import { resetIntegrationTestDb } from './resetDb';
import { TEST_VIEWER_1_ID } from './testViewerIds';

describe('AlbumReadRepository (Knex collection paging)', () => {
  const viewerId = TEST_VIEWER_1_ID;

  let container: AwilixContainer<AppCradle>;
  let database: Knex;
  let albumReadRepository: AlbumReadRepository;
  let integrationTestMediaStorage: IntegrationTestMediaStorage;

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
      role: AlbumMemberRole.admin.value,
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
      kind: MediaKind.photo.value,
      mimeType: 'image/jpeg',
      sizeBytes: 1,
      width: 1,
      height: 1,
      status: MediaItemStatus.ready.value,
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
      status: 'READY',
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
  };

  const insertAlbumItem = async (params: {
    id: string;
    albumId: string;
    mediaItemId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<void> => {
    await database('albumItem').insert({
      id: params.id,
      albumId: params.albumId,
      mediaItemId: params.mediaItemId,
      orderIndex: '1000000000000',
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      createdBy: viewerId,
      updatedBy: viewerId,
    });
  };

  const buildAlbumItemCollectionInfo = (
    partial: Partial<CollectionInfo<AlbumItemSortBy>>,
  ): AlbumItemCollectionInfo => {
    return {
      pageInfo: partial.pageInfo ?? { limit: 10, offset: 0 },
      sortBy: partial.sortBy ?? AlbumItemSortBy.createdAt,
      sortDir: partial.sortDir ?? SortDir.asc,
    };
  };
  const buildCollectionInfo = (
    partial: Partial<CollectionInfo<AlbumSortBy>>,
  ): CollectionInfo<AlbumSortBy> => {
    return {
      pageInfo: partial.pageInfo ?? { limit: 10, offset: 0 },
      sortBy: partial.sortBy ?? AlbumSortBy.createdAt,
      sortDir: partial.sortDir ?? SortDir.asc,
    };
  };
  beforeAll(async () => {
    const setup = await setupGraphqlIntegrationTests();
    container = setup.container;
    database = container.resolve('database');
    albumReadRepository = container.resolve('albumReadRepository');
    integrationTestMediaStorage = setup.integrationTestMediaStorage;
  });

  afterEach(async () => {
    await resetIntegrationTestDb(database, undefined, () => integrationTestMediaStorage.clear());
  });

  describe('When listByViewerId runs with title sort', () => {
    it('should apply limit+1 and stable title order from Knex', async () => {
      const t = new Date('2020-01-01T00:00:00.000Z');
      const albumRows = [
        { id: randomUUID(), title: 'paging-z' },
        { id: randomUUID(), title: 'paging-a' },
        { id: randomUUID(), title: 'paging-m' },
        { id: randomUUID(), title: 'paging-b' },
        { id: randomUUID(), title: 'paging-c' },
      ];
      for (const row of albumRows) {
        await insertAlbumWithMember({
          id: row.id,
          title: row.title,
          createdAt: t,
          updatedAt: t,
        });
      }

      const page = await albumReadRepository.listByViewerId({
        viewerId,
        collectionInfo: buildCollectionInfo({
          pageInfo: { limit: 2, offset: 0 },
          sortBy: AlbumSortBy.title,
          sortDir: SortDir.asc,
        }),
      });

      expect(page.nodes.map((r) => r.title)).toEqual(['paging-a', 'paging-b']);
    });
  });

  describe('When listByViewerId runs with a non-zero offset', () => {
    it('should return the next window in sort order', async () => {
      const t = new Date('2020-01-02T00:00:00.000Z');
      const albumRows = [
        { id: randomUUID(), title: 'paging-z' },
        { id: randomUUID(), title: 'paging-a' },
        { id: randomUUID(), title: 'paging-m' },
        { id: randomUUID(), title: 'paging-b' },
        { id: randomUUID(), title: 'paging-c' },
      ];
      for (const row of albumRows) {
        await insertAlbumWithMember({
          id: row.id,
          title: row.title,
          createdAt: t,
          updatedAt: t,
        });
      }

      const page = await albumReadRepository.listByViewerId({
        viewerId,
        collectionInfo: buildCollectionInfo({
          pageInfo: { limit: 2, offset: 2 },
          sortBy: AlbumSortBy.title,
          sortDir: SortDir.asc,
        }),
      });

      expect(page.nodes.map((r) => r.title)).toEqual(['paging-c', 'paging-m']);
    });
  });

  describe('When listByViewerId runs with createdAt sort', () => {
    it('should order by album created_at via Knex', async () => {
      const base = new Date('2019-06-01T12:00:00.000Z');
      const albumRows = [
        { id: randomUUID(), title: 't-old', createdAt: new Date(base.getTime() - 3_600_000) },
        { id: randomUUID(), title: 't-mid', createdAt: new Date(base.getTime() - 1_800_000) },
        { id: randomUUID(), title: 't-new', createdAt: base },
      ];
      for (const row of albumRows) {
        await insertAlbumWithMember({
          id: row.id,
          title: row.title,
          createdAt: row.createdAt,
          updatedAt: row.createdAt,
        });
      }

      const page = await albumReadRepository.listByViewerId({
        viewerId,
        collectionInfo: buildCollectionInfo({
          pageInfo: { limit: 5, offset: 0 },
          sortBy: AlbumSortBy.createdAt,
          sortDir: SortDir.desc,
        }),
      });

      expect(page.nodes.map((r) => r.title)).toEqual(['t-new', 't-mid', 't-old']);
    });
  });

  describe('When getAlbumItemsForViewer runs with createdAt sort', () => {
    it('should apply limit and order by album_item.created_at', async () => {
      const albumId = randomUUID();
      const t0 = new Date('2021-03-01T10:00:00.000Z');
      await insertAlbumWithMember({
        id: albumId,
        title: 'items-paging',
        createdAt: t0,
        updatedAt: t0,
      });

      const media1 = randomUUID();
      const media2 = randomUUID();
      const media3 = randomUUID();
      const mtime = new Date('2021-03-01T09:00:00.000Z');
      await insertReadyMediaItem({ id: media1, createdAt: mtime, updatedAt: mtime });
      await insertReadyMediaItem({ id: media2, createdAt: mtime, updatedAt: mtime });
      await insertReadyMediaItem({ id: media3, createdAt: mtime, updatedAt: mtime });

      const item1 = randomUUID();
      const item2 = randomUUID();
      const item3 = randomUUID();
      const tEarly = new Date('2021-04-01T08:00:00.000Z');
      const tMid = new Date('2021-04-01T09:00:00.000Z');
      const tLate = new Date('2021-04-01T10:00:00.000Z');

      await insertAlbumItem({
        id: item1,
        albumId,
        mediaItemId: media1,
        createdAt: tEarly,
        updatedAt: tEarly,
      });
      await insertAlbumItem({
        id: item2,
        albumId,
        mediaItemId: media2,
        createdAt: tMid,
        updatedAt: tMid,
      });
      await insertAlbumItem({
        id: item3,
        albumId,
        mediaItemId: media3,
        createdAt: tLate,
        updatedAt: tLate,
      });

      const firstWindow = await albumReadRepository.getViewableAlbumItemsForViewer({
        albumId,
        viewerId,
        collectionInfo: buildAlbumItemCollectionInfo({
          pageInfo: { limit: 1, offset: 0 },
          sortBy: AlbumItemSortBy.createdAt,
          sortDir: SortDir.asc,
        }),
      });

      expect(firstWindow.nodes.map((r) => r.id)).toEqual([item1, item2]);

      const secondWindow = await albumReadRepository.getViewableAlbumItemsForViewer({
        albumId,
        viewerId,
        collectionInfo: buildAlbumItemCollectionInfo({
          pageInfo: { limit: 1, offset: 1 },
          sortBy: AlbumItemSortBy.createdAt,
          sortDir: SortDir.asc,
        }),
      });

      expect(secondWindow.nodes.map((r) => r.id)).toEqual([item2, item3]);
    });
  });
});
