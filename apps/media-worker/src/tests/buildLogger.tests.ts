import { describe, expect, it } from '@jest/globals';

import type { AppCradle } from '../generated/ioc-composed.js';
import { build__Logger } from '../infrastructure/logger/logger';

describe('build__Logger', () => {
  describe('When built with log level only', () => {
    it('should return a logger with callable levels', () => {
      const logger = build__Logger({
        config: { logLevel: 'error' } as AppCradle['config'],
      } as AppCradle);

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
