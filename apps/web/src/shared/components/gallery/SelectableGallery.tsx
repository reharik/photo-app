import styled from 'styled-components';
import { SelectableGalleryItem } from './SelectableGalleryItem';

export type MultiSelectProps = {
  isSelected: (id: string) => boolean;
  handleModifierClick: (e: React.MouseEvent, id: string, index: number) => void;
  toggleSelectAt: (id: string, index: number) => void;
};

type SelectableGalleryProps<T extends { id: string }> = {
  nodes: T[];
  multiSelectProps: MultiSelectProps;
  emptyState: React.ReactNode;
  renderItem: (args: { item: T; isSelected: boolean; index: number }) => React.ReactNode;
};

export const SelectableGallery = <T extends { id: string }>({
  nodes,
  multiSelectProps,
  emptyState,
  renderItem,
}: SelectableGalleryProps<T>) => {
  if (nodes.length === 0) {
    return emptyState;
  }
  return (
    <Content>
      <GalleryContainer>
        {nodes.map((item, index) => {
          return (
            <SelectableGalleryItem
              key={item.id}
              isSelected={multiSelectProps.isSelected(item.id)}
              onToggle={() => multiSelectProps.toggleSelectAt(item.id, index)}
              onModifierClick={(event) =>
                multiSelectProps.handleModifierClick(event, item.id, index)
              }
            >
              {renderItem({ item, index, isSelected: multiSelectProps.isSelected(item.id) })}
            </SelectableGalleryItem>
          );
        })}
      </GalleryContainer>
    </Content>
  );
};

const GalleryContainer = styled.div`
  display: grid;
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
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing(6)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;
