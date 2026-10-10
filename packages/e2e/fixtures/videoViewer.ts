import { expect, type Locator, type Page } from '@playwright/test';
import { getDb } from './db';
import { createTestImageFile, getMediaTileIds, uploadMediaViaUi } from './upload';

/**
 * Helpers for specs that drive the media viewer's video player.
 *
 * The video goes through the same path as every other e2e upload: the Upload Media
 * control, a presigned PUT to the API's configured bucket, the media-worker's ffmpeg
 * derivatives, then playback from `/api/media/:id/display`, which redirects to a
 * presigned S3 URL. Nothing here is served from disk or stubbed.
 */

/** Committed 30s 320×180 H.264 clip with an audio track (not an image, so `grabTestImages` never picks it). */
const VIDEO_ASSET = 'viewer-clip.mp4';
/** Length of {@link VIDEO_ASSET}; seek/scrub assertions need room either side. */
export const VIDEO_CLIP_SECONDS = 30;

/**
 * Photo assets that bracket the video in the library. The library sorts by capture
 * time, newest first: these carry 2025 and 2020 dates (EXIF, and the same date in the
 * file name), and the clip is uploaded under a 2023-dated name, which the worker's
 * file-name fallback turns into its capture time. So the video always lands in the
 * middle, with a neighbour to navigate to on each side.
 */
const NEWER_PHOTO_ASSET = 'PXL_20250519_190044933~2.jpg';
const OLDER_PHOTO_ASSET = 'PXL_20201214_004148691.PORTRAIT.jpg';

export type VideoGallery = {
  videoId: string;
  /** The item before the video in the library (newer); "previous" in the viewer. */
  previousId: string;
  /** The item after the video in the library (older); "next" in the viewer. */
  nextId: string;
};

/**
 * Video uploads are off by default (`user.video_enabled`); the API rejects a video
 * from a user without it. Arrange-only, like the user factory's own insert.
 */
export const enableVideoUploads = async (userId: string): Promise<void> => {
  await getDb()('user').where({ id: userId }).update({ videoEnabled: true });
};

/**
 * Uploads photo, video, photo through the UI and returns the video with its two
 * library neighbours. Expects the library screen to be open.
 */
export const uploadVideoBetweenPhotos = async (
  page: Page,
  uniqueSuffix: string,
): Promise<VideoGallery> => {
  const files = [
    { fileName: `PXL_20250519_190044933-${uniqueSuffix}.jpg`, asset: NEWER_PHOTO_ASSET },
    { fileName: `clip_20230615_120000-${uniqueSuffix}.mp4`, asset: VIDEO_ASSET },
    { fileName: `PXL_20201214_004148691-${uniqueSuffix}.jpg`, asset: OLDER_PHOTO_ASSET },
  ].map(({ fileName, asset }) => ({
    fileName,
    path: createTestImageFile(fileName, { sourceAssetName: asset }),
  }));

  await uploadMediaViaUi(page, files);

  // Read the order the library actually shows rather than trusting upload order.
  const ids = await getMediaTileIds(page);
  expect(ids, 'Expected exactly the three uploaded items in the library.').toHaveLength(3);
  const [previousId, videoId, nextId] = ids;
  return { videoId, previousId, nextId };
};

export const viewerVideo = (page: Page): Locator =>
  page.getByLabel('Media viewer').locator('video');

/** The player's own "Unmute" control. While muted it is the viewer's pill; the control-bar button is hidden. */
export const unmuteControl = (page: Page): Locator =>
  page.getByLabel('Media viewer').getByRole('button', { name: 'Unmute' });

export type VideoState = {
  paused: boolean;
  muted: boolean;
  currentTime: number;
  playsInline: boolean;
  controlsVisible: boolean;
};

export const videoState = async (page: Page): Promise<VideoState> =>
  page.evaluate(() => {
    const video = document.querySelector('video');
    if (video == null) {
      throw new Error('No <video> element on the page.');
    }
    return {
      paused: video.paused,
      muted: video.muted,
      currentTime: video.currentTime,
      playsInline: video.playsInline,
      controlsVisible:
        document.querySelector('[data-video-controls]')?.hasAttribute('data-visible') ?? false,
    };
  });

