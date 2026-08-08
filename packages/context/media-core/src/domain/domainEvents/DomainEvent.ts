import { EntityId } from '../../types';
import {
  AlbumSharedWithPendingUser,
  AlbumSharedWithPublicLink,
  AlbumSharedWithUser,
  MediaItemAddedToAlbum,
  MediaItemRemovedFromAlbum,
} from '../Album/albumEvents';
import {
  AuthorizationExpired,
  AuthorizationRevoked,
  PendingUserAuthorizationExpired,
  PendingUserAuthorizationRevoked,
  PublicLinkExpired,
  PublicLinkRevoked,
} from '../Authorization/authorizationEvents';
import { CommentPosted, ReactionAdded } from '../Comment/commentEvents';
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
    | AlbumSharedWithPublicLink
    | AlbumSharedWithUser
    | AuthorizationExpired
    | AuthorizationRevoked
    | AlbumSharedWithPendingUser
    | PendingUserAuthorizationExpired
    | PendingUserAuthorizationRevoked
    | CommentPosted
    | MediaItemAddedToAlbum
    | MediaItemRemovedFromAlbum
    | PendingUserActivated
    | PublicLinkExpired
    | PublicLinkRevoked
    | ReactionAdded
  );
