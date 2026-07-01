import { BrowserRouter } from 'react-router-dom';
import { AppErrorBoundary } from './app/AppErrorBoundary';
import { AppProviders } from './app/providers/AppProviders';
import { AppRouter } from './app/router/AppRouter';

export const App = () => {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </BrowserRouter>
    </AppProviders>
  );
};
