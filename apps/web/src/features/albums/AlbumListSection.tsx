import { useState } from 'react';
import styled from 'styled-components';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { EmptyState } from '../../ui/EmptyState';
import { AlbumSummaryVM } from '../../viewModels/album/AlbumSummaryVM';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { SelectableGalleryHeader } from '../gallery/SelectableGalleryHeader';
import { AlbumTile } from '../gallery/tiles/AlbumTile';
import { CreateAlbumModal } from './CreateAlbumModal';

type AlbumListSectionProps = {
  nodes: AlbumSummaryVM[];
  isCreatingAlbum: boolean;
  submitCreateAlbum: (title: string) => Promise<void>;
};

export const AlbumListSection = ({
  nodes,
  isCreatingAlbum,
  submitCreateAlbum,
}: AlbumListSectionProps) => {
  const { multiSelectProps, clearSelection, selectionCount } = useMultiSelectGallery({
    nodes,
    actions: [],
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const closeCreate = () => {
    setCreateModalOpen(false);
  };
  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={selectionCount}
        clearSelection={clearSelection}
        availableActions={[]}
        Header={() => (
          <Header>
            <Title>Albums</Title>
            <HeaderActions>
              <PrimaryButton type="button" onClick={() => setCreateModalOpen(true)}>
                <PrimaryButtonLabelWide>Add album</PrimaryButtonLabelWide>
                <PrimaryButtonLabelNarrow>Add</PrimaryButtonLabelNarrow>
              </PrimaryButton>
            </HeaderActions>
          </Header>
        )}
      />
      <SelectableGallery
        selectable={false}
        nodes={nodes}
        multiSelectProps={multiSelectProps}
        emptyState={
          <EmptyState
            title="No albums yet"
            text="Create an album to organize your media."
            action={
              <EmptyButton type="button" onClick={() => setCreateModalOpen(true)}>
                Add album
              </EmptyButton>
            }
          />
        }
        renderItem={({ item }) => <AlbumTile item={item} />}
      />
      {createModalOpen ? (
        <CreateAlbumModal
          isCreating={isCreatingAlbum}
          closeCreate={closeCreate}
          submitCreate={submitCreateAlbum}
        />
      ) : null}
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

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(2)};
  flex-shrink: 0;
`;
/** Padding and border live on SelectableGalleryHeader; keep this row layout-only. */
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(3)};
  min-width: 0;
  width: 100%;
`;

const PrimaryButtonLabelWide = styled.span`
  @media (max-width: 768px) {
    display: none;
  }
`;

const PrimaryButtonLabelNarrow = styled.span`
  display: none;

  @media (max-width: 768px) {
    display: inline;
  }
`;

const PrimaryButton = styled.button`
  padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
    font-size: 13px;
    font-weight: 600;
  }
`;

const EmptyButton = styled.button`
  margin-top: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(4)};
  background: ${({ theme }) => theme.color.primaryButtonBg};
  color: ${({ theme }) => theme.color.body};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.color.primaryButtonHover};
  }
`;
