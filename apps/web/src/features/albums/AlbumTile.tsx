import { MediaAssetKind } from '@packages/contracts';
import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
import { Print } from '../../ui/Print';
import { UnseenDot } from '../../ui/UnseenDot';
import type { AlbumSummaryVM } from '../../viewModels/';
import { buildAlbumBrowseSubtitle } from './albumBrowseSubtitle';

type AlbumTileProps = {
  album: AlbumSummaryVM;
  /** Derived from the viewer-level unseen-activity array (containerType=album). */
  hasUnseen?: boolean;
};

export const AlbumTile = ({ album, hasUnseen = false }: AlbumTileProps) => {
  const [thumbLoadFailed, setThumbLoadFailed] = useState(false);
  const coverMediaId = album.coverMedia?.id;
  const thumbnailUrl =
    coverMediaId != null ? buildMediaItemUrl(coverMediaId, MediaAssetKind.thumbnail) : undefined;
  const showCoverImage = coverMediaId != null && !thumbLoadFailed;

  useEffect(() => {
    setThumbLoadFailed(false);
  }, [coverMediaId, thumbnailUrl]);

  return (
    <TileRoot>
      <ThumbLink to={`/albums/${album.id}`}>
        <CoverFrame>
          <Print>
            <Cover>
              {showCoverImage ? (
                <CoverImage
                  src={thumbnailUrl}
                  data-testid={coverMediaId}
                  alt=""
                  onError={() => setThumbLoadFailed(true)}
                />
              ) : (
                <CoverPlaceholder aria-hidden>
                  <Camera size={28} strokeWidth={1.75} aria-hidden />
                </CoverPlaceholder>
              )}
              {hasUnseen ? <UnseenDot /> : null}
            </Cover>
          </Print>
        </CoverFrame>
        <Caption>
          <Title>{album.title}</Title>
          <Meta>{buildAlbumBrowseSubtitle(album.itemCount, album.updatedAt)}</Meta>
        </Caption>
      </ThumbLink>
    </TileRoot>
  );
};

const TileRoot = styled.div`
  min-width: 0;
  width: 100%;
`;

const ThumbLink = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  min-width: 0;
  text-decoration: none;
  color: inherit;
`;

// Insets the print from the tile edge so its stacked sheets, warm shadow, and
// hover lift have room to render. This is a compromise: the grid wraps every
// tile in MediaGridSelectableItem's ThumbFrame (overflow: hidden), which clips
// anything bleeding past the tile edge — so the print is inset here rather than
// allowed to fan into the grid gutter. See report for the alternative.
const CoverFrame = styled.div`
  padding: ${({ theme }) => theme.spacing(1.5)};
`;

const Cover = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CoverImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* Print (white) so an empty cover reads as a blank print, not cream-in-white. */
  background: ${({ theme }) => theme.color.print};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const Caption = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.25)};
  min-width: 0;
  /* Match CoverFrame's padding so title/meta align with the mat's outer edge. */
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._14};
  font-weight: ${({ theme }) => theme.weight.medium};
  color: ${({ theme }) => theme.color.bodyText};
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Meta = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSize._13};
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
