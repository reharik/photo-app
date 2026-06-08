import { MediaAssetKind } from '@packages/contracts';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import type { GalleryNavigation } from './mediaItemGalleryNavigation';

type NeighborDisplayPrefetchProps = {
  galleryNavigation: Extract<GalleryNavigation, { enabled: true }>;
  galleryIds: string[];
};

/**
 * Warms the browser cache for ±1 gallery neighbors' display images.
 * Prefetch links are portaled to document.head and replaced on navigation.
 */
export const NeighborDisplayPrefetch = ({
  galleryNavigation,
  galleryIds,
}: NeighborDisplayPrefetchProps): ReactElement | null => {
  const { currentIndex } = galleryNavigation;
  const neighborUrls: string[] = [];

  if (currentIndex > 0) {
    neighborUrls.push(buildMediaItemUrl(galleryIds[currentIndex - 1], MediaAssetKind.display));
  }
  if (currentIndex < galleryIds.length - 1) {
    neighborUrls.push(buildMediaItemUrl(galleryIds[currentIndex + 1], MediaAssetKind.display));
  }

  if (neighborUrls.length === 0) {
    return null;
  }

  return createPortal(
    <>
      {neighborUrls.map((href) => (
        <link key={href} rel="prefetch" as="image" href={href} />
      ))}
    </>,
    document.head,
  );
};
