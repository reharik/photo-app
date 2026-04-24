import { describe, expect, it } from '@jest/globals';
import { AppErrorCollection, MediaAssetKind } from '@packages/contracts';
import type {
  GrantReadRepository,
  MediaAssetReadRepository,
  MediaItemReadRepository,
} from '@packages/media-core';
import type { MediaAssetProjection } from '@packages/media-core';
import { buildMediaGrantService } from '../services/mediaGrantService';

const ownerId = 'owner-1';
const mediaItemId = 'media-1';
const otherViewerId = 'viewer-2';
const baseStorageKey = `media/${ownerId}/${mediaItemId}`;

const mediaItemRow = {
  id: mediaItemId,
  ownerId,
  kind: 'photo',
  status: 'processing',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mediaItemReadRepositoryReturning = (
  row: typeof mediaItemRow | undefined,
): MediaItemReadRepository =>
  ({
    getByIdForAuthorization: async () => row,
  }) as unknown as MediaItemReadRepository;

const mediaAssetReadRepositoryReturning = (
  assets: MediaAssetProjection[],
): MediaAssetReadRepository => ({
  listByMediaItemIds: async () => new Map([[mediaItemId, assets]]),
});

const grantReadRepositoryReturning = (granted: boolean): GrantReadRepository => ({
  hasActiveGrant: async () => granted,
});

const buildAsset = (
  overrides: Partial<MediaAssetProjection> & Pick<MediaAssetProjection, 'kind' | 'status'>,
): MediaAssetProjection => ({
  id: `${overrides.kind}-asset`,
  url: '',
  mimeType: 'image/jpeg',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('MediaGrantService', () => {
  describe('When neither a viewer nor a share token is supplied', () => {
    it('should fail with MediaItemNotAuthorized', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(mediaItemRow),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([]),
        grantReadRepository: grantReadRepositoryReturning(false),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.thumbnail,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    });
  });

  describe('When the media item does not exist', () => {
    it('should fail with MediaItemNotFound', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(undefined),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([]),
        grantReadRepository: grantReadRepositoryReturning(false),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.thumbnail,
        viewerId: ownerId,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(AppErrorCollection.mediaItem.MediaItemNotFound);
    });
  });

  describe('When the viewer owns the media item and the requested variant is ready', () => {
    it('should resolve to the requested variant storage key', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(mediaItemRow),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([
          buildAsset({ kind: 'original', status: 'ready' }),
          buildAsset({ kind: 'thumbnail', status: 'ready' }),
        ]),
        grantReadRepository: grantReadRepositoryReturning(false),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.thumbnail,
        viewerId: ownerId,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(`${baseStorageKey}/${MediaAssetKind.thumbnail.key}`);
    });
  });

  describe('When the viewer owns the media item but the requested variant is not yet ready', () => {
    it('should fall back to the original storage key', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(mediaItemRow),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([
          buildAsset({ kind: 'original', status: 'ready' }),
        ]),
        grantReadRepository: grantReadRepositoryReturning(false),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.thumbnail,
        viewerId: ownerId,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(`${baseStorageKey}/${MediaAssetKind.original.key}`);
    });
  });

  describe('When a non-owner viewer has no active grant', () => {
    it('should fail with MediaItemNotAuthorized', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(mediaItemRow),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([
          buildAsset({ kind: 'original', status: 'ready' }),
          buildAsset({ kind: 'thumbnail', status: 'ready' }),
        ]),
        grantReadRepository: grantReadRepositoryReturning(false),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.thumbnail,
        viewerId: otherViewerId,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe(AppErrorCollection.mediaItem.MediaItemNotAuthorized);
    });
  });

  describe('When a non-owner viewer has an active grant and derivatives are not ready', () => {
    it('should fall back to the original storage key', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(mediaItemRow),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([
          buildAsset({ kind: 'original', status: 'ready' }),
        ]),
        grantReadRepository: grantReadRepositoryReturning(true),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.display,
        viewerId: otherViewerId,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(`${baseStorageKey}/${MediaAssetKind.original.key}`);
    });
  });

  describe('When the requested variant is the original itself', () => {
    it('should always serve the original regardless of asset list', async () => {
      const service = buildMediaGrantService({
        mediaItemReadRepository: mediaItemReadRepositoryReturning(mediaItemRow),
        mediaAssetReadRepository: mediaAssetReadRepositoryReturning([]),
        grantReadRepository: grantReadRepositoryReturning(false),
      });

      const result = await service.authorizeView({
        mediaId: mediaItemId,
        variant: MediaAssetKind.original,
        viewerId: ownerId,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.value).toBe(`${baseStorageKey}/${MediaAssetKind.original.key}`);
    });
  });
});
