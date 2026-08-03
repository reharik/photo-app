import { EntityId } from '../../types';
import { DomainEventBase } from '../domainEvents/DomainEvent';

export interface PublicLinkSharedWithUser extends DomainEventBase {
  kind: 'publicLinkSharedWithUser';
  userId: EntityId;
  publicLinkAuthorizationId: EntityId;
}

export interface PublicLinkExpired extends DomainEventBase {
  kind: 'publicLinkExpired';
  authorizationId: EntityId;
}

export interface PublicLinkRevoked extends DomainEventBase {
  kind: 'publicLinkRevoked';
  authorizationId: EntityId;
}
