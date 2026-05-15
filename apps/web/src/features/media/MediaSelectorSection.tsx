import { ViewerOperation } from '@packages/contracts';
import styled from 'styled-components';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { MediaItemSummaryVM } from '../../viewModels/';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { SelectableGalleryHeader } from '../gallery/SelectableGalleryHeader';
import { SelectionTile } from '../gallery/tiles/SelectionTile';

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
}: MediaSelectorSectionProps) => {
  const selectableActions = [
    {
      operation: ViewerOperation.addItems,
      label: 'Add to album',
      onAction: () => onAddToAlbum(Array.from(selectedIds)),
    },
  ];
  const { multiSelectProps, selectedIds, availableActions, clearSelection, selectionCount } =
    useMultiSelectGallery({
      nodes,
      actions: selectableActions,
    });
  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        vPaddingUnits={2}
        hPaddingUnits={3}
        availableActions={availableActions}
        Header={() => <>{header}</>}
      />

      <SelectableGallery
        nodes={nodes}
        multiSelectProps={multiSelectProps}
        renderItem={({ item }) => <SelectionTile item={item} />}
        gridMinColumnWidthPx={180}
        gridMinColumnWidthPxMobile={112}
        gridGapSpacingStep={1}
        gridGapSpacingStepMobile={2}
        selectableActions={selectableActions.map((x) => x.operation)}
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
