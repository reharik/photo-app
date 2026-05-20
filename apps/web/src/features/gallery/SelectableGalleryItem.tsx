import styled from 'styled-components';
import { GalleryActionItems } from '../../hooks/useMultiSelectGallery';
import { SelectionThumbOverlay } from './SelectionCornerCheck';
import { SelectionToggleControl } from './SelectionToggleControl';

export type GalleryItemFrameVariant = 'default' | 'shared';

interface SelectableGalleryItemProps {
  itemId: string;
  isSelected: boolean;
  onToggle: () => void;
  onModifierClick: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  /** `shared`: viewer is not the owner (e.g. album shared with them). */
  selectable?: boolean;
  selectableActions?: GalleryActionItems[];
}

export const SelectableGalleryItem: React.FC<SelectableGalleryItemProps> = ({
  itemId,
  selectable = true,
  isSelected,
  onModifierClick,
  onToggle,
  children,
  selectableActions = [],
}: SelectableGalleryItemProps) => {
  return (
    <Item data-testid={`media-tile-${itemId}`}>
      {/* TODO: fix boarder for shared items */}
      <MediaThumb $frameVariant={false} data-selectable-thumb="">
        <ThumbClickCapture onClickCapture={onModifierClick}>
          <SelectionThumbOverlay visible={selectable && selectableActions.length > 0} />
          {children}
          {selectable && <SelectionToggleControl selected={isSelected} onToggle={onToggle} />}
        </ThumbClickCapture>
      </MediaThumb>
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

/** Card shell: border, surface, clipping. Positioning for overlays lives on ThumbLink. */
const MediaThumb = styled.div<{ $frameVariant: boolean }>`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  ${({ $frameVariant, theme }) =>
    !$frameVariant
      ? `
    border: 2px solid ${theme.color.green_darkest};
    box-shadow: inset 0 0 0 2px ${theme.color.primaryButtonBg}40;
  `
      : `
    border: 1px solid ${theme.color.border};
  `}
`;

const ThumbClickCapture = styled('div')`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1 1 auto;
  color: inherit;
  text-decoration: none;
`;
