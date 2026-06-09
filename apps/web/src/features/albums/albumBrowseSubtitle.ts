import { DateTime } from 'luxon';
import { formatActivityDate } from '../../ui/dateDisplay';

export const buildAlbumBrowseSubtitle = (count: number, updatedAt?: DateTime): string => {
  const itemLabel = count === 1 ? '1 item' : `${count} items`;
  if (updatedAt?.isValid) {
    return `${itemLabel} · Updated ${formatActivityDate(updatedAt)}`;
  }
  return itemLabel;
};
