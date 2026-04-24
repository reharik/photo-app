import { ShareLinkPermissionEnum } from '@packages/contracts';
import { withEnumRevival } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import type { ShareLinkRecord } from '../../domain/Share/ShareLink';
import { ShareLink } from '../../domain/Share/ShareLink';
import { RepoOptions, runInTransaction } from '../../infrastructure/repositories/runInTransaction';
import type { EntityId } from '../../types/types';

export type ShareLinkRepository = {
  getById: (id: EntityId) => Promise<ShareLink | undefined>;
  save: (shareLink: ShareLink, albumId: EntityId, options?: RepoOptions) => Promise<void>;
};

type ShareLinkRepositoryDeps = { database: Knex };

export const buildShareLinkRepository = ({
  database,
}: ShareLinkRepositoryDeps): ShareLinkRepository => {
  const getById = async (id: EntityId): Promise<ShareLink | undefined> => {
    const shareLinkRow = await withEnumRevival(
      database<ShareLinkRecord>('shareLink').where({ id }).first(),
      { permission: ShareLinkPermissionEnum },
      { strict: true },
    );

    if (!shareLinkRow) {
      return;
    }

    return ShareLink.rehydrate(shareLinkRow);
  };

  const save = async (
    shareLink: ShareLink,
    albumId: EntityId,
    options?: RepoOptions,
  ): Promise<void> => {
    await runInTransaction(database, options, async (trx) => {
      const record = shareLink.toPersistence();
      const row = { ...record, albumId };

      const existing = await trx<ShareLinkRecord>('shareLink').where({ id: record.id }).first();

      if (existing) {
        await trx<ShareLinkRecord>('shareLink').where({ id: record.id }).update(row);
      } else {
        await trx<ShareLinkRecord>('shareLink').insert(row);
      }
    });
  };

  return {
    getById,
    save,
  };
};
