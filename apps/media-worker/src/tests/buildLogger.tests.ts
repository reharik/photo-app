import { describe, expect, it } from '@jest/globals';

import type { IocGeneratedCradle } from '../di/generated/ioc-registry.types';
import { build__Logger } from '../infrastructure/logger/logger';

describe('build__Logger', () => {
  describe('When built with log level only', () => {
    it('should return a logger with callable levels', () => {
      const logger = build__Logger({
        config: { logLevel: 'error' } as IocGeneratedCradle['config'],
      } as IocGeneratedCradle);

      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
