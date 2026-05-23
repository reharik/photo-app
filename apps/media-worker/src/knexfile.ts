import { createSmartEnumPostProcessResponse } from '@reharik/smart-enum-knex';
import type { Knex } from 'knex';
import knexStringcase from 'knex-stringcase';
import path from 'path';
import { fileURLToPath } from 'url';
import { build__Config, type Config } from './config';
import type { AppCradle } from './generated/ioc-composed.js';
import { configurePostgresTypes } from './infrastructure/database/configurePostgresTypes';

// knex-stringcase runs its pipeline as: optional postProcessResponse → camelCase keys → appPostProcessResponse.
// We run null→undefined first, then @reharik/smart-enum-knex (reads queryContext from withEnumRevival on a query).
const smartEnumPostProcessResponse = createSmartEnumPostProcessResponse();

export type KnexConfig = Knex.Config;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert null values to undefined in query results while preserving Date objects.
// Runs after knex-stringcase (so keys are already camelCase).
const convertNullsToUndefined = (obj: unknown): unknown => {
  if (obj === null) return undefined;
  if (obj instanceof Date) return obj; // Preserve Date objects
  if (Array.isArray(obj)) return obj.map(convertNullsToUndefined);
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convertNullsToUndefined(value)]),
    );
  }
  return obj;
};

const createKnexConfig = (config: Config): KnexConfig => {
  const isCompiled = path.basename(__dirname) === 'dist';
  const ROOT = isCompiled ? __dirname : path.resolve(__dirname, '..');
  const MIGRATIONS_DIR = path.join(ROOT, 'db/migrations');
  const SEEDS_DIR = path.join(ROOT, 'db/seeds');

  const connection: Knex.StaticConnectionConfig = {
    host: config.postgresHost,
    port: config.postgresPort,
    user: config.postgresUser,
    password: config.postgresPassword,
    database: config.postgresDatabase,
  };

  configurePostgresTypes();

  return {
    client: 'pg',
    connection,
    ...knexStringcase({
      appPostProcessResponse: (result: unknown, queryContext?: unknown): unknown => {
        const processed = convertNullsToUndefined(result);
        const fn = smartEnumPostProcessResponse;
        if (fn === undefined) {
          return undefined;
        }
        return fn(processed, queryContext) as unknown;
      },
    }),
    migrations: {
      directory: MIGRATIONS_DIR,
      tableName: 'knex_migrations',
      extension: isCompiled ? 'js' : 'ts',
    },
    seeds: {
      directory: SEEDS_DIR,
      extension: isCompiled ? 'js' : 'ts',
    },
  };
};

export const build__KnexConfig = ({ config }: AppCradle): KnexConfig => {
  return createKnexConfig(config);
};

export const knexConfig: KnexConfig = createKnexConfig(build__Config());

export default knexConfig;
