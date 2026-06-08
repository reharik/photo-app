export type Config = {
  apiBaseUrl: string;
};

export const config: Config = {
  // VITE_API: API base path/prefix. Default `/api` (Vite dev proxy + production Caddy).
  // Must include the `/api` segment — auth and GraphQL paths append `/auth/...`, `/graphql`.
  apiBaseUrl: (import.meta.env.VITE_API || '/api') as string,
};
