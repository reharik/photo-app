import { describe, expect, it } from '@jest/globals';
import { Readable } from 'node:stream';

import { readStreamToBuffer } from '../tasks/queue/mediaWorkers/readStreamToBuffer';

describe('readStreamToBuffer', () => {
  describe('When the stream emits Buffer chunks', () => {
    it('should concatenate into one buffer', async () => {
      const readable = Readable.from([Buffer.from('ab'), Buffer.from('cd')]);
      const result = await readStreamToBuffer(readable);
      expect(result.equals(Buffer.from('abcd'))).toBe(true);
    });
  });

  describe('When the stream emits string chunks', () => {
    it('should encode as utf8', async () => {
      const readable = Readable.from(['x', 'y']);
      const result = await readStreamToBuffer(readable);
      expect(result.toString('utf8')).toBe('xy');
    });
  });

  describe('When the stream emits Uint8Array chunks', () => {
    it('should copy into buffers', async () => {
      const readable = Readable.from([new Uint8Array([1, 2]), new Uint8Array([3])]);
      const result = await readStreamToBuffer(readable);
      expect([...result]).toEqual([1, 2, 3]);
    });
  });

  describe('When the stream emits an unsupported chunk type', () => {
    it('should reject', async () => {
      const readable = Readable.from([123 as unknown as Buffer]);
      await expect(readStreamToBuffer(readable)).rejects.toThrow(/Unsupported chunk type/);
    });
  });
});
