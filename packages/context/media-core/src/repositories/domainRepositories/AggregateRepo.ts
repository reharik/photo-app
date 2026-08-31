// repository-helpers.ts

import { AggregateRoot } from '../../domain';
import type { Entity, VOCollection } from '../../domain/Entity';
import { serializeValue } from '../../domain/utilities/serializeAggregates';
import { UnitOfWork } from '../../infrastructure';
import { RequestScopeLifeCycle } from '../../services/readServices/readServiceBaseType';

export interface Persist extends RequestScopeLifeCycle {
  <T extends AggregateRoot<Record<string, unknown>>>(aggregate: T): Promise<void>;
}

type PersistDeps = { uow: UnitOfWork };

export const build__Persist = ({ uow }: PersistDeps): Persist => {
  const persistRoot = async <T extends Entity<Record<string, unknown>>>(
    tableName: string,
    entity: T,
  ): Promise<void> => {
    const row = entity.toPersistence();
    if (entity.isNew()) {
      await uow.db()(tableName).insert(row);
    } else if (entity.isDirty()) {
      await uow.db()(tableName).where({ id: row.id }).update(row);
    }
  };

  const removeRecursive = async <T extends Entity<Record<string, unknown>>>(
    entity: T,
  ): Promise<void> => {
    const children = entity.childEntities();
    for (const current of Object.values(children)) {
      for (const child of [...current.upsert, ...current.removed]) {
        await removeRecursive(child);
      }
    }
    await uow.db()(entity.tableName()).where({ id: entity.id() }).delete();
  };

  const persistValueCollection = async <T>(collection: VOCollection<T>): Promise<void> => {
    const { tableName, upsert, removed, conflictKeys } = collection;
    if (upsert.length) {
      const rows = upsert.map((row) => serializeValue(row) as Record<string, unknown>);
      await uow.db()(tableName).insert(rows).onConflict(conflictKeys).merge();
    }
    for (const where of removed) {
      await uow
        .db()(tableName)
        .where(serializeValue(where) as Record<string, unknown>)
        .delete();
    }
  };

  const persistRecursion = async <T extends Entity<Record<string, unknown>>>(
    entity: T,
  ): Promise<void> => {
    await persistRoot(entity.tableName(), entity);

    const children = entity.childEntities();
    for (const current of Object.values(children)) {
      for (const child of current.upsert) {
        await persistRecursion(child);
      }
      for (const removedChild of current.removed) {
        await removeRecursive(removedChild);
      }
    }

    for (const voCollection of Object.values(entity.VOs())) {
      await persistValueCollection(voCollection);
    }
  };

  return async (aggregate) => {
    await uow.join();
    await persistRecursion(aggregate);
    uow.collectEvents(aggregate.flushEvents());
  };
};
