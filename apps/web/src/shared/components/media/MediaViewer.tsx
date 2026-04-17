import { useCallback, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';
import styled, { css } from 'styled-components';
import type { MediaKind } from '../../../graphql/generated/types';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useMediaSwipeNavigation } from '../../../hooks/useMediaSwipeNavigation';
import { MediaRenderer } from './MediaRenderer';
import type { NavigateDirection } from './mediaViewerTypes';
import { ZoomableImageViewport } from './ZoomableImageViewport';

export type { NavigateDirection } from './mediaViewerTypes';

export type MediaViewerProps = {
  kind: MediaKind;
  mimeType: string;
  displayUrl: string;
  imageAlt: string;
  /** Called when the user dismisses the viewer (close control). */
  onClose: () => void;
  onNavigate?: (direction: NavigateDirection) => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
  /**
   * Connects to {@link useMediaViewerKeyboard}'s `escapeConsumedRef` so Escape resets zoom before closing.
   */
  escapeConsumedRef?: MutableRefObject<(() => boolean) | null>;
};

/** Matches narrow layout in {@link MediaItemScreen} (viewer + metadata stack). */
const MOBILE_NAV_MEDIA = '(max-width: 968px)';

const isZoomableImage = (kind: MediaKind, mimeType: string): boolean => {
  const mt = mimeType.trim().toLowerCase();
  if (kind === 'PHOTO') {
    return true;
  }
  return mt.startsWith('image/');
};

export const MediaViewer = (props: MediaViewerProps) => {
  const {
    kind,
    mimeType,
    displayUrl,
    imageAlt,
    onClose,
    onNavigate,
    canNavigatePrevious = false,
    canNavigateNext = false,
    escapeConsumedRef,
  } = props;

  const showNavControls = canNavigatePrevious || canNavigateNext;
  const isMobileLayout = useMediaQuery(MOBILE_NAV_MEDIA);
  const [zoomActive, setZoomActive] = useState(false);
  const zoomActiveRef = useRef(false);
  const resetZoomRef = useRef<(() => void) | null>(null);
  const swipeEnabled = isMobileLayout && showNavControls && !zoomActive;
  const zoomLayerEnabled = isZoomableImage(kind, mimeType);

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

  const goNavigate = useCallback(
    (direction: NavigateDirection) => {
      if (direction === 'previous' && !canNavigatePrevious) {
        return;
      }
      if (direction === 'next' && !canNavigateNext) {
        return;
      }
      onNavigate?.(direction);
    },
    [canNavigateNext, canNavigatePrevious, onNavigate],
  );

  const { swipeHandlers } = useMediaSwipeNavigation({
    enabled: swipeEnabled,
    canNavigatePrevious,
    canNavigateNext,
    onNavigate: goNavigate,
  });

  const media = (
    <ZoomableImageViewport
      key={displayUrl}
      enabled={zoomLayerEnabled}
      onZoomActiveChange={setZoomActive}
      resetZoomRef={resetZoomRef}
    >
      <MediaRenderer kind={kind} mimeType={mimeType} displayUrl={displayUrl} imageAlt={imageAlt} />
    </ZoomableImageViewport>
  );

  const mediaOnly = <MediaChrome>{media}</MediaChrome>;

  return (
    <ViewerRoot>
      <ViewerShell>
        {showNavControls ? (
          isMobileLayout ? (
            <MobileNavLayout>
              <SwipeableMediaPane {...swipeHandlers}>
                <MobileTapStage>
                  <ViewerCardMobile>{mediaOnly}</ViewerCardMobile>
                  <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
                    ✕
                  </StageImageCloseButton>
                  <TapZonesOverlay $allowNav={!zoomActive}>
                    <TapZoneButton
                      type="button"
                      aria-label="Previous image"
                      disabled={!canNavigatePrevious}
                      onClick={() => {
                        goNavigate('previous');
                      }}
                    />
                    <TapZoneButton
                      type="button"
                      aria-label="Next image"
                      disabled={!canNavigateNext}
                      onClick={() => {
                        goNavigate('next');
                      }}
                    />
                  </TapZonesOverlay>
                </MobileTapStage>
              </SwipeableMediaPane>
            </MobileNavLayout>
          ) : (
            <DesktopNavLayout>
              <DesktopMediaStage>
                <ViewerCardDesktop>{mediaOnly}</ViewerCardDesktop>
                <DesktopNavOverlayButton
                  type="button"
                  aria-label="Previous image"
                  disabled={!canNavigatePrevious}
                  $side="start"
                  onClick={() => {
                    goNavigate('previous');
                  }}
                >
                  ‹
                </DesktopNavOverlayButton>
                <DesktopNavOverlayButton
                  type="button"
                  aria-label="Next image"
                  disabled={!canNavigateNext}
                  $side="end"
                  onClick={() => {
                    goNavigate('next');
                  }}
                >
                  ›
                </DesktopNavOverlayButton>
                <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
                  ✕
                </StageImageCloseButton>
              </DesktopMediaStage>
            </DesktopNavLayout>
          )
        ) : (
          <ViewerCard $positionForOverlay>
            {mediaOnly}
            <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
              ✕
            </StageImageCloseButton>
          </ViewerCard>
        )}
      </ViewerShell>
    </ViewerRoot>
  );
};

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

