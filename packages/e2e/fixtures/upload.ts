import { expect, type BrowserContext, type Page } from '@playwright/test';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loginViaUi } from './auth';
import { E2E_ASSETS_DIR, grabTestImages, GrabTestImagesResult } from './testAssets';
import type { TestUser } from './users';

/** Committed 1×1 JPEG; default source when no asset is specified. */
export const SAMPLE_IMAGE_PATH = join(E2E_ASSETS_DIR, 'sample.jpg');

export { E2E_ASSETS_DIR, grabTestImages } from './testAssets';
export type { GrabTestImagesResult } from './testAssets';

/** Upload + backend processing can be slow in local/docker environments. */
export const UPLOAD_TIMEOUT_MS = 120_000;

export type UploadedMediaItem = {
  id: string;
};

export type CreateTestImageFileOptions = {
  /** Asset file name under {@link E2E_ASSETS_DIR}. Defaults to `sample.jpg`. */
  sourceAssetName?: string;
};

/**
 * Copies an asset image to a temp path with the given file name so
 * the upload queue and grid can be correlated by `originalFileName`.
 */
export const createTestImageFile = (
  fileName: string,
  options: CreateTestImageFileOptions = {},
): string => {
  const sourceAssetName = options.sourceAssetName ?? 'sample.jpg';
  const dir = mkdtempSync(join(tmpdir(), 'betaname-e2e-'));
  const dest = join(dir, fileName);
  copyFileSync(join(E2E_ASSETS_DIR, sourceAssetName), dest);
  return dest;
};

/** Returns media item ids currently shown in the recent-media grid. */
export const getMediaTileIds = async (page: Page): Promise<string[]> => {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="media-tile-"]'))
      .map((el) => el.getAttribute('data-testid'))
      .filter((id): id is string => id != null && id.startsWith('media-tile-'))
      .map((id) => id.slice('media-tile-'.length)),
  );
};

export const expectLibraryPage = async (page: Page): Promise<void> => {
  await expect(page.getByText('Harik family')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recent' })).toBeVisible();
  await expect(page.getByTestId('upload-media-input').first()).toBeAttached();
};

/**
 * Signs in, opens the recent-media screen, and waits until the shell is ready.
 * Auth uses the API (fast setup); the screen under test is always the UI.
 */
export const loginAndOpenLibrary = async (
  page: Page,
  context: BrowserContext,
  user: TestUser,
): Promise<void> => {
  await loginViaUi(page, user);
  await page.goto('/media');
  await expectLibraryPage(page);
};

/**
 * Uploads one or more files through the Library "Upload Media" control
 * and waits until each new item appears as a grid tile.
 */
export const uploadMediaViaUi = async (
  page: Page,
  testImages: GrabTestImagesResult | GrabTestImagesResult[],
): Promise<{ id: string; fileName: string }[]> => {
  const images = Array.isArray(testImages) ? testImages : [testImages];
  if (images.length === 0) {
    return [];
  }

  const paths = images.map((image) => image.path);
  const idsBefore = new Set(await getMediaTileIds(page));

  await page.getByTestId('upload-media-input').first().setInputFiles(paths);

  await expect(page.getByRole('region', { name: 'Upload progress' })).toBeVisible({
    timeout: 10_000,
  });

  await expect
    .poll(
      async () => {
        const idsAfter = await getMediaTileIds(page);
        return idsAfter.filter((id) => !idsBefore.has(id)).length;
      },
      { timeout: UPLOAD_TIMEOUT_MS },
    )
    .toBe(images.length);

  const newIds = (await getMediaTileIds(page)).filter((id) => !idsBefore.has(id));
  // Upload queue runs one file at a time; library sorts newest-first in the grid.
  return [...newIds].reverse().map((id, index) => ({
    id,
    fileName: images[index].fileName,
  }));
};

/**
 * Login → library → upload. This is the standard arrange step for owner tests.
 */
export const loginAndUploadMedia = async (
  page: Page,
  context: BrowserContext,
  user: TestUser,
  fileNames: string[],
): Promise<{ id: string; fileName: string }[]> => {
  await loginAndOpenLibrary(page, context, user);
  const images = fileNames.map((fileName) => ({
    fileName,
    path: createTestImageFile(fileName),
  }));
  return uploadMediaViaUi(page, images);
};

/**
 * Login → library → upload `count` randomly chosen asset images
 * named `{assetStem}-{uniqueSuffix}{ext}`.
 */
export const loginAndUploadRandomAssets = async (
  page: Page,
  context: BrowserContext,
  user: TestUser,
  count: number,
  uniqueSuffix: string,
): Promise<UploadedMediaItem[]> => {
  await loginAndOpenLibrary(page, context, user);
  const items = grabTestImages(count, uniqueSuffix);
  return uploadMediaViaUi(page, items);
};
