import { DomainEventBase } from '../../domainEvents/DomainEvent';
import { EntityId } from '../../types';

export interface PendingUserActivated extends DomainEventBase {
  kind: 'pendingUserActivated';
  authorizationIds: EntityId[];
  userId: EntityId;
}
