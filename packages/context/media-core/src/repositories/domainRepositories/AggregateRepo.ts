// repository-helpers.ts

import type { Knex } from 'knex';
import type { AggregateRoot } from '../../domain/AggregateRoot';
import type { Entity, VOCollection } from '../../domain/Entity';

export const persistRoot = async <T extends AggregateRoot<Record<string, unknown>>>(
  trx: Knex.Transaction,
  tableName: string,
  aggregate: T,
): Promise<void> => {
  const row = aggregate.toPersistence();
  if (aggregate.isNew()) {
    await trx(tableName).insert(row);
  } else if (aggregate.isDirty()) {
    await trx(tableName).where({ id: row.id }).update(row);
  }
};
export const persist = async <T extends Entity<Record<string, unknown>>>(
  trx: Knex.Transaction,
  entity: T,
): Promise<void> => {
  // 1. Write own row based on state
  const tableName = entity.tableName();
  await persistRoot(trx, tableName, entity);

  // 2. Recurse into entity children
  const children = entity.childEntities();
  for (const current of Object.values(children)) {
    for (const child of current.upsert) {
      await persist(trx, child);
    }
    for (const removedChild of current.removed) {
      await removeRecursive(trx, removedChild);
    }
  }

  // 3. Persist VO collections (deltas — adds and explicit removes)
  const vos = entity.VOs();
  for (const voCollection of Object.values(vos)) {
    await persistValueCollection(trx, voCollection);
  }
};

const removeRecursive = async <T extends Entity<Record<string, unknown>>>(
  trx: Knex.Transaction,
  entity: T,
): Promise<void> => {
  // Delete child entities first (FK order). VO rows are handled by DB cascade.
  const children = entity.childEntities();
  for (const current of Object.values(children)) {
    for (const child of [...current.upsert, ...current.removed]) {
      await removeRecursive(trx, child);
    }
  }

  // Delete self. DB cascade removes any VO rows (and any other ON DELETE CASCADE descendants).
  await trx(entity.tableName()).where({ id: entity.id() }).delete();
};

export const persistValueCollection = async <T>(
  trx: Knex.Transaction,
  collection: VOCollection<T>,
): Promise<void> => {
  const { tableName, upsert, removed, conflictKeys } = collection;

  if (upsert.length) {
    await trx(tableName).insert(upsert).onConflict(conflictKeys).merge();
  }

  if (removed.length) {
    for (const where of removed) {
      await trx(tableName).where(where).delete();
    }
  }
};