/** Resolves once the current video is actually advancing (not merely "not paused"). */
export const waitForPlaying = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => {
    const video = document.querySelector('video');
    return video != null && !video.paused && video.readyState >= 2 && video.currentTime > 0.2;
  });
};

export const waitForPaused = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => document.querySelector('video')?.paused === true);
};

export const waitForControls = async (page: Page, visible: boolean): Promise<void> => {
  await page.waitForFunction(
    (want) =>
      (document.querySelector('[data-video-controls]')?.hasAttribute('data-visible') ?? false) ===
      want,
    visible,
  );
};

/** Opens the video from the library grid and waits until it is playing. */
export const openVideoFromLibrary = async (page: Page, videoId: string): Promise<void> => {
  await page.getByTestId(`media-tile-${videoId}`).getByRole('link').first().click();
  await expect(page).toHaveURL(new RegExp(`/media/${videoId}(\\?.*)?$`));
  await expect(viewerVideo(page)).toBeVisible();
  await waitForPlaying(page);
};

export const expectViewerAt = async (page: Page, mediaItemId: string): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`/media/${mediaItemId}(\\?.*)?$`));
};

type VideoProbe = {
  video: HTMLVideoElement;
  seeks: number;
  plays: number;
  pauses: number;
};

/**
 * Starts counting the current video's `seeking` / `play` / `pause` events and keeps a
 * handle on the element, so a spec can prove "nothing seeked" or "toggled exactly once",
 * and can still read the element after the viewer has unmounted it.
 */
export const startVideoProbe = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const video = document.querySelector('video');
    if (video == null) {
      throw new Error('No <video> element to probe.');
    }
    const probe: VideoProbe = { video, seeks: 0, plays: 0, pauses: 0 };
    video.addEventListener('seeking', () => {
      probe.seeks += 1;
    });
    video.addEventListener('play', () => {
      probe.plays += 1;
    });
    video.addEventListener('pause', () => {
      probe.pauses += 1;
    });
    (window as unknown as { __videoProbe: VideoProbe }).__videoProbe = probe;
  });
};

export type VideoProbeReading = {
  seeks: number;
  plays: number;
  pauses: number;
  /** False once the viewer has unmounted the probed element. */
  connected: boolean;
  paused: boolean;
};

export const readVideoProbe = async (page: Page): Promise<VideoProbeReading> =>
  page.evaluate(() => {
    const probe = (window as unknown as { __videoProbe: VideoProbe }).__videoProbe;
    return {
      seeks: probe.seeks,
      plays: probe.plays,
      pauses: probe.pauses,
      connected: probe.video.isConnected,
      paused: probe.video.paused,
    };
  });

export type TouchDriver = {
  tap: (x: number, y: number) => Promise<void>;
  /** Press at the first point, drag to the second, release. */
  drag: (from: { x: number; y: number }, to: { x: number; y: number }) => Promise<void>;
};

/**
 * Real touch input through CDP — what DevTools device emulation sends. Playwright's
 * `touchscreen` only taps, and the viewer's gestures need `pointerType: 'touch'` drags.
 * The page's context must be created with `hasTouch: true`. Chromium only.
 */
export const createTouchDriver = async (page: Page): Promise<TouchDriver> => {
  const cdp = await page.context().newCDPSession(page);
  const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: x == null || y == null ? [] : [{ x, y }],
    });

  return {
    tap: async (x, y) => {
      await send('touchStart', x, y);
      await send('touchEnd');
    },
    drag: async (from, to) => {
      const steps = 8;
      await send('touchStart', from.x, from.y);
      for (let i = 1; i <= steps; i += 1) {
        await send(
          'touchMove',
          from.x + ((to.x - from.x) * i) / steps,
          from.y + ((to.y - from.y) * i) / steps,
        );
      }
      await send('touchEnd');
    },
  };
};
