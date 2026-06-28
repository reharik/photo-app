import { Operation } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemAuthorizationRepository = {
  getAuthorizationsByAlbumId: (albumId: EntityId[]) => Promise<AuthorizationRow[]>;
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

export const build__SystemAuthorizationRepository = ({
  database,
}: SystemAuthorizationRepositoryDeps): SystemAuthorizationRepository => ({
  getAuthorizationsByAlbumId: (albumId: EntityId[]): Promise<AuthorizationRow[]> => {
    return withEnumRevival(
      database('access_grant')
        .select<AuthorizationRow[]>(authorizationFields)
        .whereIn('albumId', albumId)
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
});
