import { EntityId } from '../../types/types';

type Identifiable = {
  id: EntityId;
};

type DiffResult<TPersisted, TDesired> = {
  toInsert: TDesired[];
  toDelete: TPersisted[];
  toUpdate: Array<{
    existing: TPersisted;
    item: TDesired;
  }>;
};

export const diffCollectionById = <TPersisted extends Identifiable, TDesired extends Identifiable>(
  persisted: readonly TPersisted[],
  desired: readonly TDesired[],
  options: {
    hasMeaningfulChanges: (existing: TPersisted, item: TDesired) => boolean;
  },
): DiffResult<TPersisted, TDesired> => {
  const persistedById = new Map(persisted.map((item) => [item.id, item]));
  const desiredById = new Map(desired.map((item) => [item.id, item]));

  const toInsert: TDesired[] = [];
  const toDelete: TPersisted[] = [];
  const toUpdate: Array<{ existing: TPersisted; item: TDesired }> = [];

  for (const item of desired) {
    const existing = persistedById.get(item.id);
    if (!existing) {
      toInsert.push(item);
      continue;
    }

    if (options.hasMeaningfulChanges(existing, item)) {
      toUpdate.push({ existing, item });
    }
  }

  for (const item of persisted) {
    if (!desiredById.has(item.id)) {
      toDelete.push(item);
    }
  }

  return {
    toInsert,
    toDelete,
    toUpdate,
  };
};
