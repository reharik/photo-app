import { useMemo } from 'react';
import styled from 'styled-components';
import { MediaItem } from '../../graphql/generated/types';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { RecentMediaHeader } from './gallery/headers/RecentMediaHeader';
import { Gallery } from './gallery/SelectableGallery';
import { GalleryHeader } from './gallery/SelectableGalleryHeader';
import { UploadMediaButton } from './UploadMediaButton';

export const RecentMediaSection = ({ nodes }: { nodes: MediaItem[] }) => {
  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const { selectionCount, isSelected, handleModifierClick, toggleSelectAt, clearSelection } =
    useMultiSelectIds(orderedMediaIds);

  return (
    <Container>
      {/* break this into selection bar and header, and decide based on selectionCount */}
      <GalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        SelectionActions={UploadMediaButton}
        Header={() => <RecentMediaHeader onComplete={() => void refetch()} />}
      />

      {/* break this into SelectableGallery and EmptyState, and decide based on nodes.length */}
      <Gallery
        nodes={nodes}
        isSelected={isSelected}
        handleModifierClick={handleModifierClick}
        toggleSelectAt={toggleSelectAt}
        emptyTitle="No media yet"
        emptyText="Upload your first media to start building your family gallery"
        emptyAction={
          <UploadMediaButton setAppErrors={setAppErrors} onComplete={() => void refetch()} />
        }
      />
    </Container>
  );
};

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
