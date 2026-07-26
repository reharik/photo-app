import {
  AsyncNotificationKind,
  BatchedPayloadKind,
  EntityType,
  filterByMember,
  notEmpty,
} from '@packages/contracts';
import { dedupeBy, dedupeIds, groupByMapping, indexBy } from '@packages/infrastructure';
import { AsyncNotification, SystemAlbumRepository } from '@packages/media-core';
import { AlbumSection } from '@packages/notifications';
import { pickEnum } from '@reharik/smart-enum';
import { RowOutcome } from '../../outcomeCleanup';
import { ActivityResult, BatchedEmailPayload } from './types';

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

    const outcomes: RowOutcome[] = [];
    const albumActivity = new Map<string, AlbumSection>();
    for (const [recipientId, rowsForRecipient] of recipientMap) {
      const albumSections = dedupeBy(
        rowsForRecipient
          .filter((x) => EntityType.album.equals(x.containerType))
          .map((r) => titleMap.get(r.containerId))
          .filter(notEmpty)
          .map((x) => ({ albumTitle: x.title, albumId: x.id, itemCount: x.itemCount })),
        [(x) => x.albumId],
      );

      if (albumSections.length) {
        albumActivity.set(recipientId, albumSections);
      }
    }

    return { kind: BatchedPayloadKind.album, activity: albumActivity, outcomes };
  },
});
