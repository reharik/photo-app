import { css } from 'styled-components';

/** Fades stage overlay chrome (close button, action bar) without affecting sheets. */
export const viewerChromeVisibility = css<{ $visible: boolean }>`
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
`;
