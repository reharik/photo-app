import { describe, expect, it } from '@jest/globals';

import iocConfig from '../ioc.config';

describe('ioc.config', () => {
  describe('When the default export is loaded', () => {
    it('should define discovery and registrations for the worker', () => {
      expect(iocConfig).toEqual(
        expect.objectContaining({
          discovery: expect.objectContaining({
            scanDirs: 'src',
            generatedDir: 'src/generated',
            factoryPrefix: 'build__',
          }),
          composedManifests: [
            '@packages/media-core',
            '@packages/infrastructure',
            '@packages/notifications',
          ],
          registrations: expect.objectContaining({
            Knex: {
              $contract: { accessKey: 'database' },
            },
          }),
        }),
      );
    });
  });
});
