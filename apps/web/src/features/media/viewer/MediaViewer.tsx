import { MediaKind } from '@packages/contracts';
import { useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import styled from 'styled-components';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useMediaViewerKeyboard } from '../../../hooks/useMediaViewerKeyboard';
import { useMobileViewerGestures } from '../../../hooks/useMobileViewerGestures';
import { MediaRenderer } from './MediaRenderer';
import { MediaViewerDesktopNav } from './MediaViewerDesktopNav';
import { MediaViewerMobile } from './MediaViewerMobile';
import { MediaViewerSingle } from './MediaViewerSingle';
import type { NavigateDirection } from './mediaViewerTypes';
import {
  SlideTransitionWrap,
  useMediaViewerSlideTransition,
} from './useMediaViewerSlideTransition';
import { ZoomableImageViewport } from './ZoomableImageViewport';

export type { NavigateDirection } from './mediaViewerTypes';

export type MediaViewerProps = {
  kind: MediaKind;
  mimeType: string;
  displayUrl: string;
  imageAlt: string;
  mediaItemId: string;
  /** When false, hides the stage close button on mobile. */
  showCloseButton?: boolean;
  onClose: () => void;
  onNavigate: (direction: NavigateDirection) => void;
  canNavigate: boolean;
  escapeConsumedRef?: MutableRefObject<(() => boolean) | null>;
  /** Mobile layout: toggles close button and metadata card visibility. */
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

  const { requestNavigate, slideTransition } = useMediaViewerSlideTransition({
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
    <SlideTransitionWrap {...slideTransition}>
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

  const chromeVisible = mobileChrome?.visible ?? false;

  return (
    <ViewerRoot aria-label="Media viewer">
      <ViewerShell>
        {isMobileLayout && mobileChrome != null ? (
          <MediaViewerMobile
            media={media}
            onClose={onClose}
            chromeVisible={chromeVisible}
            showCloseButton={showCloseButton}
            gestureHandlers={gestureHandlers}
          />
        ) : !canNavigate ? (
          <MediaViewerSingle media={media} />
        ) : (
          <MediaViewerDesktopNav
            media={media}
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
  overflow: auto;

  @media (max-width: 968px) {
    flex: 0 0 auto;
    overflow: visible;
    align-items: stretch;
  }

  @media (min-width: 969px) {
    align-items: stretch;
    overflow: hidden;
    width: 100%;
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
