import { Operation } from '@packages/contracts';
import { ensureMemberCanEditAlbum } from '../../../application/support/albumguard';
import { loadRequiredAlbum } from '../../../application/support/resourceLoaders';
import { ok } from '../../../domain/utilities/writeResponse';
import { AlbumRepository } from '../../../repositories/domainRepositories/albumRepository';
import { WriteResult } from '../../../types/types';
import { WriteServiceBase } from '../writeServiceBaseType';
import { ReorderAlbumItemsCommand, ReorderAlbumItemsResult } from './writeAlbum.types';

export interface ReorderAlbumItems extends WriteServiceBase {
  (input: ReorderAlbumItemsCommand): Promise<WriteResult<ReorderAlbumItemsResult>>;
}

type ReorderAlbumItemsDeps = {
  albumRepository: AlbumRepository;
};

export const build__ReorderAlbumItems = ({
  albumRepository,
}: ReorderAlbumItemsDeps): ReorderAlbumItems => {
  return async (input: ReorderAlbumItemsCommand): Promise<WriteResult<ReorderAlbumItemsResult>> => {
    const { viewerId, albumId, albumItemIds } = input;

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

    await albumRepository.save(album, viewerId);

    return ok({
      albumId: album.id(),
    });
  };
};
