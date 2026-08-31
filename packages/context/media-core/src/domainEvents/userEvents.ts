import { EntityId } from '../types';
import { DomainEventBase } from './domainEvent';

export interface PendingUserActivated extends DomainEventBase {
  kind: 'pendingUserActivated';
  authorizationIds: EntityId[];
  userId: EntityId;
}
