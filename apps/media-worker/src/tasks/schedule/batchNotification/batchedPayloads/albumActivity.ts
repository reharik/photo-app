import {
  AsyncNotificationKind,
  BatchedPayloadKind,
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
    const albumRowKind = pickEnum(AsyncNotificationKind, ['itemAdded']);
    const albumRows = filterByMember(rows, 'kind', albumRowKind);
    const recipientMap = groupByMapping(albumRows, (x) => x.recipientId);

    const albumIds = dedupeIds(albumRows.map((x) => x.containerId));
    console.log(`************albumIds************`);
    console.log(albumIds);
    console.log(`********END albumIds************`);
    const titleMap = indexBy(await systemAlbumRepository.getAlbumTitlesById(albumIds));
    const outcomes: RowOutcome[] = [];
    const albumActivity = new Map<string, AlbumSection>();
    for (const [recipientId, rowsForRecipient] of recipientMap) {
      console.log(`************titleMap************`);
      console.dir(titleMap);
      console.log(`********END titleMap************`);
      const rows = rowsForRecipient.filter((x) => x.containerType.equals(EntityType.album));
      const rows2 = rows.map((r) => titleMap.get(r.containerId)?.title).filter(notEmpty);
      console.log(`************rows2************`);
      console.log(rows2);
      console.log(`********END rows2************`);
      const titles = [...new Set(rows2)];
      if (titles.length) {
        albumActivity.set(recipientId, { albumTitles: titles });
      }
      console.log(`************titles************`);
      console.dir(titles);
      console.dir(titles.length);
      console.log(`********END titles************`);
    }

    return { kind: BatchedPayloadKind.album, activity: albumActivity, outcomes };
  },
});
