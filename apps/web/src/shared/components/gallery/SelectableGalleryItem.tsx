import { ViewerOperation } from '@packages/contracts';
import styled from 'styled-components';
import { SelectionThumbOverlay } from './SelectionCornerCheck';
import { SelectionToggleControl } from './SelectionToggleControl';

export type GalleryItemFrameVariant = 'default' | 'shared';

interface SelectableGalleryItemProps {
  isSelected: boolean;
  onToggle: () => void;
  onModifierClick: (event: React.MouseEvent) => void;
  children: React.ReactNode;
  /** `shared`: viewer is not the owner (e.g. album shared with them). */
  selectable?: boolean;
  selectableActions?: ViewerOperation[];
}

export const SelectableGalleryItem: React.FC<SelectableGalleryItemProps> = ({
  selectable = true,
  isSelected,
  onModifierClick,
  onToggle,
  children,
  selectableActions = [],
}: SelectableGalleryItemProps) => {
  return (
    <Item>
      <MediaThumb data-selectable-thumb="">
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

const MediaThumb = styled('div')`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.colors.panel};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
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
