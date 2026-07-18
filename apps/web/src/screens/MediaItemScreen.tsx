import { useApolloClient, useQuery } from '@apollo/client/react';

import { EntityType, InAppNotificationType, MediaAssetKind } from '@packages/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../domain/formatters/mediaItemUrlBuilder';
import { getGalleryNavigation } from '../features/gallery/mediaItemGalleryNavigation';
import { NeighborDisplayPrefetch } from '../features/gallery/NeighborDisplayPrefetch';
import { useNeighborDetailPrefetch } from '../features/gallery/useNeighborDetailPrefetch';
import {
  MediaItemDetailPanel,
  type MediaItemDetailPanelHandle,
} from '../features/media/MediaItemDetailPanel';
import { MediaViewer } from '../features/media/viewer/MediaViewer';
import type {
  MobileViewerSheet,
  NavigateDirection,
} from '../features/media/viewer/mediaViewerTypes';
import {
  MarkSurfaceSeenDocument,
  ViewerInAppNotificationDocument,
  ViewerMediaItemDetailDocument,
} from '../graphql/generated/types';
import { getQueryRenderState } from '../hooks/getQueryRenderState';
import { useInAppNotification } from '../hooks/useInAppNotification';
import { Toast } from '../ui/Toast';

/** Mobile stage chrome (close + action bar) is always visible — single-tap toggle is a no-op. */
const noopToggleMobileChrome = (): void => undefined;

export type MediaItemLocationState = {
  mediaGalleryIds?: string[];
};

export const MediaItemScreen = () => {
  const { mediaId } = useParams<{ mediaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const galleryIds = (location.state as MediaItemLocationState | undefined)?.mediaGalleryIds;

  const apolloClient = useApolloClient();
  const { anyUnseenMatching } = useInAppNotification();
  const markedSeenMediaIdRef = useRef<string | null>(null);

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
  const [activeMobileSheet, setActiveMobileSheet] = useState<MobileViewerSheet>('none');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const detailPanelRef = useRef<MediaItemDetailPanelHandle>(null);

  /** Escape resets image zoom first (when {@link MediaViewer} reports zoom active), then closes. */
  const mediaViewerEscapeConsumedRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    setActiveMobileSheet('none');
  }, [mediaItem?.id]);

  // Opening a photo = seeing the "shared with me" surface for it. Kind-scoped to
  // ITEM_SHARED so it clears ONLY the shared-media dot and never eats this photo's
  // commentAdded rows — those clear separately on comment-thread consume (id-clear).
  // A no-op for photos with no shared-activity row. Best-effort; fired once per photo.
  const loadedMediaId = mediaItem?.id;
  useEffect(() => {
    if (loadedMediaId == null || markedSeenMediaIdRef.current === loadedMediaId) {
      return;
    }
    // Only clear (and refetch) when the client actually holds a matching ITEM_SHARED row
    // for this photo — otherwise the mutation + refetch is an empty round-trip. If the
    // array hasn't resolved yet this is false and the effect re-runs when it does
    // (anyUnseenMatching is a dep and is stable per array).
    const hasSharedRow = anyUnseenMatching(
      (r) =>
        r.targetType.equals(EntityType.mediaItem) &&
        r.targetId === loadedMediaId &&
        r.activityKind.equals(InAppNotificationType.itemShared),
    );
    if (!hasSharedRow) {
      return;
    }
    markedSeenMediaIdRef.current = loadedMediaId;

    void (async () => {
      try {
        await apolloClient.mutate({
          mutation: MarkSurfaceSeenDocument,
          variables: {
            targetType: EntityType.mediaItem,
            targetId: loadedMediaId,
            kind: InAppNotificationType.itemShared,
          },
        });
        void apolloClient.refetchQueries({ include: [ViewerInAppNotificationDocument] });
      } catch (error) {
        console.error('markSurfaceSeen failed for media item', loadedMediaId, error);
      }
    })();
  }, [loadedMediaId, anyUnseenMatching, apolloClient]);

  const handleClose = useCallback((): void => {
    detailPanelRef.current?.handleCloseRequest();
  }, []);

  /** Terminal dismiss — {@link handleClose} → panel {@link handleCloseRequest} → here when not editing. */
  const handleDismissScreen = useCallback((): void => {
    void navigate(-1);
  }, [navigate]);

  const handleCloseMobileSheet = useCallback((): void => {
    detailPanelRef.current?.handleSheetDismiss();
    setActiveMobileSheet('none');
  }, []);

  const handleEscape = useCallback((): void => {
    if (activeMobileSheet !== 'none') {
      handleCloseMobileSheet();
      return;
    }
    detailPanelRef.current?.handleCloseRequest();
  }, [activeMobileSheet, handleCloseMobileSheet]);

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

  useNeighborDetailPrefetch({
    enabled: galleryNavigation.enabled && galleryIds != null,
    galleryNavigation,
    galleryIds: galleryIds ?? [],
    mediaId,
    mediaItemResolved: mediaItem != null,
    query: ViewerMediaItemDetailDocument,
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

  const viewerPane = (() => {
    if (mediaItem == null) {
      return null;
    }
    const displayUrl = buildMediaItemUrl(mediaItem.id, MediaAssetKind.display);

    const imageAlt =
      mediaItem.title?.trim() || mediaItem.originalFileName?.trim() || mediaItem.kind.display;

    return (
      <MediaViewer
        key={mediaItem.id}
        kind={mediaItem.kind}
        mimeType={mediaItem.mimeType}
        displayUrl={displayUrl}
        imageAlt={imageAlt}
        mediaItemId={mediaItem.id}
        onClose={handleClose}
        onEscape={handleEscape}
        onNavigate={handleMediaNavigate}
        canNavigate={galleryNavigation.enabled}
        escapeConsumedRef={mediaViewerEscapeConsumedRef}
        mobileChrome={{
          visible: true,
          onToggleChrome: noopToggleMobileChrome,
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
      <NeighborDisplayPrefetch galleryNavigation={galleryNavigation} galleryIds={galleryIds} />
    ) : null;

  if (!mediaItem) {
    return (
      <>
        {neighborPrefetch}
        {content}
      </>
    );
  }

  return (
    <Container>
      {neighborPrefetch}
      {showSaveToast ? <Toast onDismiss={() => setShowSaveToast(false)} /> : null}
      <LayoutInner>
        <ViewerColumn>{viewerPane}</ViewerColumn>

        <MediaItemDetailPanel
          ref={detailPanelRef}
          mediaItem={mediaItem}
          onDismissScreen={handleDismissScreen}
          onSaved={handleAfterSave}
          onEditingSessionChange={setIsEditingDetails}
          activeMobileSheet={activeMobileSheet}
          onCloseMobileSheet={handleCloseMobileSheet}
          onRequestOpenInfoSheet={() => setActiveMobileSheet('info')}
        />
      </LayoutInner>
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
  background: ${({ theme }) => theme.color.stageDark};
  z-index: 100;

  @media (max-width: 968px) {
    overflow: hidden;
  }
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
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
`;

/** Wraps the viewer so the media stage fills the viewport on narrow layouts. */
const ViewerColumn = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;

  @media (max-width: 968px) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
`;
