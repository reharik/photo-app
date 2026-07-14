import { Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { isPublicLinkAuthRecord, isUserAuthRecord } from '../../domain';
import { EntityId } from '../../types';

export type SystemAuthorizationRepository = {
  getAuthorizationsByAlbumId: (albumIds: EntityId[]) => Promise<Authorizations>;
  getAuthorizationsByIds: (ids: EntityId[]) => Promise<Authorizations>;
};

export type Authorizations = {
  publicLinkAuthorizations: PublicLinkAuthorizationRow[];
  userAuthorizations: UserAuthorizationRow[];
};

export type SystemAuthorizationRepositoryDeps = {
  database: Knex;
};

type AuthorizationRow = {
  id: string;
  mediaItemId?: EntityId;
  albumId?: EntityId;
  grantedBy: EntityId;
  grantedToUser?: EntityId;
  linkToken?: string;
  operations: Operation[];
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};
type AlbumTarget = { kind: 'album'; albumId: EntityId };
type ItemTarget = { kind: 'mediaItem'; mediaItemId: EntityId };
export type UserAuthorizationRow = Omit<
  AuthorizationRow,
  'grantedToUser' | 'linkToken' | 'albumId' | 'mediaItemId'
> & {
  kind: 'user';
  grantedToUser: EntityId;
  target: AlbumTarget | ItemTarget;
};

export type PublicLinkAuthorizationRow = Omit<
  AuthorizationRow,
  'grantedToUser' | 'linkToken' | 'albumId' | 'mediaItemId'
> & {
  kind: 'publicLink';
  linkToken: string;
  target: AlbumTarget;
};

const authorizationFields = [
  'id',
  'mediaItemId',
  'albumId',
  'grantedBy',
  'grantedToUser',
  'linkToken',
  'operations',
  'expiresAt',
  'revokedAt',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
];

export type UpsertInput = {
  accessGrantId: EntityId;
  mediaItemId: EntityId;
  operations: string[];
  createdBy: EntityId;
  updatedBy: EntityId;
};

const toTarget = (r: AuthorizationRow): AlbumTarget | ItemTarget => {
  if (r.albumId) return { kind: 'album', albumId: r.albumId };
  if (r.mediaItemId) return { kind: 'mediaItem', mediaItemId: r.mediaItemId };
  throw new Error(`Authorization ${r.id} has neither albumId nor mediaItemId`);
};

const toAlbumTarget = (r: AuthorizationRow): AlbumTarget => {
  const t = toTarget(r);
  if (t.kind !== 'album') throw new Error(`Public link ${r.id} must target an album`);
  return t;
};

export const build__SystemAuthorizationRepository = ({
  database,
}: SystemAuthorizationRepositoryDeps): SystemAuthorizationRepository => ({
  getAuthorizationsByAlbumId: async (albumIds: EntityId[]): Promise<Authorizations> => {
    const rows = await withEnumRevival(
      database('access_grant')
        .select<AuthorizationRow[]>(authorizationFields)
        .whereIn('albumId', albumIds)
        .whereNull('accessGrant.revokedAt')
        .where((b) => {
          b.whereNull('accessGrant.expiresAt').orWhere(
            'accessGrant.expiresAt',
            '>',
            database.fn.now(),
          );
        }),
      { operations: Operation },
      { strict: true },
    );
    const userAuthorizations: UserAuthorizationRow[] = [];
    const publicLinkAuthorizations: PublicLinkAuthorizationRow[] = [];
    for (const row of rows) {
      if (isUserAuthRecord(row)) {
        userAuthorizations.push({ ...row, kind: 'user', target: toAlbumTarget(row) });
      } else if (isPublicLinkAuthRecord(row)) {
        publicLinkAuthorizations.push({ ...row, kind: 'publicLink', target: toAlbumTarget(row) });
      } else {
        throw new Error(`Authorization ${row.id} violates grantedToUser XOR linkToken`);
      }
    }
    return { userAuthorizations, publicLinkAuthorizations };
  },

  getAuthorizationsByIds: async (ids: EntityId[]): Promise<Authorizations> => {
    const rows = await withEnumRevival(
      database('access_grant').select<AuthorizationRow[]>(authorizationFields).whereIn('id', ids),
      { operations: Operation },
      { strict: true },
    );
    const userAuthorizations: UserAuthorizationRow[] = [];
    const publicLinkAuthorizations: PublicLinkAuthorizationRow[] = [];
    for (const row of rows) {
      if (isUserAuthRecord(row)) {
        userAuthorizations.push({ ...row, kind: 'user', target: toTarget(row) });
      } else if (isPublicLinkAuthRecord(row)) {
        publicLinkAuthorizations.push({ ...row, kind: 'publicLink', target: toAlbumTarget(row) });
      } else {
        throw new Error(`Authorization ${row.id} violates grantedToUser XOR linkToken`);
      }
    }
    return { userAuthorizations, publicLinkAuthorizations };
  },
});
