import {
  AlbumMemberRole,
  ContractError,
  fail,
  ok,
  Operation,
  OperationCatalog,
  OperationResult,
  UserStatus,
} from '@packages/contracts';
import { indexBy, indexByUnique, Logger, RateLimiter } from '@packages/infrastructure';
import { StandardEnumItem } from '@reharik/smart-enum';
import { AlbumItemReadRepository } from '../../../repositories/readRepositories/albumItemReadRepository';
import {
  AlbumMemberReadRepository,
  AlbumReadRepository,
  UserReadRepository,
} from '../../../repositories/readRepositories/types';
import { ReadServiceBase } from '../readServiceBaseType';
import { mapMediaItemRowToDBMediaItemRow } from '../readServiceMappers';
import {
  AlbumCollectionInfo,
  AlbumItemCollectionInfo,
  AlbumItemProjection,
  AlbumMemberCollectionInfo,
  AlbumMemberProjection,
  AlbumProjection,
  AlbumWithCoverRow,
  MediaItemProjection,
  PagedList,
} from '../types';
import { EnrichMediaItems } from './enrichMediaItems';

export interface ViewerAlbumReadService extends ReadServiceBase {
  listAlbums: (collectionInfo: AlbumCollectionInfo) => Promise<PagedList<AlbumProjection>>;
  getAlbum: (albumId: string) => Promise<AlbumProjection | undefined>;
  getViewableAlbumItems: (args: {
    albumId: string;
    collectionInfo: AlbumItemCollectionInfo;
  }) => Promise<PagedList<AlbumItemProjection>>;
  getAlbumMembersForAlbum: (args: {
    albumId: string;
    collectionInfo: AlbumMemberCollectionInfo;
  }) => Promise<PagedList<AlbumMemberProjection>>;
  resolveShareRecipients: (args: {
    albumId: string;
    emails: string[];
  }) => Promise<OperationResult<ShareRecipient[]>>;
}

export type SortableEnum = StandardEnumItem & { column: string };

export type ShareRecipient = {
  email: string;
  resolved: boolean;
  displayName?: string;
};

type ViewerAlbumReadServiceDeps = {
  albumReadRepository: AlbumReadRepository;
  albumItemReadRepository: AlbumItemReadRepository;
  albumMemberReadRepository: AlbumMemberReadRepository;
  enrichMediaItems: EnrichMediaItems;
  userReadRepository: UserReadRepository;
  rateLimiter: RateLimiter;
  logger: Logger;
  viewerId: string;
};

