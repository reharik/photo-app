import { css } from 'styled-components';
import { MaxWidthBreakpoint, MinWidthBreakpoint } from '../../../styles/theme';

export type MediaGridColumnCounts = {
  mobile: number;
  tablet: number;
  desktop: number;
};

/** Home library — full-width page grid. */
export const LIBRARY_GRID_COLUMNS: MediaGridColumnCounts = { mobile: 3, tablet: 3, desktop: 4 };

/** Album / public album — embedded scroll with metadata header. */
export const ALBUM_GRID_COLUMNS: MediaGridColumnCounts = { mobile: 2, tablet: 3, desktop: 3 };

/** Add-to-album modal picker. */
export const PICKER_GRID_COLUMNS: MediaGridColumnCounts = { mobile: 4, tablet: 4, desktop: 5 };

// TODO: usePersistedColumnCounts(viewKey, defaults) → read/write localStorage override per view.
// TODO: pinch (mobile) and +/- (desktop) controls to mutate the persisted override.

export const mediaGridColumnStyles = (counts: MediaGridColumnCounts) => css`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(${counts.mobile}, 1fr);
  gap: 4px;

  @media screen and (min-width: ${MinWidthBreakpoint.Tablet}px) and (max-width: ${MaxWidthBreakpoint.Tablet}px) {
    grid-template-columns: repeat(${counts.tablet}, 1fr);
  }

  @media screen and (min-width: ${MinWidthBreakpoint.Desktop}px) {
    grid-template-columns: repeat(${counts.desktop}, 1fr);
  }
`;
