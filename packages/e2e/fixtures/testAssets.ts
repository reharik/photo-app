import { copyFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Directory of committed images used by e2e uploads. Add .jpg/.png/etc. here. */
export const E2E_ASSETS_DIR = join(__dirname, 'assets');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export const listE2eAssetImages = (): string[] => {
  return readdirSync(E2E_ASSETS_DIR)
    .filter((name) => IMAGE_EXTENSIONS.has(extname(name).toLowerCase()))
    .sort();
};

const pickRandom = <T>(items: readonly T[]): T => {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

/**
 * Picks `count` asset file names from {@link E2E_ASSETS_DIR} at random.
 * Repeats are allowed when `count` exceeds the number of distinct assets.
 */
export const pickRandomE2eAssetImages = (count: number): string[] => {
  const available = listE2eAssetImages();
  if (available.length === 0) {
    throw new Error(`No image assets in ${E2E_ASSETS_DIR}. Add .jpg, .png, or other image files.`);
  }
  if (count <= 0) {
    return [];
  }
  return Array.from({ length: count }, () => pickRandom(available));
};

/** `sunset.jpg` + suffix `abc` → `sunset-abc.jpg` */
export const suffixedFileName = (originalFileName: string, uniqueSuffix: string): string => {
  const ext = extname(originalFileName);
  const stem = basename(originalFileName, ext);
  return `${stem}-${uniqueSuffix}${ext}`;
};

const allocateUniqueFileName = (
  assetFileName: string,
  uniqueSuffix: string,
  usedBaseNames: Map<string, number>,
): string => {
  const preferred = suffixedFileName(assetFileName, uniqueSuffix);
  const seen = usedBaseNames.get(preferred) ?? 0;
  usedBaseNames.set(preferred, seen + 1);
  if (seen === 0) {
    return preferred;
  }
  const ext = extname(preferred);
  const stem = basename(preferred, ext);
  return `${stem}-${seen + 1}${ext}`;
};

export type GrabTestImagesResult = { fileName: string; path: string };

/**
 * Randomly selects `count` images from the assets folder, copies each to a temp
 * directory, and names uploads `{originalStem}-{uniqueSuffix}{ext}`.
 * Duplicate names in one batch get `-2`, `-3`, … appended before the extension.
 */
export const grabTestImages = (count: number, uniqueSuffix: string): GrabTestImagesResult[] => {
  const picked = pickRandomE2eAssetImages(count);
  const dir = mkdtempSync(join(tmpdir(), 'betaname-e2e-'));
  const usedBaseNames = new Map<string, number>();
  const result: { fileName: string; path: string }[] = [];

  for (const assetFileName of picked) {
    const fileName = allocateUniqueFileName(assetFileName, uniqueSuffix, usedBaseNames);
    const dest = join(dir, fileName);
    copyFileSync(join(E2E_ASSETS_DIR, assetFileName), dest);
    result.push({ fileName, path: dest });
  }

  return result;
};
