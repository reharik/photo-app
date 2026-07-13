import { Component, type ErrorInfo, type ReactNode } from 'react';
import styled from 'styled-components';
import { QueryErrorState } from '../ui/QueryErrorState';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error?: unknown;
};

/**
 * Top-level boundary for the authenticated app tree. A render-time throw (e.g. a
 * screen crashing when the API/DB is unreachable) would otherwise unmount the whole
 * React tree and leave a blank white page — this renders a friendly fallback instead.
 * Public routes keep their own nested, more specific `PublicErrorBoundary`.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[AppErrorBoundary]', error, info);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Page>
          <QueryErrorState error={this.state.error} onRetry={() => window.location.reload()} />
        </Page>
      );
    }

    return this.props.children;
  }
}

const Page = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(3)};
  box-sizing: border-box;
  background: ${({ theme }) => theme.color.body};
`;
