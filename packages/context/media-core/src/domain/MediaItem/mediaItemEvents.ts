import { EntityId } from '../../types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

export interface MediaItemsSharedWithUser extends DomainEventBase {
  kind: 'mediaItemsSharedWithUser';
  userId: EntityId;
  mediaItemIds: EntityId[];
}
