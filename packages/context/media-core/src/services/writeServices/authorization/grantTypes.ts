import { ContractError } from '@packages/contracts';
import { PendingUser, User } from '../../../domain';
import { EntityId } from '../../../types/types';

export type GrantUserAuthorizationResult = {
  invitedUsers: (User | PendingUser)[];
  errors: { item: User | PendingUser; error: ContractError }[];
};

export type GrantUserAuthorizationCommand = {
  viewerId: EntityId;
  viewerFirstName: string;
  viewerLastName: string;
  entityIds: EntityId[];
  grantedToHandles: string[];
  label?: string;
};
