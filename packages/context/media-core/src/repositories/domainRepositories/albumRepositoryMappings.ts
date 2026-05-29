import { Operation } from '@packages/contracts';
import { AuthorizationRecord } from 'src/domain/Authorization/Authorization';
import { PublicLinkChildRecords, PublicLinkRecord } from '../../domain/PublicLink/PublicLink';

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

export const publicLinkSelectColumns = [
  'shareLink.id as id',
  'shareLink.albumId as albumId',
  'shareLink.linkToken as linkToken',
  'shareLink.grantedBy as grantedBy',
  'shareLink.expiresAt as expiresAt',
  'shareLink.revokedAt as revokedAt',
  'shareLink.createdAt as createdAt',
  'shareLink.updatedAt as updatedAt',
  'shareLink.createdBy as createdBy',
  'shareLink.updatedBy as updatedBy',
  ...authorizationSelectColumns,
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

export const publicLinkWithAuthorizationRawToPublicLink = (
  row: PublicLinkWithAuthorizationRaw,
): { publicLink: PublicLinkRecord; publicLinkChildRecords: PublicLinkChildRecords } => {
  return {
    publicLink: {
      id: row.id,
      albumId: row.albumId,
      linkToken: row.linkToken,
      grantedBy: row.grantedBy,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
    },
    publicLinkChildRecords: {
      authorization: authorizationRawToAuthorizationRecord(row),
    },
  };
};
