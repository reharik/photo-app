import { ViewerOperation } from '@packages/contracts';
import { useMemo } from 'react';

type AuthorizationViewModel = { viewerOperations: ViewerOperation[] };
type HasPermissionProps = {
  model: AuthorizationViewModel;
  requiredOperation: ViewerOperation;
  children: React.ReactNode;
};
export const HasPermission = ({ model, requiredOperation, children }: HasPermissionProps) => {
  const hasPermission = useMemo(() => {
    return model.viewerOperations.includes(requiredOperation);
  }, [model, requiredOperation]);

  return hasPermission ? children : null;
};
