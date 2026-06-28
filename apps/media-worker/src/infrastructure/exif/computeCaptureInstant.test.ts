import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { computeCaptureInstant } from './computeCaptureInstant.js';

describe('computeCaptureInstant', () => {
  describe('When offset is +03:00 (Beirut)', () => {
    it('should return the UTC instant and offset minutes', () => {
      const result = computeCaptureInstant('2024:07:15 18:45:30', '+03:00');

      assert.equal(result.takenAtUtc?.toISOString(), '2024-07-15T15:45:30.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, 180);
    });
  });

  describe('When offset is -05:00 (Austin)', () => {
    it('should return the UTC instant and offset minutes', () => {
      const result = computeCaptureInstant('2024:01:20 09:15:00', '-05:00');

      assert.equal(result.takenAtUtc?.toISOString(), '2024-01-20T14:15:00.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, -300);
    });
  });

  describe('When offset is absent', () => {
    it('should interpret naive numerals as UTC with null offset minutes', () => {
      const result = computeCaptureInstant('2024:03:10 12:00:00', undefined);

      assert.equal(result.takenAtUtc?.toISOString(), '2024-03-10T12:00:00.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, undefined);
    });
  });

  describe('When dateStr is malformed', () => {
    it('should return null for both fields', () => {
      const result = computeCaptureInstant('not-a-date', '+03:00');

      assert.equal(result.takenAtUtc, undefined);
      assert.equal(result.takenAtUtcOffsetMinutes, undefined);
    });
  });

  describe('When both inputs are undefined', () => {
    it('should return null for both fields', () => {
      const result = computeCaptureInstant(undefined, undefined);

      assert.equal(result.takenAtUtc, undefined);
      assert.equal(result.takenAtUtcOffsetMinutes, undefined);
    });
  });

  describe('When only CreateDate-style values are provided', () => {
    it('should compute the instant from the fallback date and digitized offset', () => {
      const result = computeCaptureInstant('2024:08:01 10:20:30', '-04:00');

      assert.equal(result.takenAtUtc?.toISOString(), '2024-08-01T14:20:30.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, -240);
    });
  });

  describe('When offset is present without a date', () => {
    it('should return null for both fields', () => {
      const result = computeCaptureInstant(undefined, '+03:00');

      assert.equal(result.takenAtUtc, undefined);
      assert.equal(result.takenAtUtcOffsetMinutes, undefined);
    });
  });

  describe('When offset format is malformed', () => {
    it('should interpret the date as UTC with null offset minutes', () => {
      const result = computeCaptureInstant('2024:07:15 18:45:30', '+3:00');

      assert.equal(result.takenAtUtc?.toISOString(), '2024-07-15T18:45:30.000Z');
      assert.equal(result.takenAtUtcOffsetMinutes, undefined);
    });
  });
});
