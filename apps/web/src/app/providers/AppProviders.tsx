import { ApolloProvider } from '@apollo/client/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { AuthProvider } from '../../contexts/AuthContext';
import { UploadQueueProvider } from '../../contexts/UploadQueueContext';
import { apolloClient } from '../../graphql/client';
import { GlobalStyle } from '../../styles/globalStyle';
import { theme } from '../../styles/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            <UploadQueueProvider>{children}</UploadQueueProvider>
          </AuthProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
