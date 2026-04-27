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
  frameVariant?: GalleryItemFrameVariant;
}

export const SelectableGalleryItem = ({
  isSelected,
  onModifierClick,
  onToggle,
  children,
  frameVariant = 'default',
}: SelectableGalleryItemProps) => {
  return (
    <Item>
      <MediaThumb $frameVariant={frameVariant} data-selectable-thumb="">
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
const MediaThumb = styled.div<{ $frameVariant: GalleryItemFrameVariant }>`
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${({ theme }) => theme.colors.panel};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  ${({ $frameVariant, theme }) =>
    $frameVariant === 'shared'
      ? `
    border: 2px dashed ${theme.colors.subtext};
    box-shadow: inset 0 0 0 1px ${theme.colors.accent}40;
  `
      : `
    border: 1px solid ${theme.colors.border};
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
