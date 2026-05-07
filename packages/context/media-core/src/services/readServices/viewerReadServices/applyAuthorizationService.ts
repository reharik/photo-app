import { AlbumMemberRole } from '@packages/contracts';
import { MediaItemAuthzService } from '../mediaItemAuthzService';
import { ReadServiceFactoryBase } from '../readServiceBaseType';
import {
  DecoratedItem,
  DecoratedNestedMediaItem,
  HasId,
  UnDecoratedItem,
  UnDecoratedNestedMediaItem,
} from '../types';

type ApplyAuthorizationServiceFactoryDeps = {
  mediaItemAuthzService: MediaItemAuthzService;
};

export interface ApplyAuthorizationServiceFactory extends ReadServiceFactoryBase {
  (args: { viewerId: string }): ApplyAuthorizationService;
}

export interface ApplyAuthorizationService {
  toAlbums: <T extends HasId & { viewerMemberRole?: AlbumMemberRole }>(
    items: UnDecoratedItem<T>[],
  ) => Promise<DecoratedItem<T>[]>;
  toAlbum: <T extends HasId & { viewerMemberRole?: AlbumMemberRole }>(
    item: UnDecoratedItem<T>,
  ) => Promise<DecoratedItem<T>>;
  toItems: <T extends HasId>(items: UnDecoratedItem<T>[]) => Promise<DecoratedItem<T>[]>;
  toItem: <T extends HasId>(item: UnDecoratedItem<T>) => Promise<DecoratedItem<T>>;
  toNestedItems: <T extends HasId, U extends HasId>(
    items: UnDecoratedNestedMediaItem<T, U>[],
    albumViewerMemberRole?: AlbumMemberRole,
  ) => Promise<DecoratedNestedMediaItem<T, U>[]>;
}

export const build__ApplyAuthorizationServiceFactory = ({
  mediaItemAuthzService,
}: ApplyAuthorizationServiceFactoryDeps): ApplyAuthorizationServiceFactory => {
  return ({ viewerId }: { viewerId: string }) => {
    // Albums
    const toAlbums = async <T extends HasId & { viewerMemberRole?: AlbumMemberRole }>(
      items: UnDecoratedItem<T>[],
      // eslint-disable-next-line @typescript-eslint/require-await
    ): Promise<DecoratedItem<T>[]> => {
      return items.map((item) => {
        return {
          ...item,
          viewerIsOwner: item.viewerMemberRole === AlbumMemberRole.owner,
          viewerOperations: item.viewerMemberRole?.operations ?? [],
        };
      });
    };
    const toAlbum = async <T extends HasId & { viewerMemberRole?: AlbumMemberRole }>(
      item: UnDecoratedItem<T>,
      // eslint-disable-next-line @typescript-eslint/require-await
    ): Promise<DecoratedItem<T>> => {
      return {
        ...item,
        viewerIsOwner: item.viewerMemberRole === AlbumMemberRole.owner,
        viewerOperations: item.viewerMemberRole?.operations ?? [],
      };
    };

    // Media Items
    const toItems = async <T extends HasId>(
      items: UnDecoratedItem<T>[],
    ): Promise<DecoratedItem<T>[]> => {
      return mediaItemAuthzService.addAuthzToItems(viewerId, items);
    };
    const toItem = async <T extends HasId>(item: UnDecoratedItem<T>): Promise<DecoratedItem<T>> => {
      const result = await toItems([item]);
      return result[0];
    };

    // Nested Items
    const toNestedItems = async <T extends HasId, U extends HasId>(
      items: UnDecoratedNestedMediaItem<T, U>[],
      albumViewerMemberRole?: AlbumMemberRole,
    ): Promise<DecoratedNestedMediaItem<T, U>[]> => {
      // 1. decorate the inner mediaItems
      const innerDecorated = await toItems(items.map((i) => i.mediaItem));

      // 2. zip back together with outer + viewer context
      return items.map((item, idx) => ({
        ...item,
        mediaItem: innerDecorated[idx],
        viewerOperations: albumViewerMemberRole?.operations ?? [],
        viewerIsOwner: albumViewerMemberRole === AlbumMemberRole.owner,
      }));
    };

    return {
      toAlbums,
      toAlbum,
      toItems,
      toItem,
      toNestedItems,
    };
  };
};
