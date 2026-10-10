import type { Page } from '@playwright/test';
import { loginViaApi } from '../../fixtures/auth';
import { expectMediaItemLoaded } from '../../fixtures/mediaSelection';
import { expect, test, type UserSession } from '../../fixtures/test';
import { loginAndOpenLibrary } from '../../fixtures/upload';
import {
  createTouchDriver,
  enableVideoUploads,
  expectViewerAt,
  openVideoFromLibrary,
  readVideoProbe,
  startVideoProbe,
  unmuteControl,
  uploadVideoBetweenPhotos,
  videoState,
  viewerVideo,
  waitForControls,
  waitForPaused,
  waitForPlaying,
  type VideoGallery,
} from '../../fixtures/videoViewer';

const MOBILE_VIEWPORT = { width: 390, height: 780 };
const SEEK_STEP_SECONDS = 5;

/** Owner with a video sitting between two photos in the library, library screen open. */
const arrangeVideoGallery = async (
  userA: UserSession,
  uniqueSuffix: string,
): Promise<VideoGallery> => {
  await enableVideoUploads(userA.userId);
  await loginAndOpenLibrary(userA.page, userA.context, userA.user);
  return uploadVideoBetweenPhotos(userA.page, uniqueSuffix);
};

const blurActiveElement = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
};

/** Puts keyboard focus on the player itself, where the player's own shortcuts listen. */
const focusPlayer = async (page: Page): Promise<void> => {
  await page.getByLabel('Media viewer').locator('[data-preset="video"]').focus();
};

const currentTime = async (page: Page): Promise<number> => (await videoState(page)).currentTime;

const waitForTimeNear = async (page: Page, seconds: number): Promise<void> => {
  await page.waitForFunction((want) => {
    const video = document.querySelector('video');
    return video != null && !video.seeking && Math.abs(video.currentTime - want) < 0.3;
  }, seconds);
};

