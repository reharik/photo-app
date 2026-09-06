import { assertNever, AuthorizationKind, Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';
import { EntityId } from '../../types';
import { withLiveAuthorizationFilter } from '../queryHelpers';

export interface SystemAuthorizationRepository extends RequestScopeLifeCycle {
  getAuthorizationsByAlbumId: (albumIds: EntityId[]) => Promise<Authorizations>;
  getAuthorizationsByIds: (ids: EntityId[]) => Promise<Authorizations>;
  getPendingUserAuthorizationById: (
    id: EntityId,
  ) => Promise<PendingUserAuthorizationRow | undefined>;
}

export type Authorizations = {
  publicLinkAuthorizations: PublicLinkAuthorizationRow[];
  pendingUserAuthorizations: PendingUserAuthorizationRow[];
  userAuthorizations: UserAuthorizationRow[];
};

export type SystemAuthorizationRepositoryDeps = {
  uow: UnitOfWork;
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
  uow,
}: SystemAuthorizationRepositoryDeps): SystemAuthorizationRepository => ({
  getAuthorizationsByAlbumId: async (albumIds: EntityId[]): Promise<Authorizations> => {
    await uow.join();
    const rows = await withEnumRevival(
      uow
        .db()('access_grant')
        .whereIn('albumId', albumIds)
        .modify(withLiveAuthorizationFilter(uow.db()))
        .select<AnyAuthorizationRow[]>(authorizationFields),
      { operations: Operation, kind: AuthorizationKind },
    );
    return partitionByKind(rows);
  },

  getAuthorizationsByIds: async (ids: EntityId[]): Promise<Authorizations> => {
    await uow.join();
    const rows = await withEnumRevival(
      uow
        .db()('access_grant')
        .whereIn('id', ids)
        .modify(withLiveAuthorizationFilter(uow.db()))
        .select<AnyAuthorizationRow[]>(authorizationFields),
      { operations: Operation, kind: AuthorizationKind },
    );
    return partitionByKind(rows);
  },

  getPendingUserAuthorizationById: async (
    id: EntityId,
  ): Promise<PendingUserAuthorizationRow | undefined> => {
    await uow.join();
    const row = await withEnumRevival(
      uow
        .db()('access_grant')
        .where({ id })
        .modify(withLiveAuthorizationFilter(uow.db()))
        .first<AnyAuthorizationRow>(authorizationFields),
      { operations: Operation, kind: AuthorizationKind },
    );
    if (!row) {
      return undefined;
    }
    // Selecting by id alone can return any of the three kinds, so the row is typed as the
    // union and the guard both enforces and narrows. `.first<PublicLinkAuthorizationRow>()`
    // asserted the answer instead of proving it.
    if (!isAuthorizationKind(row, 'PENDING')) {
      throw new Error(`Authorization ${row.id} is ${row.kind.value}, expected PENDING`);
    }
    return row;
  },
});
