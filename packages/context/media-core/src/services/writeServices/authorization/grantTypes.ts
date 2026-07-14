import { ContractError, Operation } from '@packages/contracts';
import {
  MediaItem,
  MediaItemsSharedWithUser,
  PendingUser,
  PublicLinkSharedWithUser,
  User,
} from '../../../domain';
import { UserAuthorization } from '../../../domain/Authorization/UserAuthorization';
import { EntityId } from '../../../types/types';

export type GrantEmailDTO = {
  template: string;
  inviteeEmail: string;
  inviterName: string;
  title: string;
  tokenOrUserId?: string;
  isPublicLink?: boolean;
};

export type GrantUserAuthorizationResult = {
  invitedUsers: (User | PendingUser)[];
  errors: { user: User | PendingUser; error: ContractError }[];
  publicLinkFailure?: { handles: string[]; error: ContractError };
};

export type GrantUserAuthorizationCommand = {
  viewerId: EntityId;
  entityIds: EntityId[];
  operations: Operation[];
  grantedToHandles: string[];
  label?: string;
  expiresAt?: Date;
};

export type InviteUsersForMediaItemsResult = {
  // grants: { mediaItem: MediaItem; authorization: Authorization }[];
  // emailDTOs: GrantEmailDTO[];
  errors: { user: PendingUser | User; error: ContractError }[]; // user-facing: zero-success users
  errorDetail: { user: PendingUser | User; mediaItem: MediaItem; error: ContractError }[]; // log only
  // addedInvitees: User[];
  serviceEvents: (MediaItemsSharedWithUser | PublicLinkSharedWithUser)[];
  authorizations: UserAuthorization[];
};
