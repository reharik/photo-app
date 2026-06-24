// repository-helpers.ts

import type { AggregateRoot } from '../../domain/AggregateRoot';
import type { Entity, VOCollection } from '../../domain/Entity';
import { serializeValue } from '../../domain/utilities/serializeAggregates';
import { UnitOfWork } from '../../infrastructure';

export const persistRoot = async <T extends AggregateRoot<Record<string, unknown>>>(
  tableName: string,
  aggregate: T,
  uow: UnitOfWork,
): Promise<void> => {
  const row = aggregate.toPersistence();
  if (aggregate.isNew()) {
    await uow.db()(tableName).insert(row);
  } else if (aggregate.isDirty()) {
    await uow.db()(tableName).where({ id: row.id }).update(row);
  }
};
export const persist = async <T extends Entity<Record<string, unknown>>>(
  entity: T,
  uow: UnitOfWork,
): Promise<void> => {
  // 1. Write own row based on state
  const tableName = entity.tableName();
  await persistRoot(tableName, entity, uow);

  // 2. Recurse into entity children
  const children = entity.childEntities();
  for (const current of Object.values(children)) {
    for (const child of current.upsert) {
      await persist(child, uow);
    }
    for (const removedChild of current.removed) {
      await removeRecursive(removedChild, uow);
    }
  }

  // 3. Persist VO collections (deltas — adds and explicit removes)
  const vos = entity.VOs();
  for (const voCollection of Object.values(vos)) {
    await persistValueCollection(voCollection, uow);
  }
};

const removeRecursive = async <T extends Entity<Record<string, unknown>>>(
  entity: T,
  uow: UnitOfWork,
): Promise<void> => {
  // Delete child entities first (FK order). VO rows are handled by DB cascade.
  const children = entity.childEntities();
  for (const current of Object.values(children)) {
    for (const child of [...current.upsert, ...current.removed]) {
      await removeRecursive(child, uow);
    }
  }

  // Delete self. DB cascade removes any VO rows (and any other ON DELETE CASCADE descendants).
  await uow.db()(entity.tableName()).where({ id: entity.id() }).delete();
};

export const persistValueCollection = async <T>(
  collection: VOCollection<T>,
  uow: UnitOfWork,
): Promise<void> => {
  const { tableName, upsert, removed, conflictKeys } = collection;

  if (upsert.length) {
    const rows = upsert.map((row) => serializeValue(row) as Record<string, unknown>);
    await uow.db()(tableName).insert(rows).onConflict(conflictKeys).merge();
  }

  if (removed.length) {
    for (const where of removed) {
      await uow
        ?.db()(tableName)
        .where(serializeValue(where) as Record<string, unknown>)
        .delete();
    }
  }
};
