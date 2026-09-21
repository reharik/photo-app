import { MediaItemStatus } from '@packages/contracts';
import { RequestScopeLifeCycle } from '@packages/infrastructure';
import { UnitOfWork } from '../../infrastructure';
import { MediaCoreConfig } from '../../MediaCoreConfig';

type StorageUsage = {
  storageCapBytes: number;
  storageUsedBytes: number;
  storageRemainingBytes: number;
};
export interface MediaAssetReadRepository extends RequestScopeLifeCycle {
  getStorageUsage: () => Promise<StorageUsage | undefined>;
}

type MediaAssetReadRepositoryDeps = {
  uow: UnitOfWork;
  viewerId: string;
  config: MediaCoreConfig;
};
export const build__MediaAssetReadRepository = ({
  uow,
  viewerId,
  config,
}: MediaAssetReadRepositoryDeps): MediaAssetReadRepository => ({
  getStorageUsage: async (): Promise<StorageUsage | undefined> => {
    const capRow = await uow
      .db()('user')
      .where('id', viewerId)
      .select('storage_cap_bytes')
      .forUpdate()
      .first<{ storageCapBytes: number }>();
    if (!capRow) return undefined;

    const usedRow = await uow
      .db()('media_item')
      .where('owner_id', viewerId)
      .whereNotIn('status', [
        MediaItemStatus.failed.value,
        MediaItemStatus.deletePending.value,
        MediaItemStatus.deleteFailed.value,
      ])
      .andWhere((q) =>
        q
          .whereNot('status', MediaItemStatus.pending.value)
          .orWhereRaw(`created_at > (now() AT TIME ZONE 'UTC') - make_interval(secs => ?)`, [
            config.s3UploadUrlTtlSeconds,
          ]),
      )
      .select(uow.db().raw('COALESCE(SUM(size_bytes), 0)::bigint AS used'))
      .first<{ used: number }>();

    const storageCapBytes = capRow.storageCapBytes;
    const storageUsedBytes = usedRow?.used ?? 0;
    return {
      storageCapBytes,
      storageUsedBytes,
      storageRemainingBytes: Math.max(0, storageCapBytes - storageUsedBytes),
    };
  },
});
