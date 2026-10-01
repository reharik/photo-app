import { useQuery } from '@apollo/client/react';

import { MediaAssetKind } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../domain/formatters/mediaItemUrlBuilder';
import { getGalleryNavigation } from '../features/gallery/mediaItemGalleryNavigation';
import { NeighborDisplayPrefetch } from '../features/gallery/NeighborDisplayPrefetch';
import { useNeighborDetailPrefetch } from '../features/gallery/useNeighborDetailPrefetch';
import {
  PublicMediaItemDetailPanel,
  PublicMediaItemDetailPanelHandle,
} from '../features/media/PublicMediaItemDetailPanel';
import { MediaViewer } from '../features/media/viewer/MediaViewer';
import type {
  MobileViewerSheet,
  NavigateDirection,
} from '../features/media/viewer/mediaViewerTypes';
import {
  PUBLIC_OFFER_BAR_HEIGHT_PX,
  PublicAlbumOfferBar,
} from '../features/public/PublicAlbumOfferBar';
import { publicOwnerName } from '../features/public/publicOwnerName';
import { PublicMediaItemDetailDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { usePollWhileProcessing } from '../hooks/usePollWhileProcessing';
import { Toast } from '../ui/Toast';
import { resolvePublicQueryView } from './public/resolvePublicQueryView';

export type MediaItemLocationState = {
  mediaGalleryIds?: string[];
};

const PUBLIC_DETAIL_QUERY_CONTEXT = { accessMode: 'public' as const };

/** The viewer's mobile layout breakpoint (matches MediaViewer / the detail panel). */
const VIEWER_MOBILE_MAX_WIDTH_PX = 968;

export const PublicMediaItemScreen = () => {
  const { mediaId, token } = useParams<{ mediaId: string; token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const galleryIds = (location.state as MediaItemLocationState | undefined)?.mediaGalleryIds;
  const query = useQuery(PublicMediaItemDetailDocument, {
    variables: { mediaItemId: mediaId ?? '' },
    skip: !mediaId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    context: { accessMode: 'public' },
  });

  const { data: mediaItem, content } = getQueryRenderState({
    query,
    select: (data) => data.publicAccess?.mediaItem,
  });
  usePollWhileProcessing(query, mediaItem?.status);
  const [isMobileChromeVisible, setIsMobileChromeVisible] = useState(false);
  const [activeMobileSheet, setActiveMobileSheet] = useState<MobileViewerSheet>('none');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const detailPanelRef = useRef<PublicMediaItemDetailPanelHandle>(null);

  /** Escape resets image zoom first (when {@link MediaViewer} reports zoom active), then closes. */
  const mediaViewerEscapeConsumedRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    setIsMobileChromeVisible(false);
    setActiveMobileSheet('none');
  }, [mediaItem?.id]);

  const handleDismissScreen = useCallback((): void => {
    void navigate(-1);
  }, [navigate]);

  const handleToggleMobileChrome = useCallback((): void => {
    setIsMobileChromeVisible((visible) => !visible);
  }, []);

  const handleCloseMobileSheet = useCallback((): void => {
    setActiveMobileSheet('none');
  }, []);

  const galleryNavigation = getGalleryNavigation({
    galleryIds,
    mediaId,
    isEditingDetails: false,
  });

  useNeighborDetailPrefetch({
    enabled: galleryNavigation.enabled && galleryIds != null,
    galleryNavigation,
    galleryIds: galleryIds ?? [],
    mediaId,
    mediaItemResolved: mediaItem != null,
    query: PublicMediaItemDetailDocument,
    queryContext: PUBLIC_DETAIL_QUERY_CONTEXT,
  });

  // The signup offer shows only when the viewer is the front door: a link to a single photo
  // (the album route redirects straight here) or a direct load of a photo URL. Arriving from
  // the album grid she has already passed that page's offer, so the stage keeps its full height.
  const album = query.data?.publicAccess?.album;
  const offer =
    album != null && !galleryNavigation.enabled
      ? { albumId: album.id, ownerName: publicOwnerName(album.owner) }
      : undefined;

  const handleMediaNavigate = useCallback(
    (direction: NavigateDirection) => {
      if (!galleryNavigation.enabled) {
        return;
      }

      const nextTarget =
        direction === 'next' ? galleryNavigation.nextId : galleryNavigation.previousId;
      if (!nextTarget) {
        return;
      }

      void navigate(`/shared/${token}/media/${nextTarget}`, {
        replace: true,
        state: { mediaGalleryIds: galleryIds },
      });
    },
    [galleryIds, navigate, galleryNavigation, token],
  );

  const viewerPane = (() => {
    if (mediaItem == null) {
      return null;
    }
    const displayUrl = buildMediaItemUrl(mediaItem.id, MediaAssetKind.display);
    const posterUrl = buildMediaItemUrl(mediaItem.id, MediaAssetKind.thumbnail);

    const imageAlt = mediaItem.title?.trim() || mediaItem.kind.display;

    return (
      <MediaViewer
        kind={mediaItem.kind}
        status={mediaItem.status}
        mimeType={mediaItem.mimeType}
        displayUrl={displayUrl}
        posterUrl={posterUrl}
        width={mediaItem.width}
        height={mediaItem.height}
        imageAlt={imageAlt}
        mediaItemId={mediaItem.id}
        onClose={handleDismissScreen}
        showCloseButton={galleryNavigation.enabled}
        onNavigate={handleMediaNavigate}
        canNavigate={galleryNavigation.enabled}
        escapeConsumedRef={mediaViewerEscapeConsumedRef}
        mobileChrome={{
          visible: isMobileChromeVisible,
          onToggleChrome: handleToggleMobileChrome,
          onOpenInfoSheet: () => setActiveMobileSheet('info'),
          onOpenCommentSheet: () => setActiveMobileSheet('comment'),
          activeSheet: activeMobileSheet,
          sheetOpen: activeMobileSheet !== 'none',
        }}
      />
    );
  })();

  const neighborPrefetch =
    galleryNavigation.enabled && galleryIds != null ? (
      <NeighborDisplayPrefetch
        galleryNavigation={galleryNavigation}
        galleryIds={galleryIds}
        typename="PublicMediaItem"
      />
    ) : null;

  if (!mediaItem) {
    const isMediaUnavailable = query.data != null && query.data.publicAccess?.mediaItem == null;

    return (
      <>
        {neighborPrefetch}
        {resolvePublicQueryView({
          query,
          content,
          isUnavailable: isMediaUnavailable,
        })}
      </>
    );
  }

  return (
    <Container>
      {neighborPrefetch}
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      <LayoutInner>
        <ViewerColumn $offerBar={offer != null}>{viewerPane}</ViewerColumn>

        <PublicMediaItemDetailPanel
          ref={detailPanelRef}
          mediaItem={mediaItem}
          onDismissScreen={handleDismissScreen}
          activeMobileSheet={activeMobileSheet}
          onCloseMobileSheet={handleCloseMobileSheet}
          offer={offer}
        />
      </LayoutInner>
      {/* Mobile offer: pinned under the stage, which is shortened to end above it. The bar
          hides itself above the viewer's mobile breakpoint, where the rail carries the offer. */}
      {offer != null ? (
        <PublicAlbumOfferBar
          albumId={offer.albumId}
          ownerName={offer.ownerName}
          mobileMaxWidthPx={VIEWER_MOBILE_MAX_WIDTH_PX}
        />
      ) : null}
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  /* Deepened to stageDeep so the photo's white print matte lifts off the stage. */
  background: ${({ theme }) => theme.color.stageDeep};
  z-index: 100;
`;

/** Cream chrome (rail / metadata card) layers on top of {@link Container}'s stageDark backdrop. */
const LayoutInner = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  align-items: stretch;

  @media (min-width: 969px) {
    overflow: hidden;
  }

  @media (max-width: 968px) {
    flex-direction: column;
  }
`;

/** Wraps the viewer so the media stage fills the viewport on narrow layouts. */
const ViewerColumn = styled.div<{ $offerBar: boolean }>`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;

  @media (max-width: ${VIEWER_MOBILE_MAX_WIDTH_PX}px) {
    flex: 0 0 auto;
    /* Definite height so the stage's percentage/flex chain resolves and the action bar pins
       to the bottom — of the screen, or of the pinned offer bar (its height + 1px border)
       when that is showing. */
    height: ${({ $offerBar }) =>
      $offerBar
        ? `calc(100dvh - ${PUBLIC_OFFER_BAR_HEIGHT_PX + 1}px - env(safe-area-inset-bottom, 0px))`
        : '100dvh'};
    min-height: 0;
    overflow: visible;
    width: 100%;
  }
`;
