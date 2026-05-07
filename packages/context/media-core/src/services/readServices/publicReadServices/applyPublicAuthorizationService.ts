import { AlbumMemberRole } from '@packages/contracts';
import { PublicReadServiceFactoryBase } from '../readServiceBaseType';
import {
  DecoratedItem,
  DecoratedNestedMediaItem,
  HasId,
  UnDecoratedItem,
  UnDecoratedNestedMediaItem,
} from '../types';
import { PublicMediaItemAuthzService } from './publicMediaItemAuthzService';

type ApplyPublicAuthorizationServiceFactoryDeps = {
  publicMediaItemAuthzService: PublicMediaItemAuthzService;
};

export interface ApplyPublicAuthorizationServiceFactory extends PublicReadServiceFactoryBase {
  (args: { publicLinkId: string }): ApplyPublicAuthorizationService;
}

export interface ApplyPublicAuthorizationService {
  toAlbums: <T extends HasId & { viewerMemberRole?: AlbumMemberRole }>(
    items: UnDecoratedItem<T>[],
  ) => Promise<DecoratedItem<T>[]>;
  toAlbum: <T extends HasId & { viewerMemberRole?: AlbumMemberRole }>(
    item: UnDecoratedItem<T>,
  ) => Promise<DecoratedItem<T>>;
  toPublicItems: <T extends HasId>(items: UnDecoratedItem<T>[]) => Promise<DecoratedItem<T>[]>;
  toPublicItem: <T extends HasId>(item: UnDecoratedItem<T>) => Promise<DecoratedItem<T>>;
  toPublicNestedItems: <T extends HasId, U extends HasId>(
    items: UnDecoratedNestedMediaItem<T, U>[],
    albumViewerMemberRole?: AlbumMemberRole,
  ) => Promise<DecoratedNestedMediaItem<T, U>[]>;
}

export const build__ApplyPublicAuthorizationServiceFactory = ({
  publicMediaItemAuthzService,
}: ApplyPublicAuthorizationServiceFactoryDeps): ApplyPublicAuthorizationServiceFactory => {
  return ({ publicLinkId }: { publicLinkId: string }) => {
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
      return publicMediaItemAuthzService.addPublicAuthzToItems(publicLinkId, items);
    };
    // Public Media Item
    const toPublicItems = async <T extends HasId>(
      items: UnDecoratedItem<T>[],
    ): Promise<DecoratedItem<T>[]> => {
      return publicMediaItemAuthzService.addPublicAuthzToItems(publicLinkId, items);
    };

    const toPublicItem = async <T extends HasId>(
      item: UnDecoratedItem<T>,
    ): Promise<DecoratedItem<T>> => {
      const result = await toItems([item]);
      return result[0];
    };

    // Nested Items
    const toPublicNestedItems = async <T extends HasId, U extends HasId>(
      items: UnDecoratedNestedMediaItem<T, U>[],
      albumViewerMemberRole?: AlbumMemberRole,
    ): Promise<DecoratedNestedMediaItem<T, U>[]> => {
      // 1. decorate the inner mediaItems
      const innerDecorated = await toPublicItems(items.map((i) => i.mediaItem));

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
      toPublicItems,
      toPublicItem,
      toPublicNestedItems,
    };
  };
};
