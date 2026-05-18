import { Operation, OperationCatalog } from '@packages/contracts';
import { AuthorizationReadRepository } from '../../repositories/readRepositories/authorizationReadRepository';
import { EntityId } from '../../types';
import { DBMediaItemRow, DBPublicMediaItemRow } from './types';

export type MediaItemOperationsService = {
  getOperationsByItem: (
    viewerId: EntityId,
    items: DBMediaItemRow[],
  ) => Promise<Map<string, Operation[]>>;
  getOperationsByPublicItem: (
    publicLinkId: EntityId,
    items: DBPublicMediaItemRow[],
  ) => Promise<Map<string, Operation[]>>;
};

export const build__MediaItemOperationsService = ({
  authorizationReadRepository,
}: {
  authorizationReadRepository: AuthorizationReadRepository;
}): MediaItemOperationsService => {
  /**
   * Returns a decorated entry for every input item. Items the viewer has no
   * access to will have empty `operations` and `viewerIsOwner: false`.
   * Items not found in the database are silently dropped.
   */
  const getOperationsByItem = async (
    viewerId: EntityId,
    items: DBMediaItemRow[],
  ): Promise<Map<string, Operation[]>> => {
    if (items.length === 0) {
      return new Map();
    }

    const mediaItemOperations = await authorizationReadRepository.getMediaItemOperationsFromGrants(
      viewerId,
      items.map((i) => i.id),
    );

    const operationsByItem = new Map<string, Operation[]>();

    for (const item of items) {
      const merged = new Map<string, Operation>();

      // share-derived: grant rows for this item
      for (const row of mediaItemOperations) {
        if (row.mediaItemId === item.id) {
          for (const op of row.operations) merged.set(op.value, op);
        }
      }

      // owner-override
      if (item.ownerId === viewerId) {
        for (const op of OperationCatalog.mediaItem.availableOperations) {
          merged.set(op.value, op);
        }
      }

      operationsByItem.set(item.id, Array.from(merged.values()));
    }

    return operationsByItem;
  };
  const getOperationsByPublicItem = async (
    publicLinkId: EntityId,
    items: DBPublicMediaItemRow[],
  ): Promise<Map<string, Operation[]>> => {
    if (items.length === 0) {
      return new Map();
    }

    const mediaItemOperations =
      await authorizationReadRepository.getPublicMediaItemOperationsFromGrants(
        publicLinkId,
        items.map((i) => i.id),
      );

    const operationsByItem = new Map<string, Operation[]>();

    for (const item of items) {
      const merged = new Map<string, Operation>();

      // share-derived: grant rows for this item
      for (const row of mediaItemOperations) {
        if (row.mediaItemId === item.id) {
          for (const op of row.operations) merged.set(op.value, op);
        }
      }
      operationsByItem.set(item.id, Array.from(merged.values()));
    }

    return operationsByItem;
  };
  return {
    getOperationsByItem,
    getOperationsByPublicItem,
  };
};
