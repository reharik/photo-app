import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { StageImageCloseButton, ViewerCard } from './MediaViewerStyles';
import { NavigateDirection } from './mediaViewerTypes';

type MediaViewerDesktopNavProps = {
  media: ReactNode;
  onClose: () => void;
  onNavigate: (direction: NavigateDirection) => void;
  canNavigate: boolean;
};

export const MediaViewerDesktopNav = ({
  media,
  onClose,
  onNavigate,
  canNavigate,
}: MediaViewerDesktopNavProps) => {
  return (
    <DesktopNavLayout>
      <DesktopMediaStage>
        <ViewerCardDesktop>{media}</ViewerCardDesktop>

        <DesktopNavOverlayButton
          type="button"
          aria-label="Previous image"
          disabled={!canNavigate}
          $side="start"
          onClick={() => onNavigate('previous')}
        >
          ‹
        </DesktopNavOverlayButton>

        <DesktopNavOverlayButton
          type="button"
          aria-label="Next image"
          disabled={!canNavigate}
          $side="end"
          onClick={() => onNavigate('next')}
        >
          ›
        </DesktopNavOverlayButton>

        <StageImageCloseButton type="button" onClick={onClose} aria-label="Close viewer">
          ✕
        </StageImageCloseButton>
      </DesktopMediaStage>
    </DesktopNavLayout>
  );
};

const DesktopNavLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;
