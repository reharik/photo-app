import { useApolloClient } from '@apollo/client/react';
import { User } from '@packages/contracts';
import React, { createContext, ReactNode, useContext } from 'react';
import { authClient } from '../features/auth/authClient';
import type {
  EmailVerificationResult,
  SetPasswordRequest,
  SetPasswordResult,
} from '../features/auth/authContract';
import { ViewerDocument } from '../graphql/generated/types';
import { useApiFetch } from '../hooks/useApiFetch';

type AuthActionResult = { ok: true } | { ok: false; message: string };
type TokenActionResult = { success: boolean; error?: string };

interface AuthContextType {
  login: (email: string, password: string) => Promise<AuthActionResult>;
  publicAccess: (token: string) => Promise<TokenActionResult>;
  logout: () => Promise<void>;
  // Unified email → code → password flow, shared by BOTH doors (signup + forgot).
  // Existence-blind: request a code for an email. Never leaks whether an account exists.
  requestEmailVerification: (email: string) => Promise<EmailVerificationResult>;
  // Verify the code AND set the password in one call. On success the server sets the
  // session cookie and this hydrates the viewer — the caller lands logged in.
  completeAuth: (req: SetPasswordRequest) => Promise<SetPasswordResult>;
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

  const requestEmailVerification = async (email: string): Promise<EmailVerificationResult> =>
    authClient.emailVerification({ email });

  const completeAuth = async (req: SetPasswordRequest): Promise<SetPasswordResult> => {
    const result = await authClient.setPassword(req);
    if (!result.ok) {
      return result;
    }
    // 200 → the server set the httpOnly session cookie. Hydrate the viewer the same way
    // login/signup do so the caller lands logged in. If the refresh itself fails (e.g.
    // running against the mock, which sets no real cookie), don't turn it into a
    // code-level error — the cookie is the source of truth and RequireViewer refetches.
    try {
      await apolloClient.query({ query: ViewerDocument, fetchPolicy: 'network-only' });
    } catch {
      // no-op: see comment above.
    }
    return result;
  };

  const logout = async (): Promise<void> => {
    await apiFetch('/auth/logout', { method: 'POST' });
    // clearStore (not resetStore): drop all cached data WITHOUT refetching active
    // queries. resetStore would immediately re-run every authenticated query against
    // the now-unauthenticated session, each throwing "Invalid access mode" server-side.
    await apolloClient.clearStore();
  };

  return (
    <AuthContext.Provider
      value={{
        login,
        publicAccess,
        logout,
        requestEmailVerification,
        completeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
