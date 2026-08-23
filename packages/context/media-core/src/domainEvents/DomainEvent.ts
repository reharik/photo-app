import {
  AlbumSharedWithPendingUser,
  AlbumSharedWithPublicLink,
  AlbumSharedWithUser,
  MediaItemAddedToAlbum,
  MediaItemRemovedFromAlbum,
} from '../domain/Album/albumEvents';
import { EntityId } from '../types';

import { CommentPosted, ReactionAdded } from '../domain/Comment/commentEvents';
import { PendingUserActivated } from '../domain/User/userEvents';

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
    | AlbumSharedWithPendingUser
    | CommentPosted
    | MediaItemAddedToAlbum
    | MediaItemRemovedFromAlbum
    | PendingUserActivated
    | ReactionAdded
  );
