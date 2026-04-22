import styled from 'styled-components';
import { SelectableGalleryItem } from './SelectableGalleryItem';

export type MultiSelectProps = {
  isSelected: (id: string) => boolean;
  handleModifierClick: (e: React.MouseEvent, id: string, index: number) => void;
  toggleSelectAt: (id: string, index: number) => void;
};

type SelectableGalleryProps<T extends { id: string }> = {
  nodes: T[];
  orderedMediaIds: string[];
  multiSelectProps: MultiSelectProps;
  emptyState: React.ReactNode;
  /** When true, render only the grid (no inner scroll/padding); parent supplies overflow. */
  embedInParentScroll?: boolean;
  renderItem: (args: {
    item: T;
    orderedMediaIds: string[];
    isSelected: boolean;
    index: number;
  }) => React.ReactNode;
};

export const SelectableGallery = <T extends { id: string }>({
  nodes,
  multiSelectProps,
  emptyState,
  embedInParentScroll = false,
  renderItem,
  orderedMediaIds,
}: SelectableGalleryProps<T>) => {
  if (nodes.length === 0) {
    if (embedInParentScroll) {
      return <EmbedEmptySlot>{emptyState}</EmbedEmptySlot>;
    }
    return emptyState;
  }
  const grid = (
    <GalleryContainer>
      {nodes.map((item, index) => {
        return (
          <SelectableGalleryItem
            key={item.id}
            isSelected={multiSelectProps.isSelected(item.id)}
            onToggle={() => multiSelectProps.toggleSelectAt(item.id, index)}
            onModifierClick={(event) => multiSelectProps.handleModifierClick(event, item.id, index)}
          >
            {renderItem({
              item,
              index,
              orderedMediaIds,
              isSelected: multiSelectProps.isSelected(item.id),
            })}
          </SelectableGalleryItem>
        );
      })}
    </GalleryContainer>
  );
  if (embedInParentScroll) {
    return grid;
  }
  return <Content>{grid}</Content>;
};

const GalleryContainer = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: ${({ theme }) => theme.spacing(2)};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(6)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;

/** Vertical spacing when empty state sits in a parent scroll area (padding comes from parent). */
const EmbedEmptySlot = styled.div`
  padding-top: ${({ theme }) => theme.spacing(2)};
`;
