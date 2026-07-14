import { Operation } from '@packages/contracts';
import { AuthorizationRecord } from '../../domain/Authorization/Authorization';

export type PublicLinkWithAuthorizationRaw = {
  id: string;
  albumId: string;
  linkToken: string;
  grantedBy: string;
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
} & AuthorizationRaw;

export type AuthorizationRaw = {
  authorizationId: string;
  authorizationAlbumId?: string;
  authorizationGrantedToUser?: string;
  authorizationGrantedBy: string;
  authorizationOperations: Operation[];
  authorizationLabel?: string;
  authorizationExpiresAt?: Date;
  authorizationRevokedAt?: Date;
  authorizationCreatedAt: Date;
  authorizationUpdatedAt: Date;
  authorizationCreatedBy: string;
  authorizationUpdatedBy: string;
};

export const authorizationSelectColumns = [
  'accessGrant.id as authorizationId',
  'accessGrant.grantedToUser as authorizationGrantedToUser',
  'accessGrant.grantedBy as authorizationGrantedBy',
  'accessGrant.operations as authorizationOperations',
  'accessGrant.label as authorizationLabel',
  'accessGrant.albumId as authorizationAlbumId',
  'accessGrant.expiresAt as authorizationExpiresAt',
  'accessGrant.revokedAt as authorizationRevokedAt',
  'accessGrant.createdAt as authorizationCreatedAt',
  'accessGrant.updatedAt as authorizationUpdatedAt',
  'accessGrant.createdBy as authorizationCreatedBy',
  'accessGrant.updatedBy as authorizationUpdatedBy',
];

export const authorizationRawToAuthorizationRecord = (
  row: AuthorizationRaw,
): AuthorizationRecord => {
  return {
    id: row.authorizationId,
    grantedToUser: row.authorizationGrantedToUser,
    grantedBy: row.authorizationGrantedBy,
    operations: row.authorizationOperations,
    label: row.authorizationLabel,
    albumId: row.authorizationAlbumId,
    expiresAt: row.authorizationExpiresAt,
    revokedAt: row.authorizationRevokedAt,
    createdAt: row.authorizationCreatedAt,
    updatedAt: row.authorizationUpdatedAt,
    createdBy: row.authorizationCreatedBy,
    updatedBy: row.authorizationUpdatedBy,
  };
};
