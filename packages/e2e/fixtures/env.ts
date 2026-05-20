import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Environment configuration for the e2e package.
 *
 * Defaults match the workspace dev scripts (web on :5173, api on :3001,
 * local Postgres as configured in `apps/api/.env`). The api's `.env`
 * file is loaded automatically so the e2e package picks up whatever
 * the running api is using without having to duplicate the config.
 * Anything in `process.env` (including `E2E_*` overrides) wins over
 * the .env file.
 */
export type Env = {
  webBaseUrl: string;
  apiBaseUrl: string;
  graphqlUrl: string;
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
};

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Minimal `.env` parser: `KEY=VALUE` per line, `#` comments, ignores blanks. */
const parseDotEnv = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const loadApiEnvFile = (): Record<string, string> => {
  const path = resolve(__dirname, '../../../apps/api/.env');
  try {
    return parseDotEnv(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
};

const fileEnv = loadApiEnvFile();

const lookup = (key: string, fallback: string): string => {
  const fromProcess = process.env[key];
  if (fromProcess !== undefined && fromProcess.length > 0) return fromProcess;
  const fromFile = fileEnv[key];
  if (fromFile !== undefined && fromFile.length > 0) return fromFile;
  return fallback;
};

const webBaseUrl = lookup('E2E_WEB_BASE_URL', 'http://localhost:5173').replace(/\/$/, '');
const apiBaseUrl = lookup('E2E_API_BASE_URL', `http://localhost:${lookup('API_PORT', '3001')}`)
  .replace(/\/$/, '');

export const env: Env = {
  webBaseUrl,
  apiBaseUrl,
  graphqlUrl: `${apiBaseUrl}/api/graphql`,
  postgres: {
    host: lookup('POSTGRES_HOST', '127.0.0.1'),
    port: Number(lookup('POSTGRES_PORT', '5432')),
    user: lookup('POSTGRES_USER', 'postgres'),
    password: lookup('POSTGRES_PASSWORD', ''),
    database: lookup('POSTGRES_DB', 'photo_app'),
  },
};
