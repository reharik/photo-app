import { asValue, type AwilixContainer } from 'awilix';

import type { AppCradle } from '../di/generated/ioc-composed.js';
import type { LogContext } from '../types/logContext';

/**
 * Scope roots now take a `logContext` alongside `viewerId` / `publicLinkId` — it is what
 * `scopedLogger` is built from, and `uow` depends on `scopedLogger` transitively. Tests
 * that open a scope by hand mirror what the middleware (`apiRequestContextMiddleware`)
 * and the GraphQL plugin (`useScopedContainer`) build in production.
 */
export const createTestLogContext = (overrides: Partial<LogContext> = {}): LogContext => ({
  requestId: crypto.randomUUID(),
  service: 'api',
  ...overrides,
});

/**
 * A raw Awilix child scope with `logContext` registered, for tests that resolve scoped
 * services (`uow`, `authQueryService`, …) directly rather than through a generated
 * `open*Scope` root. Without the registration, resolution fails with
 * `Could not resolve 'logContext'` at the `scopedLogger` hop.
 *
 * The caller owns `scope.dispose()`.
 */
export const createTestScope = (
  container: AwilixContainer<AppCradle>,
  overrides: Partial<LogContext> = {},
): AwilixContainer<AppCradle & { logContext: LogContext }> => {
  const scope = container.createScope<{ logContext: LogContext }>();
  scope.register({ logContext: asValue(createTestLogContext(overrides)) });
  return scope;
};