test.describe('Media Viewer', () => {
  test.describe('When viewing a video', () => {
    test('touch: swipes navigate, the control bar scrubs, and a tap toggles the controls', async ({
      userA,
      browser,
      uniqueSuffix,
    }) => {
      const gallery = await arrangeVideoGallery(userA, uniqueSuffix);

      // Same user in a phone-sized touch context: the viewer's mobile layout and gestures.
      const context = await browser.newContext({ viewport: MOBILE_VIEWPORT, hasTouch: true });
      try {
        await loginViaApi(context, userA.user);
        const page = await context.newPage();
        await page.goto('/media');
        await openVideoFromLibrary(page, gallery.videoId);
        const touch = await createTouchDriver(page);

        const box = await viewerVideo(page).boundingBox();
        expect(box, 'video has no layout box').not.toBeNull();
        if (box == null) {
          return;
        }
        const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const left = { x: centre.x - 110, y: centre.y };
        const right = { x: centre.x + 110, y: centre.y };

        await test.step('a tap shows the controls without pausing', async () => {
          // Start from a known state: the controls hide themselves during playback.
          await waitForControls(page, false);
          await touch.tap(centre.x, centre.y);
          await waitForControls(page, true);
          expect((await videoState(page)).paused).toBe(false);
        });

        await test.step('a drag that starts on the control bar scrubs and does not navigate', async () => {
          const thumb = await page
            .getByLabel('Media viewer')
            .getByRole('slider', { name: 'Seek' })
            .boundingBox();
          expect(thumb, 'seek slider has no layout box').not.toBeNull();
          if (thumb == null) {
            return;
          }
          const from = { x: thumb.x + thumb.width / 2, y: thumb.y + thumb.height / 2 };
          const before = await currentTime(page);
          await touch.drag(from, { x: from.x + 120, y: from.y });
          await page.waitForFunction(
            (min) => (document.querySelector('video')?.currentTime ?? 0) > min,
            before + SEEK_STEP_SECONDS,
          );
          await expectViewerAt(page, gallery.videoId);
        });

        await test.step('a tap hides the controls again without pausing', async () => {
          await waitForControls(page, true);
          await touch.tap(centre.x, centre.y);
          await waitForControls(page, false);
          expect((await videoState(page)).paused).toBe(false);
        });

        await test.step('a swipe that starts on the video navigates, both ways', async () => {
          await touch.drag(right, left);
          await expectViewerAt(page, gallery.nextId);
          // The neighbour is a photo; let its stage mount before swiping back.
          await expectMediaItemLoaded(page, gallery.nextId);

          await touch.drag(left, right);
          await expectViewerAt(page, gallery.videoId);
          await waitForPlaying(page);

          await touch.drag(left, right);
          await expectViewerAt(page, gallery.previousId);
        });
      } finally {
        await context.close();
      }
    });

    test('keyboard: arrows navigate without seeking, Shift+arrows seek, Space toggles once', async ({
      userA,
      uniqueSuffix,
    }) => {
      const gallery = await arrangeVideoGallery(userA, uniqueSuffix);
      const { page } = userA;
      await openVideoFromLibrary(page, gallery.videoId);

      const focusStates = [
        { name: 'focus outside the player', apply: blurActiveElement, awayId: gallery.nextId },
        { name: 'focus inside the player', apply: focusPlayer, awayId: gallery.previousId },
      ];

      for (const focus of focusStates) {
        await test.step(`${focus.name}: Space toggles play/pause exactly once`, async () => {
          await focus.apply(page);
          await startVideoProbe(page);

          await page.keyboard.press('Space');
          await waitForPaused(page);
          // The media events land a task after the state flips, so poll the counts.
          await expect.poll(() => readVideoProbe(page)).toMatchObject({ pauses: 1, plays: 0 });

          await page.keyboard.press('Space');
          await waitForPlaying(page);
          await expect.poll(() => readVideoProbe(page)).toMatchObject({ pauses: 1, plays: 1 });
        });

        await test.step(`${focus.name}: Shift+arrows seek 5s and do not navigate`, async () => {
          // Paused, so the expected times are exact.
          await page.keyboard.press('Space');
          await waitForPaused(page);
          const start = await currentTime(page);

          await page.keyboard.press('Shift+ArrowRight');
          await waitForTimeNear(page, start + SEEK_STEP_SECONDS);
          await page.keyboard.press('Shift+ArrowLeft');
          await waitForTimeNear(page, start);
          await expectViewerAt(page, gallery.videoId);
        });

        await test.step(`${focus.name}: plain arrows navigate and never seek`, async () => {
          const away = focus.awayId === gallery.nextId ? 'ArrowRight' : 'ArrowLeft';
          const back = focus.awayId === gallery.nextId ? 'ArrowLeft' : 'ArrowRight';
          await startVideoProbe(page);

          await page.keyboard.press(away);
          await expectViewerAt(page, focus.awayId);
          expect((await readVideoProbe(page)).seeks).toBe(0);
          // The neighbour is a photo; the viewer only takes keys once it has mounted.
          await expectMediaItemLoaded(page, focus.awayId);

          await page.keyboard.press(back);
          await expectViewerAt(page, gallery.videoId);
          await waitForPlaying(page);
        });
      }
    });

    test('text fields: typing a space and Shift-selecting does not seek, pause or navigate', async ({
      userA,
      uniqueSuffix,
    }) => {
      const gallery = await arrangeVideoGallery(userA, uniqueSuffix);
      const { page } = userA;
      await openVideoFromLibrary(page, gallery.videoId);
      await startVideoProbe(page);

      const commentBox = page.getByPlaceholder('Add a comment…');
      await commentBox.click();
      await page.keyboard.type('ab cd');
      await page.keyboard.press('Shift+ArrowLeft');
      await page.keyboard.press('Shift+ArrowLeft');
      await page.keyboard.press('Shift+ArrowLeft');
      await page.keyboard.press('Shift+ArrowRight');

      // The keys did their text-editing job…
      await expect(commentBox).toHaveValue('ab cd');
      const selection = await commentBox.evaluate((el: HTMLTextAreaElement) =>
        el.value.slice(el.selectionStart, el.selectionEnd),
      );
      expect(selection).toBe('cd');

      // …and the video never noticed.
      expect(await readVideoProbe(page)).toMatchObject({ seeks: 0, pauses: 0, paused: false });
      await expectViewerAt(page, gallery.videoId);
    });

    test('lifecycle: autoplays muted, unmutes on request, stops on leaving, and starts muted again', async ({
      userA,
      uniqueSuffix,
    }) => {
      const gallery = await arrangeVideoGallery(userA, uniqueSuffix);
      const { page } = userA;
      await openVideoFromLibrary(page, gallery.videoId);

      await test.step('autoplays muted and inline', async () => {
        expect(await videoState(page)).toMatchObject({
          paused: false,
          muted: true,
          playsInline: true,
        });
      });

      await test.step('the unmute control turns sound on and goes away', async () => {
        await unmuteControl(page).click();
        await page.waitForFunction(() => document.querySelector('video')?.muted === false);
        await expect(unmuteControl(page)).toHaveCount(0);
        expect((await videoState(page)).paused).toBe(false);
      });

      await test.step('navigating away stops the video', async () => {
        await startVideoProbe(page);
        await page.keyboard.press('ArrowRight');
        await expectViewerAt(page, gallery.nextId);
        // Paused or unmounted — either way it must not keep playing behind the next item.
        await expect
          .poll(async () => {
            const left = await readVideoProbe(page);
            return !left.connected || left.paused;
          }, 'the video kept playing after navigating away')
          .toBe(true);
      });

      await test.step('coming back autoplays muted again', async () => {
        await expectMediaItemLoaded(page, gallery.nextId);
        await page.keyboard.press('ArrowLeft');
        await expectViewerAt(page, gallery.videoId);
        await waitForPlaying(page);
        expect((await videoState(page)).muted).toBe(true);
        await expect(unmuteControl(page)).toBeVisible();
      });
    });
  });
});
