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
}: MediaGridSelectableItemProps) => {
  const showSelectionChrome = selectable && selectableActions.length > 0;
  const showSelectedFrame = isSelected && selectionActive && showSelectionChrome;
  const showDimmed = dimUnselectedTiles && !isSelected;

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

  return (
    <Item data-testid={`media-tile-${itemId}`} ref={sentinelRef}>
      <ThumbFrame data-media-grid-selectable-thumb="" $showSelectedFrame={showSelectedFrame}>
        <ThumbClickCapture onClickCapture={handleClickCapture}>
          <PhotoScaleLayer $scaled={showSelectedFrame} $dimmed={showDimmed}>
            {children}
            {showSelectionChrome ? (
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

const Item = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  touch-action: manipulation;
`;

const ThumbFrame = styled.div<{ $showSelectedFrame: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border-radius: 3px;
  background: ${({ theme }) => theme.color.body};

  ${({ $showSelectedFrame, theme }) =>
    $showSelectedFrame ? `box-shadow: inset 0 0 0 2px ${theme.color.primaryButtonBg};` : ''}
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
