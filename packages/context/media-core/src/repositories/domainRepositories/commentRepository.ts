import { ResourceTypeEnum } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { CommentRecord } from '../../domain/Comment/Comment';
import { Comment } from '../../domain/Comment/Comment';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type CommentRepository = {
  getById: (id: EntityId) => Promise<Comment | undefined>;
  save: (comment: Comment, resourceId: EntityId, options?: RepoOptions) => Promise<void>;
};

type CommentRepositoryDeps = { database: Knex };

export const build__CommentRepository = ({
  database,
}: CommentRepositoryDeps): CommentRepository => {
  const getById = async (id: EntityId): Promise<Comment | undefined> => {
    const commentRow = await withEnumRevival(
      database<CommentRecord>('comment').where({ id }).first(),
      { resourceType: ResourceTypeEnum },
      { strict: true },
    );

    if (!commentRow) {
      return;
    }

    return Comment.rehydrate(commentRow);
  };

  const save = async (
    comment: Comment,
    resourceId: EntityId,
    options?: RepoOptions,
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = comment.toPersistence();
      const row = { ...record, resourceId };

      const existing = await trx<CommentRecord>('comment').where({ id: record.id }).first();

      if (existing) {
        await trx<CommentRecord>('comment').where({ id: record.id }).update(row);
      } else {
        await trx<CommentRecord>('comment').insert(row);
      }
    });
  };

  return {
    getById,
    save,
  };
};
