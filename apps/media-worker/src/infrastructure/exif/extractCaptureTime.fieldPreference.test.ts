import assert from 'node:assert/strict';
import { before, describe, it, mock } from 'node:test';

import type { CaptureInstant } from './computeCaptureInstant.js';

type ExifParseResult = {
  DateTimeOriginal?: string;
  CreateDate?: string;
  OffsetTimeOriginal?: string;
  OffsetTimeDigitized?: string;
};

const parseMock = mock.fn<() => Promise<ExifParseResult | null>>();

describe('extractCaptureTime field preference', () => {
  let extractCaptureTime: (buffer: Buffer) => Promise<CaptureInstant>;

  before(async () => {
    mock.module('exifr', {
      defaultExport: {
        parse: parseMock,
      },
    });

    ({ extractCaptureTime } = await import('./extractCaptureTime.js'));
  });

  describe('When DateTimeOriginal and OffsetTimeOriginal are present', () => {
    it('should use DateTimeOriginal and ignore CreateDate', async () => {
      parseMock.mock.mockImplementationOnce(async () => ({
        DateTimeOriginal: '2024:07:15 18:45:30',
        OffsetTimeOriginal: '+03:00',
        CreateDate: '2020:01:01 00:00:00',
        OffsetTimeDigitized: '-05:00',
      }));

      const result = await extractCaptureTime(Buffer.from('image-bytes'));

      assert.equal(result.takenAtUtc?.toISOString(), '2024-07-15T15:45:30.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, 180);
    });
  });

  describe('When DateTimeOriginal is absent and CreateDate is present', () => {
    it('should use CreateDate', async () => {
      parseMock.mock.mockImplementationOnce(async () => ({
        CreateDate: '2024:08:01 10:20:30',
        OffsetTimeDigitized: '-04:00',
      }));

      const result = await extractCaptureTime(Buffer.from('image-bytes'));

      assert.equal(result.takenAtUtc?.toISOString(), '2024-08-01T14:20:30.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, -240);
    });
  });

  describe('When OffsetTimeOriginal is absent and OffsetTimeDigitized is present', () => {
    it('should use OffsetTimeDigitized with CreateDate', async () => {
      parseMock.mock.mockImplementationOnce(async () => ({
        CreateDate: '2024:09:12 08:00:00',
        OffsetTimeDigitized: '+02:00',
      }));

      const result = await extractCaptureTime(Buffer.from('image-bytes'));

      assert.equal(result.takenAtUtc?.toISOString(), '2024-09-12T06:00:00.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, 120);
    });
  });
});
