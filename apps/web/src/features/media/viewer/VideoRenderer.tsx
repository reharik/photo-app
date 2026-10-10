import { Hotkey, MuteButton } from '@videojs/react';
import { usePlayer, Video, VideoPlayer } from '@videojs/react/video';
import { Film, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { isTypingTarget } from '../../../hooks/useMediaViewerKeyboard';
import { Button } from '../../../ui/Button';
import { printLightboxMatte } from '../../../ui/Print';
import { VideoSkin } from '../../../vendor/videojs/components/videojs/video/skin';
import { MediaNotice } from './MediaNotice';

export type VideoRendererProps = {
  id: string;
  /** DISPLAY asset (browser-playable H.264 mp4). */
  src: string;
  /** THUMBNAIL asset, shown until playback starts. */
  poster: string;
  /** Display dimensions; reserve the aspect ratio before metadata arrives. */
  width?: number | null;
  height?: number | null;
};

const FALLBACK_ASPECT = 16 / 9;

const aspectOf = (width?: number | null, height?: number | null): number | null =>
  width != null && height != null && width > 0 && height > 0 ? width / height : null;

const UNMUTE_LABEL_MS = 3000;

/**
 * Shown only while muted: autoplay has to start silent, so make the way out obvious. The label
 * is spelled out for the first few seconds, then collapses to the icon so it stops covering the
 * video. VideoRenderer is keyed per item, so each new video starts with the label again.
 */
const UnmuteControl = () => {
  const muted = usePlayer((state) => state.muted);
  const [labelled, setLabelled] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLabelled(false), UNMUTE_LABEL_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!muted) {
    return null;
  }
  return (
    <MuteButton
      render={(props) => (
        <UnmutePill {...props} $labelled={labelled}>
          <VolumeX size={16} strokeWidth={2} aria-hidden />
          <UnmuteLabel $labelled={labelled}>Tap to unmute</UnmuteLabel>
        </UnmutePill>
      )}
    />
  );
};

/**
 * Document-level shortcuts, so they work wherever focus is in the viewer (the skin's own only
 * apply while focus is inside the player). Switched off while a text field has focus, the same
 * rule useMediaViewerKeyboard applies: the library already leaves a plain Space to the field,
 * but a modified key such as Shift+arrow would otherwise seek instead of extending a selection.
 */
const ViewerHotkeys = () => {
  const [typing, setTyping] = useState(() => isTypingTarget(document.activeElement));

  useEffect(() => {
    const onFocusIn = (e: FocusEvent): void => setTyping(isTypingTarget(e.target));
    const onFocusOut = (e: FocusEvent): void => setTyping(isTypingTarget(e.relatedTarget));
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return (
    <>
      <Hotkey keys="Space" action="togglePaused" target="document" disabled={typing} />
      <Hotkey
        keys="Shift+ArrowRight"
        action="seekStep"
        value={5}
        target="document"
        disabled={typing}
      />
      <Hotkey
        keys="Shift+ArrowLeft"
        action="seekStep"
        value={-5}
        target="document"
        disabled={typing}
      />
    </>
  );
};

/**
 * Video.js player (vendored default skin, see src/vendor/videojs/README.md) for a READY video.
 *
 * - Autoplays when it becomes the current item. `muted` because browsers block unmuted
 *   autoplay outside a user gesture; `playsInline` because iOS Safari otherwise forces
 *   fullscreen on play.
 * - MediaRenderer keys this by item, so navigating away unmounts it — that is the pause.
 * - Plain arrows are left to viewer navigation; see ViewerHotkeys for Space and Shift+arrow.
 *
 * `src` is /api/media/…, which redirects to a presigned S3 URL; the browser's Range
 * requests (seeking) go straight to S3. That URL expires (15 min by default), so a
 * video left paused past it errors on its next Range request. "Try again" remounts
 * the player — a fresh redirect, a fresh URL — and resumes where it stopped.
 */
export const VideoRenderer = ({ id, src, poster, width, height }: VideoRendererProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAtRef = useRef(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [measuredAspect, setMeasuredAspect] = useState<number | null>(null);

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

  const aspect = aspectOf(width, height) ?? measuredAspect ?? FALLBACK_ASPECT;

  return (
    <VideoFrame key={attempt} $aspect={aspect}>
      <VideoPlayer poster={poster}>
        <VideoSkin>
          <Video
            ref={videoRef}
            data-testid={id}
            src={src}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={() => {
              const video = videoRef.current;
              if (video == null) {
                return;
              }
              setMeasuredAspect(aspectOf(video.videoWidth, video.videoHeight));
              if (resumeAtRef.current > 0) {
                video.currentTime = resumeAtRef.current;
              }
            }}
            onError={() => {
              resumeAtRef.current = videoRef.current?.currentTime ?? 0;
              setFailed(true);
            }}
          />
          <UnmuteControl />
          <ViewerHotkeys />
        </VideoSkin>
      </VideoPlayer>
    </VideoFrame>
  );
};

// Same stage sizing and print matte as ImageRenderer's <img>. The skin's container uses
// size containment (it can't size from the <video> inside it), so the frame carries the
// width — as wide as fits while the height stays under the stage cap — and the skin fills
// it at the media's aspect.
const VideoFrame = styled.div<{ $aspect: number }>`
  --viewer-video-max-height: min(calc(100dvh - 96px), 85dvh);
  /* Read by the vendored skin's time slider (sliders.css). */
  --homeroll-video-progress: ${({ theme }) => theme.color.videoProgress};
  box-sizing: border-box;
  width: min(100%, calc(var(--viewer-video-max-height) * ${({ $aspect }) => $aspect}));
  ${printLightboxMatte}

  @media (max-width: 968px) {
    --viewer-video-max-height: min(82dvh, calc(100dvh - 72px));
  }

  .video-skin {
    aspect-ratio: ${({ $aspect }) => $aspect};
    height: auto;
  }

  /* The skin's stylesheets are in cascade layers; the app's global reset (globalStyle.ts) is
     not, so it outranks them whatever the specificity — zeroing the skin's padding and
     recolouring its buttons. Hand the properties the reset sets back to the skin's layers. */
  .video-skin,
  .video-skin * {
    margin: revert-layer;
    padding: revert-layer;
    border: revert-layer;
    font: revert-layer;
    vertical-align: revert-layer;
    color: revert-layer;
    cursor: revert-layer;
  }
`;

/* White on image overlay — not theme page chrome (as the stage buttons in MediaViewerStyles).
   The &&& raises these above VideoFrame's revert-layer rule, which would otherwise strip them. */
const UnmutePill = styled.button<{ $labelled: boolean }>`
  &&& {
    /* Collapsed, the padding squares up around the icon: a 40px round target. The left
       padding never changes, so the icon stays put while the label folds away. */
    padding: ${({ $labelled }) => ($labelled ? '11px 14px 11px 11px' : '11px')};
    font: inherit;
    font-size: 14px;
    line-height: 1;
    color: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.28);
    cursor: pointer;
  }
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
  transition: padding 0.3s ease;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color.textAccent};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const UnmuteLabel = styled.span<{ $labelled: boolean }>`
  &&& {
    margin-left: ${({ $labelled }) => ($labelled ? '6px' : '0')};
  }
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: ${({ $labelled }) => ($labelled ? '8em' : '0')};
  opacity: ${({ $labelled }) => ($labelled ? 1 : 0)};
  transition:
    max-width 0.3s ease,
    margin-left 0.3s ease,
    opacity 0.2s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
