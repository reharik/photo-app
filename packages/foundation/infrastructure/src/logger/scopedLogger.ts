import { Logger, ScopedLogger } from './coreLogger';
type ScopedLoggerDeps = { logger: Logger; logContext: Record<string, unknown> };

export const build__ScopedLogger = ({ logger, logContext }: ScopedLoggerDeps): ScopedLogger =>
  logger.child(logContext);
