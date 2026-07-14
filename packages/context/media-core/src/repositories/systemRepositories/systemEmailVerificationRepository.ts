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
  // Autocommit on its own pooled connection — deliberately OUTSIDE any unit of work.
  // The attempt counter must persist even when the surrounding password-reset transaction
  // is rolled back (invalid-code path), otherwise the `attemptCount >= 3` lockout can never
  // trigger. A single statement on raw `database` commits immediately; callers must await it
  // BEFORE rolling back the uow so the bump is durable regardless of the transaction outcome.
  bumpValidationAttempts: (id: EntityId) => {
    return database('emailVerification').where({ id }).increment('attemptCount', 1);
  },
});
