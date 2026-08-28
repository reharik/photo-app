import { describe, expect, it } from '@jest/globals';

import { createWorkerContainer } from '../container';

/**
 * The container used to be a lazily-initialized module global, and this suite
 * guarded the one thing that arrangement could get wrong: reading it before
 * `initializeWorkerContainer` ran. `createWorkerContainer()` replaced all three
 * of those exports with a plain factory, so there is no uninitialized state left
 * to guard — what is worth pinning now is that the factory really does compose
 * the manifest, and that two calls do not share state (the property the module
 * global did not have).
 */
describe('Worker container', () => {
  describe('When createWorkerContainer is called', () => {
    it('should register the worker entrypoint and the composed media-core contracts', () => {
      const container = createWorkerContainer();

      expect(container.hasRegistration('app')).toBe(true);
      expect(container.hasRegistration('runMediaWorkerLoop')).toBe(true);
      expect(container.hasRegistration('mediaProcessingJobRepository')).toBe(true);
      expect(container.hasRegistration('uow')).toBe(true);
    });

    it('should hand back an independent container on every call', () => {
      const first = createWorkerContainer();
      const second = createWorkerContainer();

      expect(first).not.toBe(second);
    });
  });
});
