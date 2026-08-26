import { EntityId } from '../types';
import { DomainEventBase } from './DomainEvent';

export interface PendingUserActivated extends DomainEventBase {
  kind: 'pendingUserActivated';
  authorizationIds: EntityId[];
  userId: EntityId;
}
