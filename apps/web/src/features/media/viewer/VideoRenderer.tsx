import { Film } from 'lucide-react';
import { useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../../../ui/Button';
import { printLightboxMatte } from '../../../ui/Print';
import { MediaNotice } from './MediaNotice';

export type VideoRendererProps = {
  id: string;
  /** DISPLAY asset (browser-playable H.264 mp4). */
  src: string;
  /** THUMBNAIL asset, shown until playback starts. */
  poster: string;
  /** Display dimensions; reserve the aspect ratio before metadata/poster arrive. */
  width?: number | null;
  height?: number | null;
};

/**
 * Native player for a READY video.
 *
 * - `playsInline`: without it iOS Safari forces fullscreen on play.
 * - `preload="metadata"`: opening the viewer fetches duration/dimensions, not the file.
 *
 * `src` is /api/media/…, which redirects to a presigned S3 URL; the browser's Range
 * requests (seeking) go straight to S3. That URL expires (15 min by default), so a
 * video left paused past it errors on its next Range request. "Try again" remounts
 * the element — a fresh redirect, a fresh URL — and resumes where it stopped.
 */
export const VideoRenderer = ({ id, src, poster, width, height }: VideoRendererProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAtRef = useRef(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <MediaNotice
        icon={Film}
        title="This video couldn’t be loaded"
        hint="Check your connection, then try again."
        action={
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <StyledVideo
      key={attempt}
      ref={videoRef}
      data-testid={id}
      src={src}
      poster={poster}
      width={width ?? undefined}
      height={height ?? undefined}
      controls
      playsInline
      preload="metadata"
      onLoadedMetadata={() => {
        const video = videoRef.current;
        if (video != null && resumeAtRef.current > 0) {
          video.currentTime = resumeAtRef.current;
        }
      }}
      onError={() => {
        resumeAtRef.current = videoRef.current?.currentTime ?? 0;
        setFailed(true);
      }}
    />
  );
};

// Same stage sizing as ImageRenderer's <img> (the box tracks the media's aspect, so
// the print matte hugs it), minus `pointer-events: none` — the native controls need
// pointer input.
const StyledVideo = styled.video`
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  ${printLightboxMatte}

  @media (min-width: 969px) {
    max-height: min(calc(100dvh - 96px), 85dvh);
  }

  @media (max-width: 968px) {
    max-height: min(82dvh, calc(100dvh - 72px));
  }
`;
