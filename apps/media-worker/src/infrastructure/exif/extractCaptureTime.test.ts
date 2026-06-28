import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import { extractCaptureTime } from './extractCaptureTime.js';

const heicFixture = path.join(
  import.meta.dirname,
  '../../../../../packages/context/heic-converter/test/fixtures/sample.heic',
);

const fixtureExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

describe('extractCaptureTime', () => {
  describe('When the buffer has no EXIF', () => {
    it('should return null for both fields', async () => {
      const result = await extractCaptureTime(Buffer.from('not-an-image'));

      assert.equal(result.takenAtUtc, undefined);
      assert.equal(result.takenAtUtcOffsetMinutes, undefined);
    });
  });

  describe('When a HEIC fixture is available', () => {
    it('should not throw and return a result shape', async () => {
      const hasFixture = await fixtureExists(heicFixture);
      if (!hasFixture) {
        return;
      }

      const buffer = await fs.readFile(heicFixture);
      const result = await extractCaptureTime(buffer);

      assert.equal(result.takenAtUtc === undefined || result.takenAtUtc instanceof Date, true);
      assert.equal(
        result.takenAtUtcOffsetMinutes === undefined ||
          typeof result.takenAtUtcOffsetMinutes === 'number',
        true,
      );
    });
  });
});
