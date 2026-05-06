import { ViewerOperation } from '@packages/contracts';
import { EntityId } from '../../../types/types';

export * from './viewerAlbumReadService.types';
export * from './viewerMediaItemReadService.types';

export interface HasId {
  id: EntityId;
}

export type UnDecoratedItem<T extends HasId> = T;

export type DecoratedItem<T extends HasId> = T & {
  viewerIsOwner: boolean;
  viewerOperations: ViewerOperation[];
};

// export type UnDecoratedItem<T> = Omit<T, 'id'> & {
//   id: EntityId;
// };

// export type DecoratedItem<T> = Omit<T, 'id'> & {
//   id: EntityId;
//   viewerIsOwner: boolean;
//   viewerOperations: ViewerOperation[];
// };

// export type DecoratedAlbum<T> = T & {
//   id: EntityId;
//   viewerIsOwner: boolean;
//   viewerOperations: ViewerOperation[];
// };

// export type UnDecoratedMediaItem<T> = T & {
//   id: EntityId;
//   ownerId: EntityId;
// };

// export type DecoratedMediaItem<T> = T & {
//   id: EntityId;
//   ownerId: EntityId;
//   viewerIsOwner: boolean;
//   viewerOperations: ViewerOperation[];
// };
export type UnDecoratedNestedMediaItem<T extends HasId, U extends HasId> = T & {
  mediaItem: UnDecoratedItem<U>;
};

export type DecoratedNestedMediaItem<T extends HasId, U extends HasId> = T & {
  viewerIsOwner: boolean;
  viewerOperations: ViewerOperation[];
  mediaItem: DecoratedItem<U>;
};
