import { useApolloClient } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  AddMediaItemsToAlbumDocument,
  type AddMediaItemsToAlbumMutation,
  ViewerAlbumsDocument,
} from '../../graphql/generated/types';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { MediaItemSummaryVM } from '../../viewModels/media/MediaItemSummaryVM';
import { useAppMutationState } from './dataAccess/useAppMutation';
import { SelectionTile } from './gallery/mediaTiles/SelectionTile';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';
import { MediaSelectionToolbar } from './gallery/selectionActions/MediaSelectionToolbar';

type MediaSelectorSectionProps = {
  nodes: MediaItemSummaryVM[];
  reloadData: () => void;
};

export const MediaSelectorSection = ({ nodes, reloadData }: MediaSelectorSectionProps) => {
  const client = useApolloClient();
  const orderedMediaIds = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const {
    selectedIds,
    selectionCount,
    isSelected,
    handleModifierClick,
    toggleSelectAt,
    clearSelection,
  } = useMultiSelectIds(orderedMediaIds);
  const [addToAlbumOpen, setAddToAlbumOpen] = useState(false);
  const { isLoading, errors, execute } = useAppMutationState();

  const mediaItemIdsForModal = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const submitAddToAlbum = async (input: { albumId?: string; newAlbum?: { title: string } }) => {
    const result = await execute(
      {
        mutation: AddMediaItemsToAlbumDocument,
        variables: {
          input: {
            mediaItemIds: mediaItemIdsForModal,
            ...input,
          },
        },
      },
      (data: AddMediaItemsToAlbumMutation) => data.AddMediaItemsToAlbum,
    );

    if (result.success) {
      clearSelection();
      void reloadData();
      await client.refetchQueries({ include: [ViewerAlbumsDocument] });
    }
  };

  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        SelectionActions={<MediaSelectionToolbar onAddToAlbum={() => setAddToAlbumOpen(true)} />}
        Header={() => <></>}
      />

      <SelectableGallery
        nodes={nodes}
        multiSelectProps={{ isSelected, handleModifierClick, toggleSelectAt }}
        renderItem={({ item, orderedMediaIds }) => (
          <SelectionTile item={item} mediaGalleryIds={orderedMediaIds} />
        )}
        orderedMediaIds={orderedMediaIds}
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
