import {
  AsyncNotificationKind,
  BatchedPayloadKind,
  EntityType,
  filterByMember,
} from '@packages/contracts';
import { dedupeIds, groupByMapping, indexBy } from '@packages/infrastructure';
import { AsyncNotification, SystemAlbumRepository } from '@packages/media-core';
import { AlbumSection } from '@packages/notifications';
import { pickEnum } from '@reharik/smart-enum';
import { RowOutcome } from '../../outcomeCleanup';
import { ActivityResult, BatchedEmailPayload, LivingRow } from './types';

export interface AlbumActivity extends BatchedEmailPayload {
  execute: (rows: AsyncNotification[]) => Promise<ActivityResult>;
}

type AlbumActivityDeps = {
  systemAlbumRepository: SystemAlbumRepository;
};

export const build__AlbumActivity = ({
  systemAlbumRepository,
}: AlbumActivityDeps): AlbumActivity => ({
  execute: async (rows): Promise<ActivityResult> => {
    const albumRowKind = pickEnum(AsyncNotificationKind, ['itemAdded']);
    const albumRows = filterByMember(rows, 'kind', albumRowKind);
    const recipientMap = groupByMapping(albumRows, (x) => x.recipientId);

    const albumIds = dedupeIds(albumRows.map((x) => x.containerId));
    const titleMap = indexBy(await systemAlbumRepository.getAlbumTitlesById(albumIds));

    const deadRows: RowOutcome[] = [];
    const livingRows: LivingRow[] = [];
    const albumActivity = new Map<string, AlbumSection>();
    for (const [recipientId, rowsForRecipient] of recipientMap) {
      const seenAlbums = new Set<string>();
      const sections: AlbumSection = [];
      for (const row of rowsForRecipient) {
        if (!EntityType.album.equals(row.containerType)) {
          deadRows.push({ row, result: 'skipped', reason: 'itemAdded with non-album container' });
          continue;
        }
        const album = titleMap.get(row.containerId);
        if (!album) {
          deadRows.push({
            row,
            result: 'skipped',
            reason: 'album missing — deleted since enqueue?',
          });
          continue;
        }
        livingRows.push(row); // represented in the email — dedupe survivor or not
        if (!seenAlbums.has(album.id)) {
          seenAlbums.add(album.id);
          sections.push({ albumTitle: album.title, albumId: album.id, itemCount: album.itemCount });
        }
      }
      if (sections.length) albumActivity.set(recipientId, sections);
    }
    return {
      kind: BatchedPayloadKind.album,
      activity: albumActivity,
      deadRows,
      livingRows,
    };
  },
});
