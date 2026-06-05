import styled from 'styled-components';
import type { GalleryActionItems } from '../../../hooks/useMultiSelectGallery';
import { LibrarySelectionToggle } from './LibrarySelectionToggle';

const SELECTED_PHOTO_SCALE = 0.92;
const PHOTO_SCALE_TRANSITION = 'transform 180ms cubic-bezier(0.2, 0, 0, 1)';

type LibrarySelectableItemProps = {
  itemId: string;
  isSelected: boolean;
  selectionActive: boolean;
  onToggle: () => void;
  onModifierClick: (event: React.MouseEvent) => void;
  selectable?: boolean;
  selectableActions?: GalleryActionItems[];
  children: React.ReactNode;
};

export const LibrarySelectableItem = ({
  itemId,
  selectable = true,
  isSelected,
  selectionActive,
  onModifierClick,
  onToggle,
  children,
  selectableActions = [],
}: LibrarySelectableItemProps) => {
  const showSelectionChrome = selectable && selectableActions.length > 0;
  const showSelectedFrame = isSelected && selectionActive && showSelectionChrome;

  return (
    <Item data-testid={`media-tile-${itemId}`}>
      <ThumbFrame data-library-selectable-thumb="" $showSelectedFrame={showSelectedFrame}>
        <ThumbClickCapture onClickCapture={onModifierClick}>
          <PhotoScaleLayer $scaled={showSelectedFrame}>
            {children}
            {showSelectionChrome ? (
              <LibrarySelectionToggle
                selected={isSelected}
                selectionActive={selectionActive}
                onToggle={onToggle}
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
    $showSelectedFrame
      ? `box-shadow: inset 0 0 0 2px ${theme.color.primaryButtonBg};`
      : ''}
`;

const ThumbClickCapture = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`;

const PhotoScaleLayer = styled.div<{ $scaled: boolean }>`
  position: relative;
  width: 100%;
  min-width: 0;
  border-radius: 3px;
  transform: scale(${({ $scaled }) => ($scaled ? SELECTED_PHOTO_SCALE : 1)});
  transform-origin: center center;
  transition: ${PHOTO_SCALE_TRANSITION};
`;
