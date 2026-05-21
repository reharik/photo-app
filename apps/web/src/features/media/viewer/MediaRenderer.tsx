import { MediaKind } from '@packages/contracts';
import styled from 'styled-components';
import { ImageRenderer } from './ImageRenderer';

export type MediaRendererProps = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  displayUrl: string;
  imageAlt: string;
};

const isPhotoLike = (kind: MediaKind, mimeType: string): boolean => {
  if (kind === MediaKind.photo) {
    return true;
  }
  return mimeType.startsWith('image/');
};

const isVideoLike = (kind: MediaKind, mimeType: string): boolean => {
  if (kind === MediaKind.video) {
    return true;
  }
  return mimeType.startsWith('video/');
};

export const MediaRenderer = ({ id, kind, mimeType, displayUrl, imageAlt }: MediaRendererProps) => {
  if (isPhotoLike(kind, mimeType)) {
    return <ImageRenderer id={id} src={displayUrl} alt={imageAlt} />;
  }

  if (isVideoLike(kind, mimeType)) {
    return (
      <UnsupportedBlock>
        <UnsupportedIcon aria-hidden>🎬</UnsupportedIcon>
        <UnsupportedTitle>Video playback isn’t available yet</UnsupportedTitle>
        <UnsupportedHint>
          This item opens here for details; a player will be added later.
        </UnsupportedHint>
      </UnsupportedBlock>
    );
  }

  return (
    <UnsupportedBlock>
      <UnsupportedIcon aria-hidden>📄</UnsupportedIcon>
      <UnsupportedTitle>Preview not available</UnsupportedTitle>
      <UnsupportedHint>This media type can’t be shown in the viewer yet.</UnsupportedHint>
    </UnsupportedBlock>
  );
};

const UnsupportedBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  text-align: center;
  max-width: 320px;
`;

const UnsupportedIcon = styled.div`
  font-size: 48px;
  opacity: 0.35;
`;

const UnsupportedTitle = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.bodyText};
`;

const UnsupportedHint = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.color.bodyTextSecondary};
`;
