import { assertNever, AuthorizationKind, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemAuthorizationRepository = {
  getAuthorizationsByAlbumId: (albumIds: EntityId[]) => Promise<Authorizations>;
  getAuthorizationsByIds: (ids: EntityId[]) => Promise<Authorizations>;
  getPublicLinkAuthorizationById: (id: EntityId) => Promise<PublicLinkAuthorizationRow>;
};

export type Authorizations = {
  publicLinkAuthorizations: PublicLinkAuthorizationRow[];
  pendingUserAuthorizations: PendingUserAuthorizationRow[];
  userAuthorizations: UserAuthorizationRow[];
};

export type SystemAuthorizationRepositoryDeps = {
  database: Knex;
};

type AuthorizationRow = {
  id: string;
  albumId: EntityId;
  grantedBy: EntityId;
  grantedToUser?: EntityId;
  linkToken?: string;
  kind: AuthorizationKind;
  operations: Operation[];
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};
export type UserAuthorizationRow = Omit<
  AuthorizationRow,
  'grantedToUser' | 'linkToken' | 'kind'
> & {
  kind: typeof AuthorizationKind.user;
  grantedToUser: EntityId;
};

export type PendingUserAuthorizationRow = Omit<
  AuthorizationRow,
  'grantedToUser' | 'linkToken' | 'kind'
> & {
  kind: typeof AuthorizationKind.pending;
  linkToken: string;
  grantedToUser: EntityId;
};

export type PublicLinkAuthorizationRow = Omit<
  AuthorizationRow,
  'grantedToUser' | 'linkToken' | 'kind'
> & {
  kind: typeof AuthorizationKind.public;
  linkToken: string;
};

export type AnyAuthorizationRow =
  UserAuthorizationRow | PendingUserAuthorizationRow | PublicLinkAuthorizationRow;

/**
 * The narrowing mechanism for these rows. TypeScript only narrows a union on a DIRECT
 * property whose type is a unit type; `kind` is a smart-enum ITEM (an object), and the
 * literal lives one level deeper on `kind.value`. Narrowing a parent union through a
 * nested path is not something TS does (microsoft/TypeScript#18758), so
 * `row.kind.value === 'USER'` narrows the expression and NOT `row` — and `kind.equals()`
 * is declared `this is T`, so it only ever narrows the receiver `row.kind`.
 *
 * A type predicate is the supported mechanism, not a workaround: it re-expresses the
 * nested check as a one-level assertion about `row`. `Extract` keeps it exhaustive —
 * add a fourth kind and every `const _n: never = row` downstream stops compiling.
 */
export const isAuthorizationKind = <V extends AnyAuthorizationRow['kind']['value']>(
  row: AnyAuthorizationRow,
  value: V,
): row is Extract<AnyAuthorizationRow, { kind: { value: V } }> => row.kind.value === value;

// No 'mediaItemId': grants are album-scoped only — a loose item is wrapped in a shadow
// album before sharing — so the column is never read here. It stays in the schema (with its
// XOR check and partial index) but no row type carries it.
const authorizationFields = [
  'id',
  'albumId',
  'kind',
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

/**
 * Split a mixed result set into the three kind-specific buckets.
 *
 * `const _n: never = row` in the final else is the exhaustiveness alarm: because
 * `isAuthorizationKind` narrows via `Extract`, adding a fourth kind to
 * `AnyAuthorizationRow` leaves a row type unaccounted for here and this line stops
 * compiling. That is the whole point of the guard — the old `kind.match()` version
 * cast its way past the type system and would have partitioned a fourth kind into
 * nothing at all, silently.
 */
const partitionByKind = (rows: AnyAuthorizationRow[]): Authorizations => {
  const userAuthorizations: UserAuthorizationRow[] = [];
  const publicLinkAuthorizations: PublicLinkAuthorizationRow[] = [];
  const pendingUserAuthorizations: PendingUserAuthorizationRow[] = [];

  for (const row of rows) {
    if (isAuthorizationKind(row, 'USER')) {
      userAuthorizations.push(row);
    } else if (isAuthorizationKind(row, 'PENDING')) {
      pendingUserAuthorizations.push(row);
    } else if (isAuthorizationKind(row, 'PUBLIC')) {
      publicLinkAuthorizations.push(row);
    } else {
      const _n: never = row;
      return assertNever(_n);
    }
  }
  return { userAuthorizations, pendingUserAuthorizations, publicLinkAuthorizations };
};

export const build__SystemAuthorizationRepository = ({
  database,
}: SystemAuthorizationRepositoryDeps): SystemAuthorizationRepository => ({
  getAuthorizationsByAlbumId: async (albumIds: EntityId[]): Promise<Authorizations> => {
    const rows = await withEnumRevival(
      database('access_grant')
        .select<AnyAuthorizationRow[]>(authorizationFields)
        .whereIn('albumId', albumIds)
        .whereNull('accessGrant.revokedAt')
        .where((b) => {
          b.whereNull('accessGrant.expiresAt').orWhere(
            'accessGrant.expiresAt',
            '>',
            database.fn.now(),
          );
        }),
      { operations: Operation, kind: AuthorizationKind },
      { strict: true },
    );
    return partitionByKind(rows);
  },

  getAuthorizationsByIds: async (ids: EntityId[]): Promise<Authorizations> => {
    const rows = await withEnumRevival(
      database('access_grant')
        .select<AnyAuthorizationRow[]>(authorizationFields)
        .whereIn('id', ids),
      { operations: Operation, kind: AuthorizationKind },
      { strict: true },
    );
    return partitionByKind(rows);
  },

  getPublicLinkAuthorizationById: async (id: EntityId): Promise<PublicLinkAuthorizationRow> => {
    const row = await withEnumRevival(
      database('access_grant').first<AnyAuthorizationRow>(authorizationFields).where({ id }),
      { operations: Operation, kind: AuthorizationKind },
      { strict: true },
    );
    // Selecting by id alone can return any of the three kinds, so the row is typed as the
    // union and the guard both enforces and narrows. `.first<PublicLinkAuthorizationRow>()`
    // asserted the answer instead of proving it.
    if (!isAuthorizationKind(row, 'PUBLIC')) {
      throw new Error(`Authorization ${row.id} is ${row.kind.value}, expected PUBLIC`);
    }
    return row;
  },
});
