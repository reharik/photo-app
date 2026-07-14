import { describe, expect, it } from '@jest/globals';

import { generateImageDerivatives } from '../tasks/queue/mediaWorkers/imageDerivativeGenerator';

/** 1×1 PNG — minimal valid image for sharp. */
const MINIMAL_PNG_1X1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

describe('generateImageDerivatives', () => {
  describe('When given a valid image buffer', () => {
    it('should produce jpeg display and thumbnail derivatives with dimensions', async () => {
      const { display, thumbnail } = await generateImageDerivatives(MINIMAL_PNG_1X1);

      expect(display.mimeType).toBe('image/jpeg');
      expect(thumbnail.mimeType).toBe('image/jpeg');
      expect(display.width).toBeGreaterThan(0);
      expect(display.height).toBeGreaterThan(0);
      expect(thumbnail.width).toBeGreaterThan(0);
      expect(thumbnail.height).toBeGreaterThan(0);
      expect(display.fileSizeBytes).toBe(display.buffer.length);
      expect(thumbnail.fileSizeBytes).toBe(thumbnail.buffer.length);
      expect(display.buffer.length).toBeGreaterThan(0);
      expect(thumbnail.buffer.length).toBeGreaterThan(0);
    });
  });
});
