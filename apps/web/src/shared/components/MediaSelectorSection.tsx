import { useMemo } from 'react';
import styled from 'styled-components';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { MediaItemSummaryVM } from '../../viewModels/media/MediaItemSummaryVM';
import { SelectionTile } from './gallery/mediaTiles/SelectionTile';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';
import { MediaSelectionToolbar } from './gallery/selectionActions/MediaSelectionToolbar';

type MediaSelectorSectionProps = {
  nodes: MediaItemSummaryVM[];
  header: React.ReactNode;
  onAddToAlbum: (selectedIds: string[]) => void;
  onClose: () => void;
};

export const MediaSelectorSection = ({
  nodes,
  header,
  onAddToAlbum,
  onClose,
}: MediaSelectorSectionProps) => {
  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const {
    selectedIds,
    selectionCount,
    isSelected,
    handleModifierClick,
    toggleSelectAt,
    clearSelection,
  } = useMultiSelectIds(orderedMediaIds);
  const handleAddToAlbum = useMemo(() => {
    return () => {
      onAddToAlbum(Array.from(selectedIds));
    };
  }, [onAddToAlbum, selectedIds]);
  const handleClose = useMemo(() => {
    return () => {
      clearSelection();
      onClose();
    };
  }, [onClose, clearSelection]);
  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        vPaddingUnits={2}
        hPaddingUnits={3}
        SelectionActions={
          <MediaSelectionToolbar onCancel={handleClose} onAddToAlbum={handleAddToAlbum} />
        }
        Header={() => <>{header}</>}
      />

      <SelectableGallery
        nodes={nodes}
        multiSelectProps={{ isSelected, handleModifierClick, toggleSelectAt }}
        renderItem={({ item }) => <SelectionTile item={item} />}
        orderedMediaIds={orderedMediaIds}
        gridMinColumnWidthPx={180}
        gridMinColumnWidthPxMobile={112}
        gridGapSpacingStep={1}
        gridGapSpacingStepMobile={2}
      />
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
