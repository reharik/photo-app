import { useMemo } from 'react';
import styled from 'styled-components';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { MediaItemSummaryVM } from '../../viewModels/media/MediaItemSummaryVM';
import { EmptyState } from './gallery/EmptyState';
import { MediaItemTile } from './gallery/mediaTiles/MediaItemTile';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';
import { UploadMediaButton } from './UploadMediaButton';

type RecentMediaSectionProps = {
  nodes: MediaItemSummaryVM[];
  reloadData: () => void;
};

export const RecentMediaSection = ({ nodes, reloadData }: RecentMediaSectionProps) => {
  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const { selectionCount, isSelected, handleModifierClick, toggleSelectAt, clearSelection } =
    useMultiSelectIds(orderedMediaIds);

  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        SelectionActions={() => <div>Hi mom</div>}
        Header={() => (
          <>
            <Title>Recent Media</Title>
            <HeaderActions>
              <UploadMediaButton onComplete={reloadData} />
            </HeaderActions>
          </>
        )}
      />

      <SelectableGallery
        nodes={nodes}
        multiSelectProps={{ isSelected, handleModifierClick, toggleSelectAt }}
        emptyState={
          <EmptyState
            title="No media yet"
            text="Upload your first media to start building your family gallery"
            action={<UploadMediaButton onComplete={reloadData} />}
          />
        }
        renderItem={({ item }) => <MediaItemTile item={item} />}
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 500;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  letter-spacing: -0.5px;
  min-width: 0;

  @media (max-width: 768px) {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.2px;
    flex: 1;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-shrink: 0;
`;
