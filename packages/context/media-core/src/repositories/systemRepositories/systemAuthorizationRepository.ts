import { Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemAuthorizationRepository = {
  getAuthorizationsByAlbumId: (albumIds: EntityId[]) => Promise<AuthorizationRow[]>;
  getAuthorizationsByIds: (ids: EntityId[]) => Promise<AuthorizationRow[]>;
  pruneGrantsForAuthorization: (authId: EntityId, keepIds: EntityId[]) => Promise<void>;
  upsertGrants: (input: UpsertInput[]) => Promise<void>;
};

export type SystemAuthorizationRepositoryDeps = {
  database: Knex;
};

type AuthorizationRow = {
  id: string;
  mediaItemId: EntityId;
  albumId: EntityId;
  grantedBy: EntityId;
  grantedToUser: EntityId;
  operations: Operation[];
  expiresAt?: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
};

const authorizationFields = [
  'id',
  'mediaItemId',
  'albumId',
  'grantedBy',
  'grantedToUser',
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

export const build__SystemAuthorizationRepository = ({
  database,
}: SystemAuthorizationRepositoryDeps): SystemAuthorizationRepository => ({
  getAuthorizationsByAlbumId: (albumIds: EntityId[]): Promise<AuthorizationRow[]> => {
    return withEnumRevival(
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
      { operation: Operation },
      { strict: true },
    );
  },
  getAuthorizationsByIds: (ids: EntityId[]): Promise<AuthorizationRow[]> => {
    return withEnumRevival(
      database('access_grant').select<AuthorizationRow[]>(authorizationFields).whereIn('id', ids),
      { operation: Operation },
      { strict: true },
    );
  },
  pruneGrantsForAuthorization: (authId: EntityId, keepIds: EntityId[]) => {
    const del = database('grant').where({ accessGrantId: authId });
    if (keepIds.length) del.whereNotIn('mediaItemId', keepIds);
    return del.delete(); // empty desired → deletes ALL this auth's grants (correct)
  },
  upsertGrants: async (input: UpsertInput[]) => {
    await database('grant')
      .insert(input)
      .onConflict(['accessGrantId', 'mediaItemId'])
      .merge(['operations', 'updatedBy']);
  },
});
