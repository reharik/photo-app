import { JSX, type ReactNode } from 'react';
import styled from 'styled-components';
import { MobileViewerActionBar } from './MobileViewerActionBar';
import type { MobileViewerSheet } from './mediaViewerTypes';
import { StageImageCloseButton, ViewerCard } from './MediaViewerStyles';
import { viewerChromeVisibility } from './viewerChromeVisibility';

type MediaViewerMobileProps = {
  media: ReactNode;
  onClose: () => void;
  chromeVisible: boolean;
  showCloseButton?: boolean;
  gestureHandlers: Record<string, unknown>;
  activeSheet: MobileViewerSheet;
  onOpenInfoSheet: () => void;
  onOpenCommentSheet: () => void;
};

export const MediaViewerMobile = ({
  media,
  onClose,
  chromeVisible,
  showCloseButton = true,
  gestureHandlers,
  activeSheet,
  onOpenInfoSheet,
  onOpenCommentSheet,
}: MediaViewerMobileProps): JSX.Element => {
  return (
    <MobileLayout>
      <MobileMediaStage {...gestureHandlers}>
        <ViewerCardMobile>{media}</ViewerCardMobile>

        <ChromeLayer $visible={chromeVisible}>
          {showCloseButton ? (
            <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
              ✕
            </StageImageCloseButton>
          ) : null}
        </ChromeLayer>

        <MobileViewerActionBar
          chromeVisible={chromeVisible}
          activeSheet={activeSheet}
          // TODO: inline reaction picker — React opens Comment sheet for now.
          onReact={onOpenCommentSheet}
          onComment={onOpenCommentSheet}
          onInfo={onOpenInfoSheet}
        />
      </MobileMediaStage>
    </MobileLayout>
  );
};

const MobileLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  min-height: 0;
  flex: 1;
  height: 100%;
`;

const MobileMediaStage = styled.div`
  position: relative;
  container-type: inline-size;
  container-name: media-stage;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  touch-action: none;
`;

const ChromeLayer = styled.div<{ $visible: boolean }>`
  ${viewerChromeVisibility}
`;

const ViewerCardMobile = styled(ViewerCard)`
  width: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
  border: none;
  border-radius: 0;
`;
