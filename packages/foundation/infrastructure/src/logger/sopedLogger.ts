import { Logger, ScopedLogger } from './coreLogger';

type ScopedLoggerDeps = { rootLogger: Logger; scopeId: string };

export const build__ScopedLogger = ({ rootLogger, scopeId }: ScopedLoggerDeps): ScopedLogger =>
  rootLogger.child({ scopeId });
