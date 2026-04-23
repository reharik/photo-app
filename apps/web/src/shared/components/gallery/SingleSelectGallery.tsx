import styled from 'styled-components';

type SingleSelectGalleryProps<T extends { id: string }> = {
  nodes: T[];
  emptyState?: React.ReactNode;
  /** When true, render only the grid (no inner scroll/padding); parent supplies overflow. */
  embedInParentScroll?: boolean;
  /**
   * Minimum column width for `grid-template-columns: repeat(auto-fill, minmax(...))`.
   */
  renderItem: (args: { item: T; index: number }) => React.ReactNode;
};

export const SingleSelectGallery = <T extends { id: string }>({
  nodes,
  emptyState,
  embedInParentScroll = false,
  renderItem,
}: SingleSelectGalleryProps<T>) => {
  if (nodes.length === 0) {
    if (embedInParentScroll) {
      return <EmbedEmptySlot>{emptyState}</EmbedEmptySlot>;
    }
    return null;
  }
  const grid = (
    <GalleryContainer>
      {nodes.map((item, index) => {
        return renderItem({
          item,
          index,
        });
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
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing(2)};
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: ${({ theme }) => theme.spacing(1)};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  /* padding: ${({ theme }) => theme.spacing(6)}; */
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(3)};
  }
`;

/** Vertical spacing when empty state sits in a parent scroll area (padding comes from parent). */
const EmbedEmptySlot = styled.div`
  padding-top: ${({ theme }) => theme.spacing(2)};
`;
