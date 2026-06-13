import styled from 'styled-components';
import { EmptyState } from '../../ui/EmptyState';
import { AlbumSummaryVM } from '../../viewModels/';
import { ALBUM_LIST_COLUMNS } from '../media/grid/gridColumns';
import { MediaGrid } from '../media/grid/MediaGrid';
import type { MultiSelectProps } from '../media/grid/types';
import { AlbumTile } from '../albums/AlbumTile';

const noopMultiSelect: MultiSelectProps = {
  isSelected: () => false,
  handleModifierClick: () => undefined,
  toggleSelectAt: () => undefined,
  enterSelectionAt: () => undefined,
};

type SharedAlbumListSectionProps = {
  nodes: AlbumSummaryVM[];
};

export const SharedAlbumListSection = ({ nodes }: SharedAlbumListSectionProps) => {
  return (
    <Container>
      <PageHeader>
        <Header>
          <Title>Shared albums</Title>
        </Header>
      </PageHeader>
      <ScrollArea>
        {nodes.length === 0 ? (
          <EmptyStateWrap>
            <EmptyState
              title="No shared albums"
              text="When someone shares an album with you, it will show up here."
            />
          </EmptyStateWrap>
        ) : (
          <GridWrap>
            <MediaGrid
              nodes={nodes}
              multiSelectProps={noopMultiSelect}
              selectableActions={[]}
              selectable={false}
              selectionActive={false}
              columnCounts={ALBUM_LIST_COLUMNS}
              groupBy="none"
              renderItem={(album) => <AlbumTile album={album} />}
            />
          </GridWrap>
        )}
      </ScrollArea>
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(6)}`};
  border-bottom: 1px solid ${({ theme }) => theme.color.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
    align-items: center;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.5px;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.2px;
    flex: 1;
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const GridWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const EmptyStateWrap = styled.div`
  padding: ${({ theme }) => theme.spacing(2)};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;
  width: 100%;
`;
