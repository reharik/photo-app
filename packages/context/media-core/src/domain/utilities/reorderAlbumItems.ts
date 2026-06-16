import { ContractError, fail, ok, WriteResult } from '@packages/contracts';
import { EntityId } from '../..';
import type { ActorId } from '../../types/types';
import { AlbumItem } from '../Album/AlbumItem';
import { albumItemOrderIndexForOrdinal } from '../Album/albumItemOrder';

export const reorderAlbumItems = (
  orderedAlbumItemIds: EntityId[],
  items: AlbumItem[],
  actorId: ActorId,
): WriteResult<AlbumItem[]> => {
  if (orderedAlbumItemIds.length !== items.length) {
    return fail(ContractError.InvalidAlbumItemOrder);
  }
  const idSet = new Set(items.map((i) => i.id()));
  const seen = new Set<EntityId>();
  for (const id of orderedAlbumItemIds) {
    if (!idSet.has(id) || seen.has(id)) {
      return fail(ContractError.InvalidAlbumItemOrder);
    }
    seen.add(id);
  }
  const byId = new Map(items.map((i) => [i.id(), i]));
  const reordered: AlbumItem[] = [];
  for (let i = 0; i < orderedAlbumItemIds.length; i++) {
    const id = orderedAlbumItemIds[i];
    if (id === undefined) {
      return fail(ContractError.InvalidAlbumItemOrder);
    }
    const item = byId.get(id);
    if (!item) {
      return fail(ContractError.InvalidAlbumItemOrder);
    }
    item.setOrderIndex(albumItemOrderIndexForOrdinal(i), actorId);
    reordered.push(item);
  }

  return ok(reordered);
};
