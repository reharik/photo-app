import styled from 'styled-components';
import { SelectionThumbOverlay } from './SelectionCornerCheck';
import { SelectionToggleControl } from './SelectionToggleControl';

interface SelectableGalleryItemProps {
  isSelected: boolean;
  onToggle: () => void;
  onModifierClick: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

export const SelectableGalleryItem = ({
  isSelected,
  onModifierClick,
  onToggle,
  children,
}: SelectableGalleryItemProps) => {
  return (
    <Item>
      <MediaThumb data-selectable-thumb="">
        <ThumbClickCapture onClickCapture={onModifierClick}>
          <SelectionThumbOverlay visible={isSelected} />
          {children}
          <SelectionToggleControl selected={isSelected} onToggle={onToggle} />
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
const MediaThumb = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
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
