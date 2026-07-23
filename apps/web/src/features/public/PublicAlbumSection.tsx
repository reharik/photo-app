import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PagingState } from '../../hooks/getPaginatedQueryRenderState';
import { EmptyState } from '../../ui/EmptyState';
import { HeroIllustration } from '../../ui/HeroIllustration';
import { PublicAlbumItemSummaryVM, PublicAlbumSummaryVM } from '../../viewModels/';
import { AlbumSectionMetadata } from '../albums/AlbumSectionMetadata';
import { ALBUM_GRID_COLUMNS } from '../media/grid/gridColumns';
import { MediaGrid } from '../media/grid/MediaGrid';
import { MediaGridTile } from '../media/grid/MediaGridTile';
import type { MultiSelectProps } from '../media/grid/types';

const META_COMPACT_AFTER_SCROLL_PX = 32;

const noopMultiSelect: MultiSelectProps = {
  isSelected: () => false,
  handleModifierClick: () => undefined,
  toggleSelectAt: () => undefined,
  enterSelectionAt: () => undefined,
};

type PublicAlbumSectionProps = {
  album: PublicAlbumSummaryVM;
  albumItems: PublicAlbumItemSummaryVM[];
  paging: PagingState;
  totalCount: number;
};

export const PublicAlbumSection = ({
  album,
  albumItems,
  paging,
  totalCount,
}: PublicAlbumSectionProps) => {
  const { token } = useParams<{ token: string }>();
  const albumScrollRef = useRef<HTMLDivElement>(null);
  const [metaCompact, setMetaCompact] = useState(false);

  const buildTileHref = useMemo(
    () => (itemId: string) => `/shared/${token}/media/${itemId}`,
    [token],
  );

  const onAlbumScroll = useCallback((): void => {
    const el = albumScrollRef.current;
    if (el == null) {
      return;
    }
    setMetaCompact(el.scrollTop > META_COMPACT_AFTER_SCROLL_PX);
  }, []);

  // owner is left-joined, so first/last can both be absent — omit the attribution
  // line entirely rather than render "Shared with you by".
  const ownerName = [album.owner?.firstName, album.owner?.lastName]
    .filter((part) => part != null && part.trim() !== '')
    .join(' ');

  return (
    <Container>
      {!metaCompact ? (
        <PublicHeader>
          <Wordmark>Homeroll</Wordmark>
          <Slogan>A private album — no account needed to view.</Slogan>
        </PublicHeader>
      ) : null}
      <AlbumSectionMetadata
        count={totalCount}
        album={album}
        metaCompact={metaCompact}
        albumItems={albumItems}
        isPublic={true}
        attribution={ownerName !== '' ? `Shared with you by ${ownerName}` : undefined}
        compactBrand={
          <CompactBrand>
            <CompactBrandInner>
              <CompactWordmark>Homeroll</CompactWordmark>
              <CompactSlogan>A private album — no account needed to view.</CompactSlogan>
            </CompactBrandInner>
          </CompactBrand>
        }
      />
      <AlbumBodyScroll
        ref={(el) => {
          albumScrollRef.current = el;
        }}
        onScroll={onAlbumScroll}
      >
        {albumItems.length === 0 ? (
          <EmptyState
            illustration={<HeroIllustration />}
            title="No album items yet"
            text="Start choosing media items to include to build your gallery"
          />
        ) : (
          <GridWrap>
            <MediaGrid
              nodes={albumItems}
              paging={paging}
              scrollRootRef={albumScrollRef}
              getMediaItem={(item) => item.mediaItem}
              multiSelectProps={noopMultiSelect}
              selectableActions={[]}
              selectable={false}
              selectionActive={false}
              columnCounts={ALBUM_GRID_COLUMNS}
              renderItem={(item, ctx) => (
                <MediaGridTile
                  item={item.mediaItem}
                  mediaGalleryIds={ctx.mediaGalleryIds}
                  canReact={false}
                  buildTileHref={buildTileHref}
                />
              )}
            />
          </GridWrap>
        )}
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

// Transparent — sits on the body background so only the metadata block below keeps
// the raised treatment, avoiding two stacked grey bands at the top. Wordmark and
// slogan share one baseline-aligned row; the slogan wraps under the wordmark on
// narrow screens.
// Centered wordmark + slogan. The header→cover gap is tightened by reducing the
// metadata block's own top padding (its $public branch), not by pulling it up with
// a negative margin — the metadata is opaque (background: body), so overlapping it
// would paint over the header.
const PublicHeader = styled.header`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  text-align: center;
  column-gap: ${({ theme }) => theme.spacing(2)};
  row-gap: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(6)} 0;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(2.5)} ${({ theme }) => theme.spacing(3)} 0;
  }
`;

// Mirrors the app-shell wordmark treatment (serif / regular / -0.02em), scaled up
// to be the largest text on the screen since it's the only branding here.
// Non-interactive: a public recipient has no app home to link to.
const Wordmark = styled.span`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._32};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;

  @media (max-width: 375px) {
    font-size: ${({ theme }) => theme.fontSize._24};
  }
`;

// Clay (textAccent) — a warm color anchor against the cream body so the header
// doesn't read sterile. clay-on-body is a legible foreground tint at this size.
const Slogan = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.textAccent};
  line-height: 1.4;
`;

// Persisted branding for the collapsed metadata bar — same wordmark + clay slogan
// as the full header, one step smaller. Absolutely centered over the whole bar
// (anchored to AlbumMeta's positioning context) so it stays centered regardless of
// the cover/item-count cluster on the left. pointer-events: none so it never
// intercepts clicks over that left cluster.
const CompactBrand = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  @media (max-width: 768px) {
    display: none;
  }
`;

const CompactBrandInner = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  column-gap: ${({ theme }) => theme.spacing(1.5)};
  min-width: 0;
`;

const CompactWordmark = styled.span`
  font-family: ${({ theme }) => theme.font.serif};
  font-size: ${({ theme }) => theme.fontSize._21};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.bodyText};
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const CompactSlogan = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.font.body};
  font-size: ${({ theme }) => theme.fontSize._16};
  font-weight: ${({ theme }) => theme.weight.regular};
  color: ${({ theme }) => theme.color.textAccent};
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AlbumBodyScroll = styled.div`
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(6)}
    ${({ theme }) => theme.spacing(6)};
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)}
      ${({ theme }) => theme.spacing(3)};
  }
`;

const GridWrap = styled.div`
  width: 100%;
`;
