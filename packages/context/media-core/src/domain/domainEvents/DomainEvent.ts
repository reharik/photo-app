import { EntityId } from '../../types';
import {
  AlbumSharedWithPublicLink,
  AlbumSharedWithUser,
  MediaItemAddedToAlbum,
  MediaItemRemovedFromAlbum,
} from '../Album/albumEvents';
import { AuthorizationExpired, AuthorizationRevoked } from '../Authorization/authorizationEvents';
import { CommentPosted, ReactionAdded } from '../Comment/commentEvents';
import { MediaItemsSharedWithUser, PublicLinkSharedWithUser } from '../MediaItem/mediaItemEvents';
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
    | AlbumSharedWithPublicLink
    | AuthorizationExpired
    | AuthorizationRevoked
    | PendingUserActivated
    | PublicLinkSharedWithUser
    | CommentPosted
    | ReactionAdded
  );
