import { ContractError, Operation, WriteResult } from '@packages/contracts';
import { Authorization, MediaItem, PublicLink, User } from '../../../domain';
import { ActorId, EntityId } from '../../../types/types';

export type GrantEmailDTO = {
  template: string;
  inviteeEmail: string;
  inviterName: string;
  title: string;
  tokenOrUserId?: string;
  isPublicLink?: boolean;
};

export type GrantUserAuthorizationResult = {
  authorizations: Authorization[];
  emailDTOs: GrantEmailDTO[];
  errors: { user: User; error: ContractError }[];
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

export interface GrantAuthorizationInterface {
  id(): EntityId;
  grantPublicLink(
    actorId: ActorId,
    expiresAt?: Date,
    operations?: Operation[],
  ): WriteResult<PublicLink>;

  grantAuthorization(
    operations: Operation[],
    actorId: ActorId,
    grantedToUserId?: EntityId,
    label?: string,
    expiresAt?: Date,
  ): WriteResult<{ authorization: Authorization }>;
}

export type InviteNonUsersResult = {
  authorizations: Authorization[];
  emailDTOs: GrantEmailDTO[];
  publicLinkFailure?: { handles: string[]; error: ContractError };
};

export type InviteUsersForMediaItemsResult = {
  grants: { mediaItem: MediaItem; authorization: Authorization }[];
  // emailDTOs: GrantEmailDTO[];
  errors: { user: User; error: ContractError }[]; // user-facing: zero-success users
  errorDetail: { user: User; mediaItem: MediaItem; error: ContractError }[]; // log only
  addedInvitees: User[];
};
