import { createLogger, format, transports, type Logger as WinstonLogger } from 'winston';

type Level = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';

interface ErrorWithResponse extends Error {
  response?: {
    data?: unknown;
    status?: number;
    headers?: unknown;
  };
}

type LogMeta = Record<string, unknown>;

type ErrorLogger = {
  (message: string): void;
  (message: string, err: Error): void;
  (message: string, meta: LogMeta): void;
  (message: string, err: Error, meta: LogMeta): void;
};

export type Logger = {
  error: ErrorLogger;
  warn: (message: string, meta?: unknown) => void;
  info: (message: string, meta?: unknown) => void;
  http: (message: string, meta?: unknown) => void;
  verbose: (message: string, meta?: unknown) => void;
  debug: (message: string, meta?: unknown) => void;
};

export type LoggerConfig = {
  logLevel: Level;
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
  format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSS ZZ' }), humanReadableFormat);

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
  format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSSS ZZ' }),
    jsonErrorFormatter(),
    format.json(),
  );

let appLogger: WinstonLogger;

export const build__Logger = ({ config }: LoggerDeps): Logger =>
  coreLogger({
    logJsonFilePath: config.logJsonFilePath,
    logLevel: config.logLevel,
  });

export const coreLogger = ({
  logJsonFilePath,
  logLevel,
}: {
  logJsonFilePath?: string;
  logLevel: string;
}): Logger => {
  const loggerTransports: WinstonLogger['transports'] = [
    new transports.Console({
      stderrLevels: ['error'],
      handleExceptions: true,
      format: createConsoleFormat(),
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

  appLogger = createLogger({
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
    exitOnError: false,
  });

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

    appLogger.log(level, message, payload);
  };

  const error: ErrorLogger = (message: string, errorOrMeta?: Error | LogMeta, meta?: LogMeta) => {
    if (errorOrMeta instanceof Error) {
      logMessage('error', message, meta, errorOrMeta);
      return;
    }

    logMessage('error', message, errorOrMeta);
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

  return { error, warn, info, http, verbose, debug };
};
