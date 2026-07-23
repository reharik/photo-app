import { useCallback } from 'react';
import styled from 'styled-components';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import { MediaGridSelectionToggle } from './MediaGridSelectionToggle';

const SELECTED_PHOTO_SCALE = 0.92;
const UNSELECTED_DIM_OPACITY = 0.65;
const PHOTO_SCALE_TRANSITION = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)';
const PHOTO_DIM_TRANSITION = 'opacity 150ms ease';

// Future: selectionMode 'single' | 'multi' for the cover picker — current behavior
// assumes multi-select (toggle, modifier range). disableTileNavigation and tileFit
// on MediaGrid are shared with that picker; only selection semantics will extend here.

type MediaGridSelectableItemProps = {
  itemId: string;
  isSelected: boolean;
  selectionActive: boolean;
  onToggle: () => void;
  onEnterSelection: () => void;
  onModifierClick: (event: React.MouseEvent) => void;
  selectable?: boolean;
  selectableActions?: GalleryActionItems[];
  dimUnselectedTiles?: boolean;
  children: React.ReactNode;
  sentinelRef?: React.RefCallback<HTMLElement>;
  /**
   * When false, the corner selection toggle (the dot) is not rendered and the
   * whole tile becomes the accessible selection control instead — the picker
   * uses this, where the clay selected frame is the only visual affordance.
   */
  showSelectionToggle?: boolean;
};

export const MediaGridSelectableItem = ({
  itemId,
  selectable = true,
  isSelected,
  selectionActive,
  onModifierClick,
  onToggle,
  onEnterSelection,
  dimUnselectedTiles = false,
  children,
  selectableActions = [],
  sentinelRef,
  showSelectionToggle = true,
}: MediaGridSelectableItemProps) => {
  const showSelectionChrome = selectable && selectableActions.length > 0;
  const showSelectedFrame = isSelected && selectionActive && showSelectionChrome;
  const showDimmed = dimUnselectedTiles && !isSelected;
  // With the toggle hidden, the tile itself is the accessible selection control.
  const tileIsSelectionControl = showSelectionChrome && !showSelectionToggle;

  const handleClickCapture = useCallback(
    (event: React.MouseEvent): void => {
      onModifierClick(event);

      if (selectionActive && showSelectionChrome && !event.defaultPrevented) {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }
    },
    [onModifierClick, onToggle, selectionActive, showSelectionChrome],
  );

  const handleSelectionKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === ' ' || event.key === 'Spacebar') {
        // Space would otherwise scroll the modal on every selection.
        event.preventDefault();
        onToggle();
      } else if (event.key === 'Enter') {
        onToggle();
      }
    },
    [onToggle],
  );

  return (
    <Item
      data-testid={`media-tile-${itemId}`}
      ref={sentinelRef}
      $selectionControl={tileIsSelectionControl}
      {...(tileIsSelectionControl
        ? {
            role: 'checkbox',
            'aria-checked': isSelected,
            'aria-label': isSelected ? 'Deselect' : 'Select',
            tabIndex: 0,
            onKeyDown: handleSelectionKeyDown,
          }
        : {})}
    >
      <ThumbFrame data-media-grid-selectable-thumb="" $showSelectedFrame={showSelectedFrame}>
        <ThumbClickCapture onClickCapture={handleClickCapture}>
          <PhotoScaleLayer
            $scaled={showSelectedFrame && !tileIsSelectionControl}
            $dimmed={showDimmed}
          >
            {children}
            {showSelectionChrome && showSelectionToggle ? (
              <MediaGridSelectionToggle
                selected={isSelected}
                selectionActive={selectionActive}
                onToggle={selectionActive ? onToggle : onEnterSelection}
              />
            ) : null}
          </PhotoScaleLayer>
        </ThumbClickCapture>
      </ThumbFrame>
    </Item>
  );
};

const Item = styled.div<{ $selectionControl?: boolean }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  touch-action: manipulation;
  ${({ $selectionControl, theme }) =>
    $selectionControl
      ? `
    border-radius: 3px;
    outline: none;
    &:focus-visible {
      /* Outline lives on the outer Item (overflow: visible) so it is not clipped
         by ThumbFrame's overflow: hidden — the tile is now the focusable control. */
      outline: 2px solid ${theme.color.textAccent};
      outline-offset: 2px;
    }
  `
      : ''}
`;

const ThumbFrame = styled.div<{ $showSelectedFrame: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: 3px;
  background: ${({ theme }) => theme.color.body};

  /* Clay selected frame as an overlay that paints ABOVE the photo. The picker
     removes the tile matte, so the image is edge-to-edge; an inset box-shadow
     would sit behind it and be hidden. This ::after is permanently present and
     only changes color on toggle, so the box never reflows (no layout shift). */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    border-radius: 3px;
    box-shadow: inset 0 0 0 2px
      ${({ $showSelectedFrame, theme }) =>
        $showSelectedFrame ? theme.color.primaryButtonBg : 'transparent'};
    transition: box-shadow 150ms ease;
  }
`;

const ThumbClickCapture = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  touch-action: pan-y;
`;

const PhotoScaleLayer = styled.div<{ $scaled: boolean; $dimmed: boolean }>`
  position: relative;
  width: 100%;
  min-width: 0;
  border-radius: 3px;
  transform: scale(${({ $scaled }) => ($scaled ? SELECTED_PHOTO_SCALE : 1)});
  transform-origin: center center;
  opacity: ${({ $dimmed }) => ($dimmed ? UNSELECTED_DIM_OPACITY : 1)};
  transition: ${PHOTO_SCALE_TRANSITION}, ${PHOTO_DIM_TRANSITION};
`;
