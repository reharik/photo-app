import { EntityId } from '../../types';
import {
  AlbumSharedWithPendingUser,
  AlbumSharedWithPublicLink,
  AlbumSharedWithUser,
  MediaItemAddedToAlbum,
  MediaItemRemovedFromAlbum,
} from '../Album/albumEvents';

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
    | AlbumSharedWithPendingUser
    | CommentPosted
    | MediaItemAddedToAlbum
    | MediaItemRemovedFromAlbum
    | PendingUserActivated
    | ReactionAdded
  );