/**
 * Same layer/insets as {@link DesktopNavOverlayButton} (right), aligned to the top so it sits over
 * the image like the chevrons. Softer/transparent on wide containers (full-bleed image feel).
 */
const StageImageCloseButton = styled.button`
  position: absolute;
  top: max(${({ theme }) => theme.spacing(2)}, env(safe-area-inset-top, 0px));
  right: max(${({ theme }) => theme.spacing(2)}, env(safe-area-inset-right, 0px));
  z-index: 4;
  width: clamp(28px, 7vmin, 44px);
  height: clamp(28px, 7vmin, 44px);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(15px, 3.5vmin, 20px);
  line-height: 1;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: rgba(255, 255, 255, 0.95);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  pointer-events: auto;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.52);
    border-color: rgba(255, 255, 255, 0.32);
    color: rgba(255, 255, 255, 0.98);
  }

  @container media-stage (min-width: 880px) {
    background: rgba(0, 0, 0, 0.16);
    border-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.78);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);

    &:hover {
      background: rgba(0, 0, 0, 0.32);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.95);
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;

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

const DesktopNavLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  flex: 1;
`;

const MobileNavLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: min(960px, 100%);
  min-height: 0;
  flex: 1;
`;

/** Lets vertical scrolling pass through to {@link ViewerShell}; horizontal swipes are handled in JS. */
const SwipeableMediaPane = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  touch-action: pan-y;
`;

const MobileTapStage = styled.div`
  position: relative;
  container-type: inline-size;
  container-name: media-stage;
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

/** Invisible left/right hit targets (swipe still works on the whole pane). */
const TapZonesOverlay = styled.div<{ $allowNav: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  pointer-events: none;

  & > * {
    pointer-events: ${({ $allowNav }) => ($allowNav ? 'auto' : 'none')};
  }
`;

const TapZoneButton = styled.button`
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -4px;
  }
`;

const ViewerCard = styled.div<{ $positionForOverlay?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  max-width: min(960px, 100%);
  width: 100%;
  min-height: 200px;
  box-sizing: border-box;
  ${({ $positionForOverlay }) =>
    $positionForOverlay
      ? css`
          position: relative;
          container-type: inline-size;
          container-name: media-stage;
        `
      : undefined}

  @media (max-width: 968px) {
    padding: ${({ theme }) => theme.spacing(2)};
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const ViewerCardMobile = styled(ViewerCard)`
  width: 100%;
  min-height: 0;
  flex: 1;
`;

/** Desktop: tighter frame so the image can dominate; arrows sit in {@link DesktopNavOverlayButton} on top. */
const ViewerCardDesktop = styled(ViewerCard)`
  padding: ${({ theme }) => theme.spacing(2)};
  gap: 0;
  max-width: min(1400px, 100%);
`;

const DesktopMediaStage = styled.div`
  position: relative;
  container-type: inline-size;
  container-name: media-stage;
  align-self: center;
  width: 100%;
  max-width: min(1400px, 100%);
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** Google Photos–style floating chevrons on the image */
const DesktopNavOverlayButton = styled.button<{ $side: 'start' | 'end' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 48px;
  height: 48px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.38);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  transition:
    background 0.15s ease,
    transform 0.15s ease;

  ${({ $side, theme }) =>
    $side === 'start'
      ? css`
          left: ${theme.spacing(2)};
        `
      : css`
          right: ${theme.spacing(2)};
        `}

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.52);
  }

  &:disabled {
    opacity: 0.28;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }
`;
