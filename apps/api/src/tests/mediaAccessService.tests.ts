import { describe, expect, it } from '@jest/globals';
import type { MediaItemReadRepository } from '@packages/media-core';
import { buildMediaAccessService } from '../services/mediaAccessService';

describe('MediaAccessService', () => {
  describe('When variant is display and viewer owns the media item', () => {
    it('should allow access with the display asset storage key', async () => {
      const mediaItemReadRepository: Pick<MediaItemReadRepository, 'getById'> = {
        getById: async () => ({
          id: 'media-1',
          ownerId: 'user-1',
          storageKey: 'media/user-1/media-1',
          kind: 'image',
          status: 'ready',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const service = buildMediaAccessService({ mediaItemReadRepository });

      const result = await service.authorizeView({
        mediaId: 'media-1',
        variant: 'display',
        viewerId: 'user-1',
      });

      expect(result).toEqual({
        allowed: true,
        mediaItemId: 'media-1',
        storageKey: 'media/user-1/media-1/display',
        variant: 'display',
      });
    });
  });

  describe('When there is no authenticated viewer', () => {
    it('should deny access', async () => {
      const mediaItemReadRepository: Pick<MediaItemReadRepository, 'getById'> = {
        getById: async () => ({
          id: 'media-1',
          ownerId: 'user-1',
          storageKey: 'media/user-1/media-1',
          kind: 'image',
          status: 'ready',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const service = buildMediaAccessService({ mediaItemReadRepository });

      const result = await service.authorizeView({
        mediaId: 'media-1',
        variant: 'thumbnail',
      });

      expect(result).toEqual({ allowed: false, reason: 'forbidden' });
    });
  });

  describe('When the media item does not exist', () => {
    it('should return not_found', async () => {
      const mediaItemReadRepository: Pick<MediaItemReadRepository, 'getById'> = {
        getById: async () => undefined,
      };

      const service = buildMediaAccessService({ mediaItemReadRepository });

      const result = await service.authorizeView({
        mediaId: 'missing',
        variant: 'original',
        viewerId: 'user-1',
      });

      expect(result).toEqual({ allowed: false, reason: 'not_found' });
    });
  });

  describe('When the viewer does not own the media item', () => {
    it('should return forbidden', async () => {
      const mediaItemReadRepository: Pick<MediaItemReadRepository, 'getById'> = {
        getById: async () => ({
          id: 'media-1',
          ownerId: 'user-1',
          storageKey: 'media/user-1/media-1',
          kind: 'image',
          status: 'ready',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      const service = buildMediaAccessService({ mediaItemReadRepository });

      const result = await service.authorizeView({
        mediaId: 'media-1',
        variant: 'thumbnail',
        viewerId: 'other-user',
      });

      expect(result).toEqual({ allowed: false, reason: 'forbidden' });
    });
  });
});
