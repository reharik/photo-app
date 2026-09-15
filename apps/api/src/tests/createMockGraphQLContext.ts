import { TEST_VIEWER_1_ID } from './testViewerIds';

const defaultTestViewerUser = {
  id: TEST_VIEWER_1_ID,
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@example.com',
};

/**
 * Mirrors Koa `ctx.state` for `buildCreateGraphQLContext`. Uses strict `isLoggedIn === true`
 * so only an explicit boolean `true` enables the viewer (avoids truthy surprises).
 */
export const createMockGraphQLContext = (overrides: Record<string, unknown> = {}) => {
  const isLoggedIn = overrides.isLoggedIn === true;
  const userFromOverrides =
    typeof overrides.user === 'object' && overrides.user !== null
      ? (overrides.user as Record<string, string | undefined>)
      : undefined;

  return {
    state: {
      // `requestId` is set by requestIdMiddleware before anything else in the real
      // pipeline, and useScopedContainer reads it to build the scope's logContext.
      // Default one here so the scoped logger is correlated in tests too.
      requestId: crypto.randomUUID(),
      ...overrides,
      isLoggedIn,
      user: isLoggedIn ? { ...defaultTestViewerUser, ...userFromOverrides } : undefined,
    },
  };
};
