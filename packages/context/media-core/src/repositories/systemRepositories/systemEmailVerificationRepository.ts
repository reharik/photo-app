import { Knex } from 'knex';
import { EntityId } from '../../types';

export type SystemEmailVerificationRepository = {
  bumpValidationAttempts: (id: EntityId) => Promise<number>;
};

export type SystemEmailVerificationRepositoryDeps = {
  database: Knex;
};

export const build__SystemEmailVerificationRepository = ({
  database,
}: SystemEmailVerificationRepositoryDeps): SystemEmailVerificationRepository => ({
  // Autocommit, OUTSIDE the uow, on its own pooled connection. The attempt
  // counter must survive the rollback that follows on the invalid-code path,
  // or the >= 3 lockout can never trigger. Do not "clean this up" to uow.db().
  bumpValidationAttempts: async (id: EntityId) => {
    return database('emailVerification').where({ id }).increment('attemptCount', 1);
  },
});
