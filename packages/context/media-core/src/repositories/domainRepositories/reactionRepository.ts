import { ReactionTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { Reaction, ReactionRecord } from '../../domain/Reaction/Reaction';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

type ReactionRepositoryDeps = { database: Knex };

export type ReactionRepository = {
  getById: (id: EntityId) => Promise<Reaction | undefined>;
  save: (reaction: Reaction, options?: RepoOptions) => Promise<void>;
  delete: (reaction: Reaction, options?: RepoOptions) => Promise<boolean>;
};

export const build__ReactionRepository = ({
  database,
}: ReactionRepositoryDeps): ReactionRepository => ({
  getById: async (id: EntityId): Promise<Reaction | undefined> => {
    const reaction = await withEnumRevival(
      database<ReactionRecord>('reaction').where({ id }).first(),
      { reactionTargetType: ReactionTargetType },
      { strict: true },
    );
    return reaction ? Reaction.rehydrate(reaction) : undefined;
  },

  save: async (reaction: Reaction, options?: RepoOptions): Promise<void> => {
    const record = reaction.toRecord();
    await runInTransaction(database, options, async (trx) => {
      await trx('reaction')
        .insert(record)
        .onConflict(['target_type', 'target_id', 'user_id', 'emoji'])
        .ignore();
    });
  },

  delete: async (reaction: Reaction, options?: RepoOptions): Promise<boolean> => {
    return runInTransaction(database, options, async (trx) => {
      const deleted = await trx('reaction').where({ id: reaction.id() }).delete();
      return deleted > 0;
    });
  },
});