export const build__ViewerAlbumReadService = ({
  albumReadRepository,
  albumItemReadRepository,
  albumMemberReadRepository,
  enrichMediaItems,
  userReadRepository,
  rateLimiter,
  logger,
  viewerId,
}: ViewerAlbumReadServiceDeps): ViewerAlbumReadService => {
  const buildCover = (album: AlbumWithCoverRow) => {
    if (album.mediaItemId == null) {
      return undefined;
    }
    const cover = mapMediaItemRowToDBMediaItemRow(album);
    return {
      ...cover,
      tags: [],
      viewerReactions: [],
      reactionCounts: { total: 0, byEmoji: [] },
      // This is a mediaItem, however, it is special because it is
      // actually a feature of the album that can be added and removed but nothing else.
      operations: album.viewerMemberRole?.equals(AlbumMemberRole.owner)
        ? album.viewerMemberRole.operations
        : [],
    };
  };

  return {
    listAlbums: async (
      collectionInfo: AlbumCollectionInfo,
    ): Promise<PagedList<AlbumProjection>> => {
      const albumsResult = await albumReadRepository.listByViewerId({
        viewerId,
        collectionInfo,
      });
      const coversMap = new Map<string, MediaItemProjection>();
      for (const album of albumsResult.nodes.filter((a) => a.mediaItemId != null)) {
        const cover = buildCover(album);
        if (cover) {
          coversMap.set(album.id, cover);
        }
      }
      const nodes = albumsResult.nodes.map((album) => ({
        id: album.id,
        title: album.title,
        itemCount: album.itemCount,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        owner: {
          firstName: album.ownerFirstName,
          lastName: album.ownerLastName,
        },
        viewerMemberRole: album.viewerMemberRole,
        coverMedia: coversMap.get(album.id),
        operations: album.viewerMemberRole?.operations ?? [],
      }));

      return {
        nodes,
        totalCount: albumsResult.totalCount,
      };
    },

    getAlbum: async (albumId: string): Promise<AlbumProjection | undefined> => {
      const row = await albumReadRepository.getAlbumForViewer({ albumId, viewerId });
      if (!row) {
        return undefined;
      }
      const coverMedia = buildCover(row);

      return {
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        owner: {
          firstName: row.ownerFirstName,
          lastName: row.ownerLastName,
        },
        itemCount: row.itemCount,
        viewerMemberRole: row.viewerMemberRole,
        coverMedia,
        operations: row.viewerMemberRole?.operations ?? [],
      };
    },

    getViewableAlbumItems: async ({
      albumId,
      collectionInfo,
    }: {
      albumId: string;
      collectionInfo: AlbumItemCollectionInfo;
    }): Promise<PagedList<AlbumItemProjection>> => {
      const albumItemsResult = await albumItemReadRepository.getViewableAlbumItemsForViewer({
        albumId,
        viewerId,
        collectionInfo,
      });
      // Strip the namespace off the mediaItem and create a proper DBMediaItemRow
      const dbMediaItems = albumItemsResult.nodes.map(mapMediaItemRowToDBMediaItemRow);
      const enrichedMediaItems = indexByUnique(
        await enrichMediaItems.enrich(viewerId, dbMediaItems),
      );

      const nodes = albumItemsResult.nodes.map(
        (albumItem) =>
          ({
            id: albumItem.id,
            orderIndex: albumItem.albumItemOrderIndex,
            mediaItem: enrichedMediaItems.get(albumItem.mediaItemId),
            createdAt: albumItem.createdAt,
            updatedAt: albumItem.updatedAt,
            operations:
              enrichedMediaItems.get(albumItem.mediaItemId)?.ownerId === viewerId
                ? OperationCatalog.albumItem.availableOperations
                : [],
          }) as AlbumItemProjection,
      );
      return {
        nodes,
        totalCount: albumItemsResult.totalCount,
      };
    },
    getAlbumMembersForAlbum: async ({
      albumId,
      collectionInfo,
    }: {
      albumId: string;
      collectionInfo: AlbumMemberCollectionInfo;
    }): Promise<PagedList<AlbumMemberProjection>> => {
      return albumMemberReadRepository.getAlbumMembersForAlbum({
        albumId,
        viewerId,
        collectionInfo,
      });
    },
    resolveShareRecipients: async ({
      albumId,
      emails,
    }: {
      albumId: string;
      emails: string[];
    }): Promise<OperationResult<ShareRecipient[]>> => {
      const album = await albumReadRepository.getAlbumForViewer({ albumId, viewerId });
      if (!album) {
        return fail(ContractError.AlbumNotFound);
      }
      if (!album.viewerMemberRole?.can(Operation.grantAlbumAuthorization)) {
        return fail(Operation.grantAlbumAuthorization.deniedError);
      }
      const normalizedEmails = [...new Set(emails.map((x) => x.trim().toLowerCase()))];

      if (normalizedEmails.length > 25) {
        return fail(ContractError.TooManyRecipients);
      }
      const resolveShareCheck = await rateLimiter.consume(
        'resolve:shareRecipient',
        viewerId,
        {
          limit: 100,
          windowMs: 60 * 60_000,
        },
        normalizedEmails.length,
      );
      if (!resolveShareCheck.allowed) {
        logger.warn('Resolve share recipient limit exceeded!', {
          viewerId,
        });
        return fail(ContractError.TooManyAttempts);
      }

      const users = await userReadRepository.getByEmails(normalizedEmails);
      const userMap = indexBy(users, (x) => x.email.trim().toLowerCase());
      const result = normalizedEmails.map((x) => {
        const user = userMap.get(x);
        const resolved = !!user && user.userStatus.equals(UserStatus.active);
        return {
          email: x,
          resolved,
          displayName: resolved ? `${user.firstName} ${user.lastName}` : undefined,
        };
      });
      return ok(result);
    },
  };
};
