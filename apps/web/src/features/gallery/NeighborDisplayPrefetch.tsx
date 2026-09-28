import { useFragment } from '@apollo/client/react';
import { MediaAssetKind, MediaKind } from '@packages/contracts';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import {
  MediaItemKindFragmentDoc,
  PublicMediaItemKindFragmentDoc,
} from '../../graphql/generated/types';
import type { GalleryNavigation } from './mediaItemGalleryNavigation';

type NeighborTypename = 'MediaItem' | 'PublicMediaItem';

type NeighborDisplayPrefetchProps = {
  galleryNavigation: Extract<GalleryNavigation, { enabled: true }>;
  galleryIds: string[];
  /** Cache type of the gallery's items — authed and public items normalize separately. */
  typename: NeighborTypename;
};

/**
 * Warms the browser cache for ±1 gallery neighbors so stepping through the gallery
 * doesn't wait on bytes. Prefetch links are portaled to document.head and replaced on
 * navigation.
 *
 * What gets warmed depends on the neighbor's kind, read from the Apollo cache:
 * - photo → its DISPLAY image (what the viewer shows).
 * - video → only its THUMBNAIL (the player's poster). `rel="prefetch"` downloads the
 *   whole resource, so prefetching a video's DISPLAY mp4 would pull the entire file
 *   and defeat the player's `preload="metadata"`.
 * - kind not cached yet → the thumbnail too: cheap, and never a whole video.
 */
export const NeighborDisplayPrefetch = ({
  galleryNavigation,
  galleryIds,
  typename,
}: NeighborDisplayPrefetchProps): ReactElement | null => {
  const { currentIndex } = galleryNavigation;
  const neighborIds: string[] = [];

  if (currentIndex > 0) {
    neighborIds.push(galleryIds[currentIndex - 1]);
  }
  if (currentIndex < galleryIds.length - 1) {
    neighborIds.push(galleryIds[currentIndex + 1]);
  }

  if (neighborIds.length === 0) {
    return null;
  }

  const NeighborLink =
    typename === 'MediaItem' ? MediaItemNeighborLink : PublicMediaItemNeighborLink;

  return createPortal(
    <>
      {neighborIds.map((id) => (
        <NeighborLink key={id} id={id} />
      ))}
    </>,
    document.head,
  );
};

type NeighborLinkProps = { id: string };

// One component per typename so each calls useFragment with a fixed fragment
// (hooks can't switch documents between renders). useFragment is reactive: when the
// detail prefetch lands a neighbor's kind in the cache, its link upgrades in place.
const MediaItemNeighborLink = ({ id }: NeighborLinkProps) => {
  const { data, complete } = useFragment({
    fragment: MediaItemKindFragmentDoc,
    fragmentName: 'MediaItemKind',
    from: { __typename: 'MediaItem', id },
  });
  return <PrefetchLink id={id} kind={complete ? data.kind : undefined} />;
};

const PublicMediaItemNeighborLink = ({ id }: NeighborLinkProps) => {
  const { data, complete } = useFragment({
    fragment: PublicMediaItemKindFragmentDoc,
    fragmentName: 'PublicMediaItemKind',
    from: { __typename: 'PublicMediaItem', id },
  });
  return <PrefetchLink id={id} kind={complete ? data.kind : undefined} />;
};

const PrefetchLink = ({ id, kind }: { id: string; kind: MediaKind | undefined }) => {
  const asset =
    kind != null && kind.equals(MediaKind.photo)
      ? MediaAssetKind.display
      : MediaAssetKind.thumbnail;
  return <link rel="prefetch" as="image" href={buildMediaItemUrl(id, asset)} />;
};
