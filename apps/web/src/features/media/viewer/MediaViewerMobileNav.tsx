import { ReactNode } from 'react';
import styled from 'styled-components';
import { StageImageCloseButton, ViewerCard } from './MediaViewerStyles';
import type { NavigateDirection } from './mediaViewerTypes';

type MediaViewerMobileNavProps = {
  media: ReactNode;
  belowMedia?: ReactNode;
  onClose: () => void;
  onNavigate: (direction: NavigateDirection) => void;
  canNavigate: boolean;
  zoomActive: boolean;
  swipeHandlers: Record<string, unknown>;
};

export const MediaViewerMobileNav = ({
  media,
  belowMedia,
  onClose,
  onNavigate,
  canNavigate,
  zoomActive,
  swipeHandlers,
}: MediaViewerMobileNavProps) => {
  return (
    <MobileNavLayout>
      <SwipeableMediaPane {...swipeHandlers}>
        <MobileTapStage>
          <ViewerCardMobile>{media}</ViewerCardMobile>

          <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
            ✕
          </StageImageCloseButton>

          <TapZonesOverlay $allowNav={!zoomActive}>
            <TapZoneButton
              type="button"
              aria-label="Previous image"
              disabled={!canNavigate}
              onClick={() => onNavigate('previous')}
            />
            <TapZoneButton
              type="button"
              aria-label="Next image"
              disabled={!canNavigate}
              onClick={() => onNavigate('next')}
            />
          </TapZonesOverlay>
        </MobileTapStage>
      </SwipeableMediaPane>
      {belowMedia}
    </MobileNavLayout>
  );
};

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
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: -4px;
  }
`;

const ViewerCardMobile = styled(ViewerCard)`
  width: 100%;
  min-height: 0;
  flex: 1;
`;
