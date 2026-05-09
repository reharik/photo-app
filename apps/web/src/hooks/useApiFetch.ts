import { config } from '../config';
import type { ApiResult } from '../types/ApiResult';

type JsonInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/**
 * Base API fetch hook without auth context dependency
 * Used by AuthContext to avoid circular dependency
 */
export const useApiFetchBase = () => {
  const apiFetch = async <T = unknown>(
    path: string,
    init: JsonInit = {},
  ): Promise<ApiResult<T>> => {
    try {
      // Build the API URL
      const API = config.apiBaseUrl.endsWith('/')
        ? config.apiBaseUrl.slice(0, -1)
        : config.apiBaseUrl;
      const url = `${API}${path.startsWith('/') ? '' : '/'}${path}`;

      // Build the headers
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      };

      // Make the API call
      const response = await fetch(url, {
        credentials: 'include',
        ...init,
        headers,
        body: init.body ? JSON.stringify(init.body) : undefined,
      });

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return { apiFetch };
};

/**
 * API fetch hook with automatic auth token injection
 * Use this for authenticated API calls
 */
export const useApiFetch = () => {
  const apiFetch = async <T = unknown>(
    path: string,
    init: JsonInit = {},
  ): Promise<ApiResult<T>> => {
    try {
      // Build the API URL
      const API = config.apiBaseUrl.endsWith('/')
        ? config.apiBaseUrl.slice(0, -1)
        : config.apiBaseUrl;
      const url = `${API}${path.startsWith('/') ? '' : '/'}${path}`;
      // Build the headers
      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers as Record<string, string> | undefined),
      };

      // Make the API call
      const response = await fetch(url, {
        ...init,
        credentials: 'include',
        headers,
        body: init.body ? JSON.stringify(init.body) : undefined,
      });

      // Parse response
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return { apiFetch };
};
