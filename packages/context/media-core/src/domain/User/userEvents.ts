import { EntityId } from '../../types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

export interface PendingUserActivated extends DomainEventBase {
  kind: 'pendingUserActivated';
  authorizationIds: EntityId[];
  userId: EntityId;
}
