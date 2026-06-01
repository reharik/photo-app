import { ReactionEmoji, ReactionTargetType } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import { Reaction, ReactionRecord } from '../../domain/Reaction/Reaction';
import { RunInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

type ReactionRepositoryDeps = { runInTransaction: RunInTransaction };

export type ReactionRepository = {
  getById: (id: EntityId) => Promise<Reaction | undefined>;
  save: (reaction: Reaction, trx: Knex.Transaction) => Promise<void>;
  delete: (reaction: Reaction, trx: Knex.Transaction) => Promise<boolean>;
};

export const build__ReactionRepository = ({
  runInTransaction,
}: ReactionRepositoryDeps): ReactionRepository => ({
  getById: async (id: EntityId, trx?: Knex.Transaction): Promise<Reaction | undefined> => {
    const reaction = await runInTransaction(
      trx,
      async (db) =>
        await withEnumRevival(
          db<ReactionRecord>('reaction').where({ id }).first(),
          { targetType: ReactionTargetType, emoji: ReactionEmoji },
          { strict: true },
        ),
    );
    return reaction ? Reaction.rehydrate(reaction) : undefined;
  },

  save: async (reaction: Reaction, trx: Knex.Transaction): Promise<void> => {
    const record = reaction.toPersistence();
    await trx('reaction')
      .insert(record)
      .onConflict(['target_type', 'target_id', 'user_id', 'emoji'])
      .ignore();
  },

  delete: async (reaction: Reaction, trx: Knex.Transaction): Promise<boolean> => {
    const deleted = await trx('reaction').where({ id: reaction.id() }).delete();
    return deleted > 0;
  },
});
