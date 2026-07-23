import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { ViewerStageDesktop } from './MediaViewerStyles';
import { NavigateDirection } from './mediaViewerTypes';

type MediaViewerDesktopNavProps = {
  media: ReactNode;
  onNavigate: (direction: NavigateDirection) => void;
  canNavigate: boolean;
};

export const MediaViewerDesktopNav = ({
  media,
  onNavigate,
  canNavigate,
}: MediaViewerDesktopNavProps) => {
  return (
    <DesktopNavLayout>
      <DesktopMediaStage>
        <DesktopNavMarginButton
          type="button"
          aria-label="Previous image"
          disabled={!canNavigate}
          $side="start"
          onClick={() => onNavigate('previous')}
        >
          <ChevronLeft size={28} strokeWidth={2} aria-hidden />
        </DesktopNavMarginButton>

        <ViewerStageDesktop>{media}</ViewerStageDesktop>

        <DesktopNavMarginButton
          type="button"
          aria-label="Next image"
          disabled={!canNavigate}
          $side="end"
          onClick={() => onNavigate('next')}
        >
          <ChevronRight size={28} strokeWidth={2} aria-hidden />
        </DesktopNavMarginButton>
      </DesktopMediaStage>
    </DesktopNavLayout>
  );
};

const DesktopNavLayout = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  min-height: 0;
  flex: 1;
`;

const DesktopMediaStage = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  min-width: 0;
`;

/** Chevrons sit in the dark stage margin beside the photo, not on the image. */
const DesktopNavMarginButton = styled.button<{ $side: 'start' | 'end' }>`
  flex-shrink: 0;
  align-self: center;
  z-index: 3;
  width: 48px;
  height: 48px;
  margin: 0 ${({ theme }) => theme.spacing(1)};
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color.body};
  cursor: pointer;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.color.body} 22%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, ${({ theme }) => theme.color.body} 10%, transparent);
  opacity: 0;
  transition:
    opacity 0.2s ease,
    background 0.15s ease,
    border-color 0.15s ease;

  ${({ $side }) =>
    $side === 'start'
      ? css`
          order: 0;
        `
      : css`
          order: 2;
        `}

  ${DesktopMediaStage}:hover &, ${DesktopMediaStage}:focus-within & {
    opacity: 1;
  }

  &:hover:not(:disabled) {
    background: color-mix(in srgb, ${({ theme }) => theme.color.body} 18%, transparent);
    border-color: color-mix(in srgb, ${({ theme }) => theme.color.body} 32%, transparent);
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0;
    cursor: not-allowed;
    pointer-events: none;
  }
`;
