import { EntityId } from '../../types/types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

export interface AuthorizationExpired extends DomainEventBase {
  kind: 'authorizationExpired';
  authorizationId: EntityId;
}

export interface AuthorizationRevoked extends DomainEventBase {
  kind: 'authorizationRevoked';
  authorizationId: EntityId;
}
