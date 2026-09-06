import { EmailDeliveryState, EmailStatus, UserStatus } from '@packages/contracts';
import {
  AuthorizationReadRepository,
  EmailShare,
  EmailShareDelivery,
  EmailShareRow,
} from '../../../repositories/readRepositories/types';
import { EntityId } from '../../../types/types';
import { ReadServiceBase } from '../readServiceBaseType';
import { AuthorizationProjection } from '../types';

export interface viewerAuthorizationsReadService extends ReadServiceBase {
  listGrantedAuthorizationsForOwnedMediaItem: (args: {
    mediaItemId: EntityId;
  }) => Promise<AuthorizationProjection[]>;
  listEmailSharesForAlbum: (args: { albumId: EntityId }) => Promise<EmailShare[]>;
  getPublicLinkTokenForAlbum: (args: {
    albumId: EntityId;
  }) => Promise<{ token: string } | undefined>;
}

/**
 * The ONLY link between the hand-authored EmailStatus states and the
 * schema-generated EmailDeliveryState. Nothing else couples them: EmailStatus
 * lives in contracts/src/enums, EmailDeliveryState is emitted into
 * graphqlSmartEnums.ts from the GraphQL SDL, and renaming a member on either
 * side is invisible to the other — the same silent coupling migration 0031
 * documents. Typing the map on EmailStatus['state'] at least makes a new or
 * renamed state fail the build here rather than at runtime.
 */
const DELIVERY_STATE_BY_EMAIL_STATE: Record<EmailStatus['state'], EmailDeliveryState> = {
  pending: EmailDeliveryState.pending,
  delivered: EmailDeliveryState.delivered,
  failed: EmailDeliveryState.failed,
};

/**
 * Collapse the raw status to what the client is allowed to know. BOUNCE_TRANSIENT
 * and COMPLAINT both read as delivered — SES accepted them downstream — and the
 * client never learns either exists.
 */
const toDelivery = (row: EmailShareRow): EmailShareDelivery | undefined => {
  if (!row.deliveryStatus || !row.deliveryAt) {
    return undefined;
  }
  return {
    state: DELIVERY_STATE_BY_EMAIL_STATE[row.deliveryStatus.state],
    at: row.deliveryAt,
  };
};

type viewerAuthorizationsReadServiceDeps = {
  authorizationReadRepository: AuthorizationReadRepository;
  viewerId: string;
};

export const build__viewerAuthorizationsReadService = ({
  authorizationReadRepository,
  viewerId,
}: viewerAuthorizationsReadServiceDeps): viewerAuthorizationsReadService => {
  return {
    listGrantedAuthorizationsForOwnedMediaItem: async ({
      mediaItemId,
    }: {
      mediaItemId: EntityId;
    }): Promise<AuthorizationProjection[]> => {
      const rows = await authorizationReadRepository.getGrantedAuthorizationsForOwnedMediaItem({
        mediaItemId,
        ownerId: viewerId,
      });
      return rows.map((row) => ({
        id: row.id,
        grantedToUserId: row.grantedToUser,
        operations: row.operations,
        label: row.description,
        expiresAt: row.expiresAt,
        revokedAt: row.revokedAt,
        createdAt: row.createdAt,
      }));
    },
    listEmailSharesForAlbum: async ({ albumId }: { albumId: EntityId }): Promise<EmailShare[]> => {
      const result = await authorizationReadRepository.getEmailedAuthorizationsForAlbum({
        albumId,
        viewerId,
      });
      return result.map((x) => ({
        id: x.id,
        email: x.email,
        displayName:
          x.userStatus && x.userStatus.equals(UserStatus.active)
            ? [x.firstName, x.lastName].filter(Boolean).join(' ') || undefined
            : undefined,
        hasAccount: x.userStatus ? x.userStatus.equals(UserStatus.active) : false,
        userId: x.userId,
        createdAt: x.createdAt,
        delivery: toDelivery(x),
      }));
    },
    getPublicLinkTokenForAlbum: async ({
      albumId,
    }: {
      albumId: EntityId;
    }): Promise<{ token: string } | undefined> => {
      const row = await authorizationReadRepository.getPublicAuthorizationByAlbum({
        albumId,
        viewerId,
      });
      return row?.linkToken ? { token: row.linkToken } : undefined;
    },
  };
};
