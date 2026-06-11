import { Component, type ErrorInfo, type ReactNode } from 'react';
import { PublicUnavailable } from '../screens/public/PublicUnavailable';

type PublicErrorBoundaryProps = {
  children: ReactNode;
};

type PublicErrorBoundaryState = {
  hasError: boolean;
};

export class PublicErrorBoundary extends Component<
  PublicErrorBoundaryProps,
  PublicErrorBoundaryState
> {
  state: PublicErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PublicErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[PublicErrorBoundary]', error, info);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <PublicUnavailable />;
    }

    return this.props.children;
  }
}
