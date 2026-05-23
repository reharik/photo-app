import { describe, expect, it } from '@jest/globals';
import { createReadStream } from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';

import { convertHeicToJpeg, isHeic } from './converter.js';
import { ConversionError } from './errors.js';

const fixturesDir = path.join(import.meta.dirname, '..', 'test', 'fixtures');
const tempFixturesDir = path.join(os.tmpdir(), 'heic-converter-tests');
const sampleFixture = path.join(fixturesDir, 'sample.heic');
const orientedFixture = path.join(fixturesDir, 'orientation-6.heic');

const createHeicLikeBuffer = (brand = 'heic'): Buffer => {
  const header = Buffer.alloc(12, 0);
  header.writeUInt32BE(24, 0);
  header.write('ftyp', 4, 'ascii');
  header.write(brand, 8, 'ascii');
  return Buffer.concat([header, Buffer.from('payload')]);
};

const fixtureExists = async (filePath: string): Promise<boolean> => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const writeTempFixture = async (content: Buffer, fileName: string): Promise<string> => {
  await fsPromises.mkdir(tempFixturesDir, { recursive: true });
  const target = path.join(tempFixturesDir, fileName);
  await fsPromises.writeFile(target, content);
  return target;
};

describe('isHeic', () => {
  describe('When input is a HEIC-like buffer', () => {
    it('should return true', async () => {
      const result = await isHeic(createHeicLikeBuffer('heic'));
      expect(result).toBe(true);
    });
  });

  describe('When input is a HEIC-like stream', () => {
    it('should return true', async () => {
      const stream = createReadStream(
        await writeTempFixture(createHeicLikeBuffer('mif1'), 'stream-test.heic'),
      );
      const result = await isHeic(stream);
      expect(result).toBe(true);
    });
  });

  describe('When input is a HEIC-like file path', () => {
    it('should return true', async () => {
      const filePath = await writeTempFixture(createHeicLikeBuffer('msf1'), 'path-test.heic');
      const result = await isHeic(filePath);
      expect(result).toBe(true);
    });
  });

  describe('When input has a non-HEIC brand', () => {
    it('should return false', async () => {
      const result = await isHeic(createHeicLikeBuffer('avif'));
      expect(result).toBe(false);
    });
  });
});

describe('convertHeicToJpeg', () => {
  describe('When input is not HEIC', () => {
    it('should throw a validation ConversionError', async () => {
      const rejection = convertHeicToJpeg(Buffer.from('not-a-heic'));
      await expect(rejection).rejects.toBeInstanceOf(ConversionError);
      await expect(rejection).rejects.toMatchObject({
        context: { stage: 'validate_format' },
      });
    });
  });

  describe('When input is corrupted HEIC bytes', () => {
    it('should throw a conversion-stage ConversionError', async () => {
      const corrupted = createHeicLikeBuffer('heic');
      const rejection = convertHeicToJpeg(corrupted);
      await expect(rejection).rejects.toBeInstanceOf(ConversionError);
      await expect(rejection).rejects.toMatchObject({
        context: { stage: 'convert_primary_image' },
      });
    });
  });

  describe('When destination is a writable stream', () => {
    it('should write JPEG bytes to the stream', async () => {
      const hasFixture = await fixtureExists(sampleFixture);
      if (!hasFixture) {
        return;
      }

      const input = await fsPromises.readFile(sampleFixture);
      const sink = new PassThrough();
      const chunks: Buffer[] = [];
      sink.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      const result = await convertHeicToJpeg(input, { destination: sink });

      expect(result.convertedSize).toBeGreaterThan(0);
      expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
    });
  });

  describe('When converting a valid HEIC fixture', () => {
    it('should return JPEG buffer and dimensions', async () => {
      const hasFixture = await fixtureExists(sampleFixture);
      if (!hasFixture) {
        return;
      }

      const result = await convertHeicToJpeg(sampleFixture);

      expect(Buffer.isBuffer(result.outputBuffer)).toBe(true);
      expect(result.originalSize).toBeGreaterThan(0);
      expect(result.convertedSize).toBeGreaterThan(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });
  });

  describe('When converting an orientation fixture', () => {
    it('should preserve orientation in output geometry', async () => {
      const hasFixture = await fixtureExists(orientedFixture);
      if (!hasFixture) {
        return;
      }

      const result = await convertHeicToJpeg(orientedFixture);
      expect(result.metadata.orientation).toBe(6);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });
  });
});
