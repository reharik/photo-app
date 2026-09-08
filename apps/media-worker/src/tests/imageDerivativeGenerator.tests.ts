/**
 * The derivative generator's three behaviours, none of which were covered
 * before: what it reports for the ORIGINAL, whether it swapped the original's
 * axes for EXIF orientation, and whether the original was replaced.
 *
 * Why orientation needs a test at all: `sharp().metadata()` reports STORED
 * dimensions, before EXIF rotation. `resizeToDerivative` calls `.rotate()`, so
 * the derivatives come back already oriented. EXIF orientations 5-8 transpose
 * the axes, so the original's recorded dimensions have to be swapped to match —
 * otherwise a portrait phone photo gets a landscape original row sitting next
 * to portrait derivatives.
 *
 * Every orientation case asserts the ASPECT RATIO RELATIONSHIP between the
 * original and the display derivative, not just literal numbers. That is the
 * actual invariant, and it is the only form of the assertion that fails when
 * both values are wrong in the same direction.
 *
 * Fixtures are generated with sharp (`.withMetadata({ orientation })`) rather
 * than committed as binaries. The HEIC converter is mocked at the module
 * boundary: it is a native decode path, and what matters here is only what the
 * generator does with the values it returns.
 */
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import sharp from 'sharp';

type ConvertResult = {
  outputBuffer: Buffer;
  convertedSize: number;
  width: number;
  height: number;
};

const isHeic = jest.fn<(input: Buffer) => Promise<boolean>>();
const convertHeicToJpeg =
  jest.fn<(input: Buffer, options?: { quality?: number }) => Promise<ConvertResult>>();

/** A landscape image (400×200) carrying the given EXIF orientation, as JPEG. */
const jpegWithOrientation = async (orientation: number): Promise<Buffer> =>
  sharp({ create: { width: 400, height: 200, channels: 3, background: { r: 10, g: 20, b: 30 } } })
    .withMetadata({ orientation })
    .jpeg()
    .toBuffer();

const aspect = ({ width, height }: { width: number; height: number }): number => width / height;

