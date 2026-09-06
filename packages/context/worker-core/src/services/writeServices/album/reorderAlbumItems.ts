import { ok, Operation, OperationResult } from '@packages/contracts';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { EntityId } from '../../../types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { ReorderAlbumItemsCommand, ReorderAlbumItemsResult } from './writeAlbum.types';

export interface ReorderAlbumItems extends WriteServiceBase {
  (input: ReorderAlbumItemsCommand): Promise<OperationResult<ReorderAlbumItemsResult>>;
}

type ReorderAlbumItemsDeps = {
  albumRepository: AlbumRepository;
  viewerId: EntityId;
};

export const build__ReorderAlbumItems = ({
  albumRepository,
  viewerId,
}: ReorderAlbumItemsDeps): ReorderAlbumItems => {
  return async (
    input: ReorderAlbumItemsCommand,
  ): Promise<OperationResult<ReorderAlbumItemsResult>> => {
    const { albumId, albumItemIds } = input;

    const r1 = await loadRequiredAlbum(albumId, albumRepository);
    if (!r1.success) {
      return r1;
    }
    const album = r1.value;

    const r2 = ensureMemberCanEditAlbum(album, Operation.addItems, viewerId);
    if (!r2.success) {
      return r2;
    }

    const r3 = album.reorderItems(albumItemIds, viewerId);
    if (!r3.success) {
      return r3;
    }

    await albumRepository.save(album);

    return ok({
      albumId: album.id(),
    });
  };
};
