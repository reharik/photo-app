import { MediaKind, ReactionTargetType } from '@packages/contracts';
import { useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useMediaViewerKeyboard } from '../../../hooks/useMediaViewerKeyboard';
import { useMobileViewerGestures } from '../../../hooks/useMobileViewerGestures';
import type { ReactionCountsVM, ViewerReactionVM } from '../../../viewModels/';
import { ReactionsContainer } from '../../reactions/ReactionsContainer';
import { MediaRenderer } from './MediaRenderer';
import { MediaViewerDesktopNav } from './MediaViewerDesktopNav';
import { MediaViewerMobile } from './MediaViewerMobile';
import { MediaViewerSingle } from './MediaViewerSingle';
import { ViewerBelowMediaSlot } from './MediaViewerStyles';
import type { NavigateDirection } from './mediaViewerTypes';
import { useMediaViewerSlideTransition } from './useMediaViewerSlideTransition';
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
  /** Mobile layout: toggles close button, reactions, and metadata overlay visibility. */
  mobileChrome?: {
    visible: boolean;
    onToggleChrome: () => void;
  };
};

const MOBILE_NAV_MEDIA = '(max-width: 968px)';

const isZoomableImage = (kind: MediaKind, mimeType: string): boolean => {
  const mt = mimeType.trim().toLowerCase();
  if (kind.equals(MediaKind.photo)) {
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
  mobileChrome,
}: MediaViewerProps) => {
  const isMobileLayout = useMediaQuery(MOBILE_NAV_MEDIA);

  const [zoomActive, setZoomActive] = useState(false);
  const zoomActiveRef = useRef(false);
  const resetZoomRef = useRef<(() => void) | null>(null);

  const zoomLayerEnabled = isZoomableImage(kind, mimeType);
  const mobileGesturesEnabled = isMobileLayout && mobileChrome != null;

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

  const { requestNavigate, SlideTransitionWrap } = useMediaViewerSlideTransition({
    contentKey: displayUrl,
    canNavigate,
    onNavigate,
  });

  useMediaViewerKeyboard({
    onNavigate: requestNavigate,
    escapeConsumedRef,
    onEscape: onClose,
  });

  const { gestureHandlers } = useMobileViewerGestures({
    enabled: mobileGesturesEnabled,
    canNavigate,
    zoomActive,
    onNavigate: requestNavigate,
    onDismiss: onClose,
    onToggleChrome: mobileChrome?.onToggleChrome ?? ((): void => undefined),
  });

  const media = (
    <SlideTransitionWrap>
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
    </SlideTransitionWrap>
  );

  const belowMediaSlot = (
    <ViewerBelowMediaSlot>
      <ReactionsContainer
        targetId={mediaItemId}
        targetType={ReactionTargetType.mediaItem}
        reactionCounts={reactionCounts}
        viewerReactions={viewerReactions}
        canReact={canReact}
        onRefetch={onRefetch}
      />
    </ViewerBelowMediaSlot>
  );

  const chromeVisible = mobileChrome?.visible ?? false;

  return (
    <ViewerRoot aria-label="Media viewer">
      <ViewerShell>
        {isMobileLayout && mobileChrome != null ? (
          <MediaViewerMobile
            media={media}
            belowMedia={belowMediaSlot}
            onClose={onClose}
            chromeVisible={chromeVisible}
            showCloseButton={showCloseButton}
            gestureHandlers={gestureHandlers}
          />
        ) : !canNavigate ? (
          <MediaViewerSingle
            media={media}
            belowMedia={belowMediaSlot}
            onClose={onClose}
            showCloseButton={showCloseButton}
          />
        ) : (
          <MediaViewerDesktopNav
            media={media}
            belowMedia={belowMediaSlot}
            onClose={onClose}
            onNavigate={requestNavigate}
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

  @media (max-width: 968px) {
    flex: 0 0 auto;
    overflow: visible;
  }
`;

const ViewerShell = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(2)};
  overflow: auto;

  @media (max-width: 968px) {
    flex: 0 0 auto;
    overflow: visible;
    align-items: stretch;
  }

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
