import { createLogger, format, transports, type Logger as WinstonLogger } from 'winston';
import { RequestScopeLifeCycle } from '../requestScopeLifeCycle';

type Level = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';

interface ErrorWithResponse extends Error {
  response?: {
    data?: unknown;
    status?: number;
    headers?: unknown;
  };
}

type LogMeta = Record<string, unknown>;

export type ErrorLogger = {
  (message: string): void;
  (message: string, err: unknown): void;
  (message: string, meta: LogMeta): void;
  (message: string, err: unknown, meta: LogMeta): void;
};

export type LoggerShape = {
  error: ErrorLogger;
  warn: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  http: (message: string, meta?: unknown) => void;
  verbose: (message: string, meta?: unknown) => void;
  debug: (message: string, meta?: unknown) => void;
};
export interface Logger extends LoggerShape {
  child: (meta: Record<string, unknown>) => Logger;
}
export interface ScopedLogger extends LoggerShape, RequestScopeLifeCycle {
  child: (meta: Record<string, unknown>) => ScopedLogger;
}

export type LoggerConfig = {
  logLevel: Level;
  logFormat: 'json' | 'human';
  logJsonFilePath?: string;
};
export type LoggerDeps = {
  config: LoggerConfig;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return value != null && typeof value === 'object' && !Array.isArray(value);
};

const isErrorWithResponse = (err: unknown): err is ErrorWithResponse => {
  return (
    err instanceof Error &&
    'response' in err &&
    err.response != null &&
    typeof err.response === 'object'
  );
};

const extractErrorMeta = (err: Error): LogMeta => {
  const meta: LogMeta = {
    name: err.name,
    message: err.message,
  };

  if (isErrorWithResponse(err)) {
    meta.response = {
      status: err.response?.status,
      data: err.response?.data,
      headers: err.response?.headers,
    };
  }

  return meta;
};

const toError = (e: unknown): Error =>
  e instanceof Error ? e : new Error(typeof e === 'string' ? e : JSON.stringify(e));

const humanReadableFormat = format.printf((info) => {
  const { timestamp, level, message, err, ...rest } = info as {
    timestamp?: string;
    level: string;
    message: string;
    err?: Error;
    [key: string]: unknown;
  };

  const header = `${timestamp ?? ''} ${level}: ${message}`.trim();

  const errorBlock = err instanceof Error ? `\n${err.stack ?? `${err.name}: ${err.message}`}` : '';

  const meta = Object.keys(rest).length > 0 ? `\n${JSON.stringify(rest, null, 2)}` : '';

  return `${header}${errorBlock}${meta}`;
});

const createConsoleFormat = () =>
  format.combine(
    format.errors({ stack: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSS ZZ' }),
    humanReadableFormat,
  );

const jsonErrorFormatter = format((info) => {
  const typed = info as typeof info & { err?: unknown; stack?: unknown };

  if (typed.err instanceof Error) {
    const err = typed.err;
    const meta = extractErrorMeta(err);

    typed.err = meta;
    typed.stack = typed.stack ?? err.stack ?? undefined;
  }

  return typed;
});

const createJsonFormat = () =>
  format.combine(format.errors({ stack: true }), jsonErrorFormatter(), format.json());

const wrap = (w: WinstonLogger): Logger => {
  const logMessage = (level: Level, message: string, meta?: unknown, err?: Error) => {
    const payload: Record<string, unknown> = {};

    if (isPlainObject(meta)) {
      Object.assign(payload, meta);
    } else if (meta !== undefined) {
      payload.data = meta;
    }

    if (err) {
      payload.err = err;
    }
    w.log(level, message, payload);
  };

  const error: ErrorLogger = (message: string, errorOrMeta?: unknown, meta?: LogMeta) => {
    if (meta === undefined && isPlainObject(errorOrMeta)) {
      logMessage('error', message, errorOrMeta);
      return;
    }
    if (errorOrMeta === undefined) {
      logMessage('error', message);
      return;
    }
    logMessage('error', message, meta, toError(errorOrMeta));
  };

  const warn = (message: string, meta?: unknown) => {
    logMessage('warn', message, meta);
  };

  const info = (message: string, meta?: unknown) => {
    logMessage('info', message, meta);
  };

  const http = (message: string, meta?: unknown) => {
    logMessage('http', message, meta);
  };

  const verbose = (message: string, meta?: unknown) => {
    logMessage('verbose', message, meta);
  };

  const debug = (message: string, meta?: unknown) => {
    logMessage('debug', message, meta);
  };

  return { error, warn, info, http, verbose, debug, child: (meta) => wrap(w.child(meta)) };
};

export const build__Logger = ({ config }: LoggerDeps): Logger =>
  coreLogger({
    logJsonFilePath: config.logJsonFilePath,
    logLevel: config.logLevel,
    logFormat: config.logFormat,
  });

export const coreLogger = ({
  logJsonFilePath,
  logLevel,
  logFormat,
}: {
  logJsonFilePath?: string;
  logLevel: string;
  logFormat: string;
}): Logger => {
  const loggerTransports: WinstonLogger['transports'] = [
    new transports.Console({
      stderrLevels: ['error'],
      handleExceptions: true,
      format: logFormat === 'json' ? createJsonFormat() : createConsoleFormat(),
    }),
  ];

  if (logJsonFilePath) {
    loggerTransports.push(
      new transports.File({
        filename: logJsonFilePath,
        level: logLevel,
        handleExceptions: true,
        format: createJsonFormat(),
      }),
    );
  }

  const appLogger = createLogger({
    level: logLevel,
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      verbose: 4,
      debug: 5,
    },
    transports: loggerTransports,
    /**
     * Winston's default, restated explicitly because the non-default was
     * load-bearing in the worst way.
     *
     * This was `false` from commit 32854e37 (a broad IoC refactor) with no
     * comment, test or commit-message rationale -- nothing recorded that it was
     * ever a deliberate choice. What it did: `handleExceptions: true` above
     * installs winston's uncaughtException handler, and Node routes an unhandled
     * promise rejection through that same path. With `exitOnError: false`
     * winston caught the exception, logged it, and declined to exit -- so a
     * process that threw outside a try (the media-worker's fail-fast startup
     * probe, for one) logged a fatal error and then exited ZERO, which reads as
     * a clean shutdown to anything checking status.
     *
     * With `true`, winston exits 1 after giving the transports a chance to
     * drain. That drain is NOT gated on a real flush -- it listens for `finish`,
     * which the Console transport never emits -- so the exit actually comes from
     * winston's own 3000ms backstop (exception-handler.js). Measured, that is
     * ample: a 500KB line through a deliberately throttled pipe still arrives
     * complete. So the truncated-async-stdout hazard documented on `mark()` in
     * each app's attachGlobalHandlers does NOT apply here; the cost is that a
     * fail-fast boot takes ~3s to die.
     *
     * This does NOT change the api's unhandled-REJECTION path: api's
     * attachGlobalHandlers registers its own `unhandledRejection` listener,
     * which suppresses Node's escalation to uncaughtException, so winston never
     * sees those. It DOES change the api's genuine uncaughtException path from
     * "log and keep serving" to "log and exit 1", skipping its graceful drain --
     * correct for a process in unknown state, and `restart: unless-stopped`
     * brings it back.
     */
    exitOnError: true,
  });

  return wrap(appLogger);
};
