import { DateTime } from 'luxon';
import { contentCount } from '../../domain/formatters/contentNoun';
import { formatActivityDate } from '../../ui/dateDisplay';

export const buildAlbumBrowseSubtitle = (count: number, updatedAt?: DateTime): string => {
  const itemLabel = contentCount(count);
  if (updatedAt?.isValid) {
    return `${itemLabel} · Updated ${formatActivityDate(updatedAt)}`;
  }
  return itemLabel;
};
