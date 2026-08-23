import { DomainEventBase } from '../../domainEvents/DomainEvent';
import { EntityId } from '../../types/types';

export interface MediaItemAddedToAlbum extends DomainEventBase {
  kind: 'mediaItemAddedToAlbum';
  mediaItemId: EntityId;
  albumId: EntityId;
}

export interface MediaItemRemovedFromAlbum extends DomainEventBase {
  kind: 'mediaItemRemovedFromAlbum';
  mediaItemId: EntityId;
  albumId: EntityId;
}
export interface AlbumSharedWithUser extends DomainEventBase {
  kind: 'albumSharedWithUser';
  userId: EntityId;
  albumId: EntityId;
  authorizationId: EntityId;
}

export interface AlbumSharedWithPendingUser extends DomainEventBase {
  kind: 'albumSharedWithPendingUser';
  userId: EntityId;
  albumId: EntityId;
  authorizationId: EntityId;
}

export interface AlbumSharedWithPublicLink extends DomainEventBase {
  kind: 'albumSharedWithPublicLink';
  albumId: EntityId;
  authorizationId: EntityId;
}
