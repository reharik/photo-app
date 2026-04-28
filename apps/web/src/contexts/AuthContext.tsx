import { useApolloClient, useQuery } from '@apollo/client/react';
import type { User } from '@packages/contracts';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ViewerDocument } from '../graphql/generated/types';
import { useApiFetchBase } from '../hooks/apiFetch/useApiFetch';

type AuthActionResult = { ok: true } | { ok: false; message: string };

interface AuthContextType {
  user: User | undefined;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  publicAccess: (token: string) => Promise<AuthActionResult>;
  /** Clears session and Apollo cache so routed UI returns to the logged-out experience. */
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | undefined>(undefined);
  const { apiFetch } = useApiFetchBase();
  const apolloClient = useApolloClient();

  const {
    data: viewerData,
    loading: viewerLoading,
    error: viewerError,
  } = useQuery(ViewerDocument, {
    errorPolicy: 'all',
  });

  useEffect(() => {
    if (viewerData?.viewer) {
      setUser({
        id: viewerData.viewer.id,
        firstName: viewerData.viewer.firstName,
        lastName: viewerData.viewer.lastName,
      } as User);
    } else if (!viewerLoading && !viewerData?.viewer) {
      setUser(undefined);
    }
  }, [viewerData, viewerLoading]);

  useEffect(() => {
    if (viewerError) {
      console.error('Viewer query failed:', viewerError);
      setUser(undefined);
    }
  }, [viewerError]);

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const data = await apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (data.success) {
        await apolloClient.query({
          query: ViewerDocument,
          fetchPolicy: 'network-only',
        });
        return { ok: true };
      }
      return { ok: false, message: data.error };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<AuthActionResult> => {
    try {
      const data = await apiFetch<{ user: User }>(`/auth/signup`, {
        method: 'POST',
        body: { email, password, name },
      });

      if (data.success) {
        await apolloClient.query({
          query: ViewerDocument,
          fetchPolicy: 'network-only',
        });
        return { ok: true };
      }
      return { ok: false, message: data.error };
    } catch (error) {
      console.error('Signup exception:', error);
      return { ok: false, message: error instanceof Error ? error.message : 'Signup failed' };
    }
  };

  const publicAccess = async (token: string): Promise<AuthActionResult> => {
    try {
      const data = await apiFetch<{ token: string }>(`/auth/publicAccess`, {
        method: 'POST',
        body: { token },
      });

      if (data.success) {
        await apolloClient.query({
          query: ViewerDocument,
          fetchPolicy: 'network-only',
        });
        return { ok: true };
      }
      return { ok: false, message: data.error };
    } catch (error) {
      console.error('Signup exception:', error);
      return { ok: false, message: error instanceof Error ? error.message : 'Signup failed' };
    }
  };

  const logout = async (): Promise<void> => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setUser(undefined);
    // Refetch active queries so viewer reflects cleared cookie (clearStore alone does not refetch).
    await apolloClient.resetStore();
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    publicAccess,
    logout,
    isLoading: viewerLoading,
    isAuthenticated: !!viewerData?.viewer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
