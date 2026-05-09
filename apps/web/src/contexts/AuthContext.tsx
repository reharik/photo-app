import { useApolloClient } from '@apollo/client/react';
import { User } from '@packages/contracts';
import React, { createContext, ReactNode, useContext } from 'react';
import { ViewerDocument } from '../graphql/generated/types';
import { useApiFetch } from '../hooks/useApiFetch';

type AuthActionResult = { ok: true } | { ok: false; message: string };
type TokenActionResult = { success: boolean; error?: string };

interface AuthContextType {
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  publicAccess: (token: string) => Promise<TokenActionResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { apiFetch } = useApiFetch();
  const apolloClient = useApolloClient();

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      const data = await apiFetch<{ user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      if (data.success) {
        await apolloClient.query({ query: ViewerDocument, fetchPolicy: 'network-only' });
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
      const data = await apiFetch<{ user: User }>('/auth/signup', {
        method: 'POST',
        body: { email, password, name },
      });
      if (data.success) {
        await apolloClient.query({ query: ViewerDocument, fetchPolicy: 'network-only' });
        return { ok: true };
      }
      return { ok: false, message: data.error };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Signup failed' };
    }
  };

  const publicAccess = async (token: string): Promise<TokenActionResult> => {
    try {
      return apiFetch<{ albumId: string }>('/auth/publicAccess', {
        method: 'POST',
        body: { token },
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Public access failed',
      };
    }
  };

  const logout = async (): Promise<void> => {
    await apiFetch('/auth/logout', { method: 'POST' });
    await apolloClient.resetStore();
  };

  return (
    <AuthContext.Provider value={{ login, signup, publicAccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
