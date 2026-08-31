import { EntityId } from '../types';
import {
  AlbumSharedWithPendingUser,
  AlbumSharedWithPublicLink,
  AlbumSharedWithUser,
  MediaItemAddedToAlbum,
  MediaItemRemovedFromAlbum,
} from './albumEvents';

import { CommentPosted, ReactionAdded } from './commentEvents';
import { PendingUserActivated } from './userEvents';

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
