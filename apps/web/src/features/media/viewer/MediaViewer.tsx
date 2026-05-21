import { MediaKind } from '@packages/contracts';
import { useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useMediaSwipeNavigation } from '../../../hooks/useMediaSwipeNavigation';
import type { ReactionCountsVM, ViewerReactionVM } from '../../../viewModels/';
import { ReactionsForMediaItemContainer } from '../../reactions/ReactionsForMediaItemContainer';
import { MediaRenderer } from './MediaRenderer';
import { MediaViewerDesktopNav } from './MediaViewerDesktopNav';
import { MediaViewerMobileNav } from './MediaViewerMobileNav';
import { MediaViewerSingle } from './MediaViewerSingle';
import { ViewerBelowMediaSlot } from './MediaViewerStyles';
import type { NavigateDirection } from './mediaViewerTypes';
import { ZoomableImageViewport } from './ZoomableImageViewport';

export type { NavigateDirection } from './mediaViewerTypes';

export type MediaViewerProps = {
  kind: MediaKind;
  mimeType: string;
  displayUrl: string;
  imageAlt: string;
  mediaItemId: string;
  reactionCounts: ReactionCountsVM;
  viewerReactions?: ViewerReactionVM[];
  canReact?: boolean;
  onRefetch?: () => Promise<void>;
  /** When false, hides the reactions strip below the media. */
  showCloseButton?: boolean;
  onClose: () => void;
  onNavigate: (direction: NavigateDirection) => void;
  canNavigate: boolean;
  escapeConsumedRef?: MutableRefObject<(() => boolean) | null>;
};

const MOBILE_NAV_MEDIA = '(max-width: 968px)';

const isZoomableImage = (kind: MediaKind, mimeType: string): boolean => {
  const mt = mimeType.trim().toLowerCase();
  if (kind === MediaKind.photo) {
    return true;
  }
  return mt.startsWith('image/');
};

export const MediaViewer = ({
  kind,
  mimeType,
  displayUrl,
  imageAlt,
  mediaItemId,
  reactionCounts,
  viewerReactions,
  canReact,
  onRefetch,
  onClose,
  showCloseButton = true,
  onNavigate,
  canNavigate = false,
  escapeConsumedRef,
}: MediaViewerProps) => {
  const showNavControls = canNavigate;
  const isMobileLayout = useMediaQuery(MOBILE_NAV_MEDIA);

  const [zoomActive, setZoomActive] = useState(false);
  const zoomActiveRef = useRef(false);
  const resetZoomRef = useRef<(() => void) | null>(null);

  const zoomLayerEnabled = isZoomableImage(kind, mimeType);
  const swipeEnabled = isMobileLayout && showNavControls && !zoomActive;

  useLayoutEffect(() => {
    zoomActiveRef.current = zoomActive;
  }, [zoomActive]);

  useLayoutEffect(() => {
    if (escapeConsumedRef == null) {
      return;
    }

    escapeConsumedRef.current = (): boolean => {
      if (!zoomActiveRef.current) {
        return false;
      }

      resetZoomRef.current?.();
      return true;
    };

    return (): void => {
      escapeConsumedRef.current = null;
    };
  }, [escapeConsumedRef]);

  const { swipeHandlers } = useMediaSwipeNavigation({
    enabled: swipeEnabled,
    canNavigate,
    onNavigate,
  });

  const media = (
    <MediaChrome>
      <ZoomableImageViewport
        key={displayUrl}
        enabled={zoomLayerEnabled}
        onZoomActiveChange={setZoomActive}
        resetZoomRef={resetZoomRef}
      >
        <MediaRenderer
          id={mediaItemId}
          kind={kind}
          mimeType={mimeType}
          displayUrl={displayUrl}
          imageAlt={imageAlt}
        />
      </ZoomableImageViewport>
    </MediaChrome>
  );

  const belowMediaSlot = (
    <ViewerBelowMediaSlot>
      <ReactionsForMediaItemContainer
        mediaItemId={mediaItemId}
        reactionCounts={reactionCounts}
        viewerReactions={viewerReactions}
        canReact={canReact}
        onRefetch={onRefetch}
      />
    </ViewerBelowMediaSlot>
  );

  return (
    <ViewerRoot aria-label="Media viewer">
      <ViewerShell>
        {!showNavControls ? (
          <MediaViewerSingle
            media={media}
            belowMedia={belowMediaSlot}
            onClose={onClose}
            showCloseButton={showCloseButton}
          />
        ) : isMobileLayout ? (
          <MediaViewerMobileNav
            media={media}
            belowMedia={belowMediaSlot}
            onClose={onClose}
            onNavigate={onNavigate}
            canNavigate={canNavigate}
            zoomActive={zoomActive}
            swipeHandlers={swipeHandlers}
          />
        ) : (
          <MediaViewerDesktopNav
            media={media}
            belowMedia={belowMediaSlot}
            onClose={onClose}
            onNavigate={onNavigate}
            canNavigate={canNavigate}
          />
        )}
      </ViewerShell>
    </ViewerRoot>
  );
};
const ViewerRoot = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`;

const ViewerShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(2)};
  overflow: auto;

  @media (min-width: 969px) {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;

/** Sizes to the rendered media so zoom cursor / gestures apply only over the image. */
const MediaChrome = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
`;
