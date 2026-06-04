import { JSX, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { StageImageCloseButton, ViewerCard } from './MediaViewerStyles';
type MediaViewerMobileProps = {
  media: ReactNode;
  belowMedia?: ReactNode;
  onClose: () => void;
  chromeVisible: boolean;
  showCloseButton?: boolean;
  gestureHandlers: Record<string, unknown>;
};

export const MediaViewerMobile = ({
  media,
  belowMedia,
  onClose,
  chromeVisible,
  showCloseButton = true,
  gestureHandlers,
}: MediaViewerMobileProps): JSX.Element => {
  return (
    <MobileLayout>
      <MobileMediaStage {...gestureHandlers}>
        <ViewerCardMobile>{media}</ViewerCardMobile>

        {showCloseButton ? (
          <ChromeLayer $visible={chromeVisible}>
            <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
              ✕
            </StageImageCloseButton>
          </ChromeLayer>
        ) : null}
      </MobileMediaStage>

      {belowMedia != null ? <ReactionsSlot>{belowMedia}</ReactionsSlot> : null}
    </MobileLayout>
  );
};

const MobileLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  max-width: min(960px, 100%);
  min-height: 0;
  flex: 0 0 auto;
`;

const MobileMediaStage = styled.div`
  position: relative;
  container-type: inline-size;
  container-name: media-stage;
  flex: 0 0 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  touch-action: none;
`;

const chromeVisibility = css<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
`;

const ChromeLayer = styled.div<{ $visible: boolean }>`
  ${chromeVisibility}
`;

/** Reactions stay visible in immersive (no-chrome) mode; only overlay chrome is toggled. */
const ReactionsSlot = styled.div`
  flex-shrink: 0;
`;

const ViewerCardMobile = styled(ViewerCard)`
  width: 100%;
  min-height: 0;
  flex: 0 0 auto;
`;
