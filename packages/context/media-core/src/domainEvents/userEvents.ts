import { EntityId } from '@packages/contracts';
import { DomainEventBase } from './domainEvent';

export interface PendingUserActivated extends DomainEventBase {
  kind: 'pendingUserActivated';
  authorizationIds: EntityId[];
  userId: EntityId;
}
