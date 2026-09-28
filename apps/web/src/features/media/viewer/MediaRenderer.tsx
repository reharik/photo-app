import { MediaItemStatus, MediaKind } from '@packages/contracts';
import { FileText, Film, Image } from 'lucide-react';
import { ImageRenderer } from './ImageRenderer';
import { getMediaItemReadiness } from './mediaItemReadiness';
import { MediaNotice } from './MediaNotice';
import { VideoRenderer } from './VideoRenderer';

export type MediaRendererProps = {
  id: string;
  kind: MediaKind;
  status: MediaItemStatus;
  mimeType: string;
  displayUrl: string;
  /** THUMBNAIL asset URL; the poster frame for video. */
  posterUrl: string;
  width?: number | null;
  height?: number | null;
  imageAlt: string;
};

const isPhotoLike = (kind: MediaKind, mimeType: string): boolean => {
  if (kind.equals(MediaKind.photo)) {
    return true;
  }
  return mimeType.startsWith('image/');
};

const isVideoLike = (kind: MediaKind, mimeType: string): boolean => {
  if (kind.equals(MediaKind.video)) {
    return true;
  }
  return mimeType.startsWith('video/');
};

export const MediaRenderer = ({
  id,
  kind,
  status,
  mimeType,
  displayUrl,
  posterUrl,
  width,
  height,
  imageAlt,
}: MediaRendererProps) => {
  const isPhoto = isPhotoLike(kind, mimeType);
  const isVideo = !isPhoto && isVideoLike(kind, mimeType);
  const noun = isVideo ? 'video' : isPhoto ? 'photo' : 'item';
  const KindIcon = isVideo ? Film : isPhoto ? Image : FileText;

  // Gate before touching any asset URL: the derivatives don't exist until READY.
  switch (getMediaItemReadiness(status)) {
    case 'processing':
      return (
        <MediaNotice
          icon={KindIcon}
          title={`This ${noun} is still processing`}
          hint="It will appear here as soon as it’s ready."
        />
      );
    case 'failed':
      return (
        <MediaNotice
          icon={KindIcon}
          title={`This ${noun} couldn’t be processed`}
          hint="Try uploading it again."
        />
      );
    case 'unavailable':
      return <MediaNotice icon={KindIcon} title={`This ${noun} is no longer available`} />;
    case 'ready':
      break;
  }

  if (isPhoto) {
    return <ImageRenderer id={id} src={displayUrl} alt={imageAlt} />;
  }

  if (isVideo) {
    // Keyed by item so error/retry state never carries over between gallery items
    // (the public screen doesn't key MediaViewer).
    return (
      <VideoRenderer
        key={id}
        id={id}
        src={displayUrl}
        poster={posterUrl}
        width={width}
        height={height}
      />
    );
  }

  return (
    <MediaNotice
      icon={FileText}
      title="Preview not available"
      hint="This media type can’t be shown in the viewer yet."
    />
  );
};
