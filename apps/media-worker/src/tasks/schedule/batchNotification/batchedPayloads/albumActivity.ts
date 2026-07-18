import {
  ActivityKind,
  AsyncNotificationKind,
  EntityType,
  filterByMember,
  notEmpty,
} from '@packages/contracts';
import { dedupeIds, groupByMapping, indexBy } from '@packages/infrastructure';
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
    const albumRowKind = pickEnum(AsyncNotificationKind, [
      'albumShared',
      'guestAlbumShared',
      'itemShared',
    ]);
    const albumRows = filterByMember(rows, 'kind', albumRowKind);
    const recipientMap = groupByMapping(albumRows, (x) => x.recipientId);

    const albumIds = dedupeIds(albumRows.map((x) => x.aggregateId));
    const titleMap = indexBy(await systemAlbumRepository.getAlbumTitlesById(albumIds));

    const outcomes: RowOutcome[] = [];
    const albumActivity = new Map<string, AlbumSection>();
    for (const [recipientId, rowsForRecipient] of recipientMap) {
      const titles = [
        ...new Set(
          rowsForRecipient
            .filter((x) => EntityType.album.equals(x.aggregateType))
            .map((r) => titleMap.get(r.aggregateId)?.title)
            .filter(notEmpty),
        ),
      ];

      if (titles.length) {
        albumActivity.set(recipientId, { albumTitles: titles });
      }
    }

    return { kind: ActivityKind.album, activity: albumActivity, outcomes };
  },
});
