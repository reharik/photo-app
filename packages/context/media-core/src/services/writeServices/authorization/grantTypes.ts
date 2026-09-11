import { ContractError, EntityId } from '@packages/contracts';
import { PendingUser, User } from '../../../domain';

export type GrantUserAuthorizationResult = {
  invitedUsers: (User | PendingUser)[];
  errors: { item: User | PendingUser; error: ContractError }[];
};

export type GrantUserAuthorizationCommand = {
  viewerFirstName: string;
  viewerLastName: string;
  entityIds: EntityId[];
  grantedToHandles: string[];
  label?: string;
};
