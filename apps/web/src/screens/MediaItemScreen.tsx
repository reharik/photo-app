import { useQuery } from '@apollo/client/react';

import { MediaAssetKind } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../domain/formatters/mediaItemUrlBuilder';
import { getGalleryNavigation } from '../features/gallery/mediaItemGalleryNavigation';
import {
  MediaItemDetailPanel,
  type MediaItemDetailPanelHandle,
} from '../features/media/MediaItemDetailPanel';
import { MediaViewer } from '../features/media/viewer/MediaViewer';
import type { NavigateDirection } from '../features/media/viewer/mediaViewerTypes';
import { ViewerMediaItemDetailDocument } from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { useMediaViewerKeyboard } from '../hooks/useMediaViewerKeyboard';
import { Toast } from '../ui/Toast';

export type MediaItemLocationState = {
  mediaGalleryIds?: string[];
};

export const MediaItemScreen = () => {
  const { mediaId } = useParams<{ mediaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const galleryIds = (location.state as MediaItemLocationState | undefined)?.mediaGalleryIds;

  const query = useQuery(ViewerMediaItemDetailDocument, {
    variables: { mediaItemId: mediaId ?? '' },
    skip: !mediaId,
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
  });

  const { data: mediaItem, content } = getQueryRenderState({
    query,
    select: (data) => data.viewer?.mediaItem,
  });
  /** Mirrors {@link MediaItemDetailPanel} editing state so keyboard gallery navigation can respect it. */
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isMobileChromeVisible, setIsMobileChromeVisible] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const detailPanelRef = useRef<MediaItemDetailPanelHandle>(null);

  /** Escape resets image zoom first (when {@link MediaViewer} reports zoom active), then closes. */
  const mediaViewerEscapeConsumedRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    setIsMobileChromeVisible(false);
  }, [mediaItem?.id]);

  const handleDismissScreen = useCallback((): void => {
    void navigate(-1);
  }, [navigate]);

  const handleToggleMobileChrome = useCallback((): void => {
    setIsMobileChromeVisible((visible) => !visible);
  }, []);

  const handleClose = useCallback((): void => {
    detailPanelRef.current?.handleCloseRequest();
  }, []);

  const handleAfterSave = useCallback(async (): Promise<void> => {
    if (mediaId != null && mediaId !== '') {
      await query.refetch({ mediaItemId: mediaId });
    }
    setShowSaveToast(true);
  }, [mediaId, query]);

  const galleryNavigation = getGalleryNavigation({
    galleryIds,
    mediaId,
    isEditingDetails,
  });

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

      void navigate(`/media/${nextTarget}`, {
        replace: true,
        state: { mediaGalleryIds: galleryIds },
      });
    },
    [galleryIds, navigate, galleryNavigation],
  );

  // const viewerChrome = (children: ReactNode) => (
  //   <ViewerShell>
  //     <ViewerCard>{children}</ViewerCard>
  //   </ViewerShell>
  // );

  const viewerPane = (() => {
    if (mediaItem == null) {
      return null;
    }
    const displayUrl = buildMediaItemUrl(mediaItem.id, MediaAssetKind.display);

    const imageAlt =
      mediaItem.title?.trim() || mediaItem.originalFileName?.trim() || mediaItem.kind.display;

    return (
      <MediaViewer
        kind={mediaItem.kind}
        mimeType={mediaItem.mimeType}
        displayUrl={displayUrl}
        imageAlt={imageAlt}
        mediaItemId={mediaItem.id}
        reactionCounts={mediaItem.reactionCounts}
        viewerReactions={mediaItem.viewerReactions}
        canReact
        onRefetch={handleAfterSave}
        onClose={handleClose}
        onNavigate={handleMediaNavigate}
        canNavigate={galleryNavigation.enabled}
        escapeConsumedRef={mediaViewerEscapeConsumedRef}
        mobileChrome={{
          visible: isMobileChromeVisible,
          onToggleChrome: handleToggleMobileChrome,
        }}
      />
    );
  })();

  useMediaViewerKeyboard({
    enabled: Boolean(mediaId),
    escapeConsumedRef: mediaViewerEscapeConsumedRef,
    onEscape: handleClose,
    onNavigate: handleMediaNavigate,
  });

  if (!mediaItem) {
    return content;
  }

  return (
    <Container>
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      <LayoutInner>
        <ViewerColumn>{viewerPane}</ViewerColumn>

        <MediaItemDetailPanel
          ref={detailPanelRef}
          mediaItem={mediaItem}
          onDismissScreen={handleDismissScreen}
          onSaved={handleAfterSave}
          onEditingSessionChange={setIsEditingDetails}
          isMobileMetadataVisible={isMobileChromeVisible}
        />
      </LayoutInner>
    </Container>
  );
};

const Container = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.color.body};
  display: flex;
  flex-direction: row;
  min-height: 0;
  z-index: 100;

  @media (max-width: 968px) {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    align-items: stretch;
    -webkit-overflow-scrolling: touch;
  }
`;

/** Fills the viewport on small screens and grows with content so the page background stays solid while scrolling. */
const LayoutInner = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  background: ${({ theme }) => theme.color.body};

  @media (max-width: 968px) {
    flex-direction: column;
    flex: 1 0 auto;
    min-height: 100dvh;
    align-items: flex-start;
  }
`;

/** Wraps the viewer so the media + metadata stack and scroll on narrow viewports. */
const ViewerColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 968px) {
    /* Shrink-wrap image + reactions; page scroll handles overflow */
    flex: 0 0 auto;
    min-height: 0;
    overflow: visible;
    width: 100%;
  }
`;
