/* AUTO-GENERATED. DO NOT EDIT.
Re-run `npm run gen:manifest` after changing factories or IoC config.
*/
import type { Knex } from 'knex';
import type { Logger, LoggerConfig } from '../logger/coreLogger.js';
import type { RateLimiter } from '../rateLimiter/rateLimiter.js';

export interface IocGeneratedCradle {
  logger: Logger;
  rateLimiter: RateLimiter;
}

export interface IocExternals {
  config: LoggerConfig;
  database: Knex<any, any[]>;
}

export interface IocScopeProvided {}
