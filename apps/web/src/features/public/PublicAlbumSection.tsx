import { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useMultiSelectGallery } from '../../hooks/useMultiSelectGallery';
import { EmptyState } from '../../ui/EmptyState';
import { PublicAlbumItemSummaryVM, PublicAlbumSummaryVM } from '../../viewModels/';
import { AlbumSectionMetadata } from '../albums/AlbumSectionMetadata';
import { SelectableGallery } from '../gallery/SelectableGallery';
import { PublicAlbumMediaTile } from '../gallery/tiles/PublicAlbumMediaTile';

const META_COMPACT_AFTER_SCROLL_PX = 32;

type PublicAlbumSectionProps = {
  album: PublicAlbumSummaryVM;
  albumItems: PublicAlbumItemSummaryVM[];
  retrieveAlbumItems: () => void;
};

export const PublicAlbumSection = ({ album, albumItems }: PublicAlbumSectionProps) => {
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);

  const { multiSelectProps } = useMultiSelectGallery({
    nodes: albumItems,
    actions: [],
  });

  const onAlbumScroll = useCallback((): void => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, []);

  return (
    <Container>
      <AlbumSectionMetadata
        count={albumItems.length}
        album={album}
        metaCompact={metaCompact}
        albumItems={albumItems}
        isPublic={true}
      />
      <AlbumBodyScroll ref={albumScrollRef} onScroll={onAlbumScroll}>
        <SelectableGallery
          nodes={albumItems}
          mediaIdSelector={(x) => x.mediaItem.id}
          multiSelectProps={multiSelectProps}
          embedInParentScroll
          emptyState={
            <EmptyState
              title="No album items yet"
              text="Start choosing media items to include to build your gallery"
            />
          }
          renderItem={({ item, orderedMediaIds }) => (
            <PublicAlbumMediaTile item={item} mediaGalleryIds={orderedMediaIds} />
          )}
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

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(6)}
    ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)}
      ${({ theme }) => theme.spacing(3)};
  }
`;
