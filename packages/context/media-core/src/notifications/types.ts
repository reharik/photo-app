import {
  NotificationKind,
  NotificationSourceType,
  NotificationTargetType,
} from '@packages/contracts';
import { DomainEvent } from '../domain';
import { UserContact } from '../repositories';
import { EntityId } from '../types';

export type NotificationBranch = 'inAppWriter' | 'asyncWriter';

// Minimal recipient: id + status is all the dispatcher guards need.
// Email/name hydration for the actual send happens later in the async batcher.
export type Recipient = Pick<UserContact, 'id' | 'userStatus'>;

// The canonical intermediate. Resolved ONCE per event, branch-agnostic.
// Both writers map from this — all variability lives upstream in the strategy.
export type ResolvedNotification = {
  recipients: Recipient[];
  actorId: EntityId;
  targetType: NotificationTargetType; // container / context
  targetId: EntityId;
  sourceType: NotificationSourceType; // most-specific entity; == target when none finer; authorization for token cases
  sourceId: EntityId;
  kind: NotificationKind; // resolved here — the reply/root fork is already applied
};

// One per event kind. `branches` declares routing — the grid holes live here,
// as data, not as missing files.
export type NotificationStrategy<K extends DomainEvent['kind'] = DomainEvent['kind']> = {
  handles: K[];
  branches: NotificationBranch[];
  resolve: (event: Extract<DomainEvent, { kind: K }>) => Promise<ResolvedNotification>;
};
