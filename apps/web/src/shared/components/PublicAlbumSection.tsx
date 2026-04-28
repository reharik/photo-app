import { useCallback, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMultiSelectIds } from '../../hooks/useMultiSelectIds';
import { PublicAlbumItemSummaryVM } from '../../viewModels/publicAlbum/PublicAlbumItemSummaryVM';
import { PublicAlbumSummaryVM } from '../../viewModels/publicAlbum/PublicAlbumSummaryVM';
import { AlbumSectionMetadata } from './AlbumSectionMetadata';
import { EmptyState } from './gallery/EmptyState';
import { AlbumMediaTile } from './gallery/mediaTiles/AlbumMediaTile';
import { SelectableGallery } from './gallery/SelectableGallery';
import { SelectableGalleryHeader } from './gallery/SelectableGalleryHeader';

const META_COMPACT_AFTER_SCROLL_PX = 32;

type PublicAlbumSectionProps = {
  album: PublicAlbumSummaryVM;
  albumItems: PublicAlbumItemSummaryVM[];
  retrieveAlbumItems: () => void;
};

export const PublicAlbumSection = ({ album, albumItems }: PublicAlbumSectionProps) => {
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);
  const orderedAlbumItemIds = useMemo(() => albumItems.map((n) => n.id), [albumItems]);
  const albumItemMultiSelectProps = useMultiSelectIds(orderedAlbumItemIds);

  const onAlbumScroll = useCallback((): void => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, []);

  const renderHeader = () => {
    return (
      <>
        <Title>{album?.title ?? 'Album'}</Title>
      </>
    );
  };
  return (
    <Container>
      <SelectableGalleryHeader
        selectionCount={albumItemMultiSelectProps.selectionCount}
        clearSelection={albumItemMultiSelectProps.clearSelection}
        SelectionActions={<>/* add download later */</>}
        Header={renderHeader}
      />
      <AlbumBodyScroll ref={albumScrollRef} onScroll={onAlbumScroll}>
        <AlbumSectionMetadata
          count={albumItems.length}
          album={album}
          metaCompact={metaCompact}
          albumItems={albumItems}
          isPublic={true}
        />
        <SelectableGallery
          nodes={albumItems}
          multiSelectProps={albumItemMultiSelectProps}
          orderedMediaIds={orderedAlbumItemIds}
          embedInParentScroll
          emptyState={
            <EmptyState
              title="No album items yet"
              text="Start choosing media items to include to build your gallery"
            />
          }
          renderItem={({ item }) => <AlbumMediaTile item={item} />}
        />
      </AlbumBodyScroll>
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
  font-size: 24px;
  font-weight: 500;
  margin: 0;
  flex: 1;
  min-width: 0;
  color: ${({ theme }) => theme.colors.text};
`;

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 0 ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(3)};
  }
`;
