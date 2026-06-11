import type { ReactNode } from 'react';
import { PublicErrorBoundary } from './PublicErrorBoundary';

type PublicRouteShellProps = {
  children: ReactNode;
};

export const PublicRouteShell = ({ children }: PublicRouteShellProps): ReactNode => {
  return <PublicErrorBoundary>{children}</PublicErrorBoundary>;
};
