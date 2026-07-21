import { MediaAssetKind } from '@packages/contracts';
import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { buildMediaItemUrl } from '../../domain/formatters/mediaItemUrlBuilder';
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

const Cover = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  flex-shrink: 0;
  background: ${({ theme }) => theme.color.bodyRaised};
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
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
  background: ${({ theme }) => theme.color.bodyElevated};
  color: ${({ theme }) => theme.color.bodyTextMuted};
`;

const Caption = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.25)};
  min-width: 0;
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
  font-family: ${({ theme }) => theme.font.mono};
  font-size: ${({ theme }) => theme.fontSize._13};
  line-height: 1.4;
  color: ${({ theme }) => theme.color.bodyTextMuted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