describe('generateImageDerivatives', () => {
  let generateImageDerivatives: typeof import('../tasks/queue/mediaWorkers/imageDerivativeGenerator.js').generateImageDerivatives;

  /** No EXIF orientation at all — the "nothing to correct" baseline. */
  let plainPng: Buffer;

  beforeAll(async () => {
    jest.unstable_mockModule('@packages/heic-converter', () => ({ isHeic, convertHeicToJpeg }));
    ({ generateImageDerivatives } = await import(
      '../tasks/queue/mediaWorkers/imageDerivativeGenerator.js'
    ));

    plainPng = await sharp({
      create: { width: 400, height: 200, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toBuffer();
  });

  beforeEach(() => {
    isHeic.mockReset();
    convertHeicToJpeg.mockReset();
    isHeic.mockResolvedValue(false);
  });

  describe('When the image has no EXIF orientation', () => {
    it('should report the original unswapped, agreeing with the display derivative', async () => {
      const { original, display } = await generateImageDerivatives(plainPng);

      expect(original.width).toBe(400);
      expect(original.height).toBe(200);
      expect(aspect(original)).toBeCloseTo(aspect(display), 5);
    });
  });

  describe('When the image has EXIF orientation 1', () => {
    it('should report the original unswapped, agreeing with the display derivative', async () => {
      const { original, display } = await generateImageDerivatives(
        await jpegWithOrientation(1),
      );

      expect(original.width).toBe(400);
      expect(original.height).toBe(200);
      // Orientation 1 is a no-op rotation, so display stays landscape too.
      expect(display.width).toBeGreaterThan(display.height);
      expect(aspect(original)).toBeCloseTo(aspect(display), 5);
    });
  });

  describe('When the image has EXIF orientation 6 — the common phone-portrait case', () => {
    it('should swap the original dimensions so they agree with the rotated display derivative', async () => {
      const { original, display } = await generateImageDerivatives(
        await jpegWithOrientation(6),
      );

      // Stored 400×200, but orientation 6 transposes: the original is portrait.
      expect(original.width).toBe(200);
      expect(original.height).toBe(400);
      // .rotate() already applied this to the derivative — the two must agree.
      expect(display.height).toBeGreaterThan(display.width);
      expect(aspect(original)).toBeCloseTo(aspect(display), 5);
    });
  });

  describe('When the image has EXIF orientation 8 — the other transposing quarter-turn', () => {
    it('should swap the original dimensions so they agree with the rotated display derivative', async () => {
      const { original, display, thumbnail } = await generateImageDerivatives(
        await jpegWithOrientation(8),
      );

      expect(original.width).toBe(200);
      expect(original.height).toBe(400);
      expect(aspect(original)).toBeCloseTo(aspect(display), 5);
      // The thumbnail is rotated by the same code path, so it agrees too.
      expect(aspect(original)).toBeCloseTo(aspect(thumbnail), 5);
    });
  });

  describe('When the image has EXIF orientation 5 — a transposing mirror', () => {
    it('should swap the original dimensions, since 5 transposes the axes too', async () => {
      const { original, display } = await generateImageDerivatives(
        await jpegWithOrientation(5),
      );

      expect(original.width).toBe(200);
      expect(original.height).toBe(400);
      expect(aspect(original)).toBeCloseTo(aspect(display), 5);
    });
  });

  describe('When the original is not replaced', () => {
    it('should report originalWasReplaced false and hand back the very bytes it was given', async () => {
      const { original, originalWasReplaced } = await generateImageDerivatives(plainPng);

      expect(originalWasReplaced).toBe(false);
      // Identity, not just equality: the caller keys "should I upload?" off the
      // flag, so these bytes are already the ones in S3.
      expect(original.buffer).toBe(plainPng);
      expect(original.fileSizeBytes).toBe(plainPng.length);
    });
  });

  describe('When reporting the original mimeType for a non-HEIC image', () => {
    it('should derive it from the actual bytes, not from a constant', async () => {
      const png = await generateImageDerivatives(plainPng);
      const jpeg = await generateImageDerivatives(await jpegWithOrientation(1));

      // The PNG must NOT be reported as image/jpeg: that is the derivative's
      // type, and the original is still PNG in S3.
      expect(png.original.mimeType).toBe('image/png');
      expect(jpeg.original.mimeType).toBe('image/jpeg');
      // The derivatives are always re-encoded to JPEG regardless.
      expect(png.display.mimeType).toBe('image/jpeg');
      expect(png.thumbnail.mimeType).toBe('image/jpeg');
    });
  });

  describe('When the input is HEIC', () => {
    /**
     * A real converter emits already-oriented pixels and reports those
     * post-decode dimensions. The fixture deliberately gives the returned JPEG
     * a TRANSPOSING EXIF orientation as well, so that a regression which
     * applied the non-HEIC swap to this path would produce 900×600 instead of
     * 600×900 and be caught.
     */
    const setUpHeic = async () => {
      const converted = await sharp({
        create: { width: 900, height: 600, channels: 3, background: { r: 5, g: 5, b: 5 } },
      })
        .withMetadata({ orientation: 6 })
        .jpeg()
        .toBuffer();
      isHeic.mockResolvedValue(true);
      convertHeicToJpeg.mockResolvedValue({
        outputBuffer: converted,
        convertedSize: converted.length,
        width: 600,
        height: 900,
      });
      return converted;
    };

    it('should report originalWasReplaced true and hand back the converted bytes', async () => {
      const converted = await setUpHeic();

      const { original, originalWasReplaced } = await generateImageDerivatives(
        Buffer.from('fake-heic'),
      );

      expect(originalWasReplaced).toBe(true);
      // The caller uploads these to the original's key — if they are not the
      // converted bytes, S3 keeps undecodable HEIC while the DB says JPEG.
      expect(original.buffer).toBe(converted);
      expect(original.fileSizeBytes).toBe(converted.length);
    });

    it('should report the JPEG mimeType, since that is what lands in S3', async () => {
      await setUpHeic();

      const { original } = await generateImageDerivatives(Buffer.from('fake-heic'));

      expect(original.mimeType).toBe('image/jpeg');
    });

    it('should take the converter dimensions verbatim and NOT apply the orientation swap', async () => {
      await setUpHeic();

      const { original, display } = await generateImageDerivatives(Buffer.from('fake-heic'));

      // Exactly what the converter reported. Swapping here would give 900×600.
      expect(original.width).toBe(600);
      expect(original.height).toBe(900);
      expect(aspect(original)).toBeCloseTo(aspect(display), 5);
    });

    it('should build the derivatives from the converted bytes, not the HEIC input', async () => {
      const converted = await setUpHeic();

      const { display, thumbnail } = await generateImageDerivatives(Buffer.from('fake-heic'));

      // Undecodable HEIC input would have thrown had it reached sharp.
      expect(display.width).toBeGreaterThan(0);
      expect(thumbnail.width).toBeGreaterThan(0);
      expect(convertHeicToJpeg).toHaveBeenCalledTimes(1);
      expect(converted.length).toBeGreaterThan(0);
    });
  });

  describe('When a stage fails', () => {
    it('should name the stage in the error, so the job log says which step broke', async () => {
      isHeic.mockResolvedValue(true);
      convertHeicToJpeg.mockRejectedValue(new Error('decode blew up'));

      await expect(generateImageDerivatives(Buffer.from('fake-heic'))).rejects.toThrow(
        /heic_convert.*decode blew up/,
      );
    });
  });
});
