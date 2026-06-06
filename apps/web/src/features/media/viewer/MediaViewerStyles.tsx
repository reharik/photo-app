import styled, { css } from 'styled-components';

/* White on image overlay — not theme page chrome. */
const stageImageOverlayButtonStyles = css`
  position: absolute;
  top: max(${({ theme }) => theme.spacing(2)}, env(safe-area-inset-top, 0px));
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
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }
`;

export const StageImageCloseButton = styled.button`
  ${stageImageOverlayButtonStyles}
  right: max(${({ theme }) => theme.spacing(2)}, env(safe-area-inset-right, 0px));
`;

export const StageImageDetailsToggleButton = styled.button<{ $active?: boolean }>`
  ${stageImageOverlayButtonStyles}
  left: max(${({ theme }) => theme.spacing(2)}, env(safe-area-inset-left, 0px));
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-weight: 600;

  ${({ $active }) =>
    $active
      ? css`
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.45);
          color: rgba(255, 255, 255, 1);
        `
      : undefined}
`;

export const ViewerCard = styled.div<{ $positionForOverlay?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(3)};
  padding: ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
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
    min-height: 0;
  }
`;

/** Desktop photo stage — no card frame; sits on {@link theme.color.stageDark}. */
export const ViewerStageDesktop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(2)};
  flex: 1;
  order: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
`;

