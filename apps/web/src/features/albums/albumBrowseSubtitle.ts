import { DateTime } from 'luxon';

export const buildAlbumBrowseSubtitle = (count: number, updatedAt?: DateTime): string => {
  const itemLabel = count === 1 ? '1 item' : `${count} items`;
  if (updatedAt?.isValid) {
    return `${itemLabel} · Updated ${updatedAt.toLocaleString(DateTime.DATE_MED)}`;
  }
  return itemLabel;
};
