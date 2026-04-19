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
        <ThumbLink onClickCapture={onModifierClick}>
          <SelectionThumbOverlay visible={isSelected} />
          {children}
          <SelectionToggleControl selected={isSelected} onToggle={onToggle} />
        </ThumbLink>
      </MediaThumb>
    </Item>
  );
};

const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const MediaThumb = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;
const ThumbLink = styled('a')`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  text-decoration: none;
`;
