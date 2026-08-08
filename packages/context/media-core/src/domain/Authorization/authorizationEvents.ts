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

export interface PendingUserAuthorizationExpired extends DomainEventBase {
  kind: 'pendingUserAuthorizationExpired';
  authorizationId: EntityId;
}

export interface PendingUserAuthorizationRevoked extends DomainEventBase {
  kind: 'pendingUserAuthorizationRevoked';
  authorizationId: EntityId;
}

export interface PublicLinkExpired extends DomainEventBase {
  kind: 'publicLinkExpired';
  authorizationId: EntityId;
}

export interface PublicLinkRevoked extends DomainEventBase {
  kind: 'publicLinkRevoked';
  authorizationId: EntityId;
}
