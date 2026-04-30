import { describe, expect, it } from '@jest/globals';
import { ViewerOperation } from '@packages/contracts';
import { canEveryItemDo } from '../lib/viewerOps';

describe('canEveryItemDo', () => {
  describe('When the selection is empty', () => {
    it('should be false for any operation', () => {
      expect(canEveryItemDo([], ViewerOperation.grantAuthorization)).toBe(false);
    });
  });

  describe('When every item includes the operation', () => {
    it('should return true', () => {
      const items = [
        { viewerOperations: [ViewerOperation.grantAuthorization, ViewerOperation.download] },
        { viewerOperations: [ViewerOperation.grantAuthorization] },
      ];
      expect(canEveryItemDo(items, ViewerOperation.grantAuthorization)).toBe(true);
    });
  });

  describe('When some item lacks the operation', () => {
    it('should return false', () => {
      const items = [
        { viewerOperations: [ViewerOperation.grantAuthorization] },
        { viewerOperations: [ViewerOperation.download] },
      ];
      expect(canEveryItemDo(items, ViewerOperation.grantAuthorization)).toBe(false);
    });
  });
});
