import { ViewerOperation } from '@packages/contracts';

export const hasPermission = (viewerOperations: ViewerOperation[], permission: ViewerOperation) => {
  return viewerOperations.includes(permission);
};
