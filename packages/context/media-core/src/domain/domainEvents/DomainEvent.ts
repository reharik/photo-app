import { EntityId } from '../../types';
import {
  AlbumSharedWithNonUser,
  AlbumSharedWithUser,
  MediaItemAddedToAlbum,
  MediaItemRemovedFromAlbum,
} from '../Album/albumEvents';
import { AuthorizationExpired, AuthorizationRevoked } from '../Authorization/authorizationEvents';
import { MediaItemsSharedWithUser } from '../MediaItem/mediaItemEvents';
import { PendingUserActivated } from '../User/userEvents';

export type DomainEventKind = DomainEvent['kind']; // 'mediaItemAddedToAlbum' | 'MediaItemProcessed'

export type EventPayload<K extends DomainEventKind> = Omit<
  Extract<DomainEvent, { kind: K }>,
  'occurredAt' | 'actorId'
>;

export interface DomainEventBase {
  occurredAt: Date;
  actorId: EntityId;
}

export type DomainEvent = DomainEventBase &
  (
    | MediaItemAddedToAlbum
    | MediaItemRemovedFromAlbum
    | AlbumSharedWithUser
    | MediaItemsSharedWithUser
    | AlbumSharedWithNonUser
    | AuthorizationExpired
    | AuthorizationRevoked
    | PendingUserActivated
  );
