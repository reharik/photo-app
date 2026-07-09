import { EntityId } from '../../types/types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

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

export interface AlbumSharedWithNonUser extends DomainEventBase {
  kind: 'albumSharedWithNonUser';
  recipientAddress: string;
  albumId: string;
  token: string;
}
