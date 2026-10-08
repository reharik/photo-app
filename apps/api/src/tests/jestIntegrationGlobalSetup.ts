import { execFileSync } from 'node:child_process';
import path from 'node:path';

import { config as loadDotEnv } from 'dotenv';
import knex from 'knex';

import { INTEGRATION_TEST_DATABASE } from './integrationTestDatabase';

/**
 * Creates the integration test database if it is missing and migrates it to latest.
 *
 * Jest transpiles this file to CJS, so it must not import the knexfile (it uses
 * `import.meta.url`). The migrations are therefore run by the same CLI command as
 * `nx run api:db:migrate`, in a child process: knex loads `.ts` migrations with a native
 * `import()` that needs the tsx loader, which this process does not have.
 */
const globalSetup = async (
  _globalConfig: unknown,
  projectConfig: { rootDir: string },
): Promise<void> => {
  const apiRoot = projectConfig.rootDir;

  // Connection settings only. Read into a local object rather than process.env so this
  // has no side effects on the test run; real env vars (CI) win over the file.
  const fileEnv: Record<string, string> = {};
  loadDotEnv({ path: path.resolve(apiRoot, '.env'), processEnv: fileEnv });
  const env = { ...fileEnv, ...process.env };

  const admin = knex({
    client: 'pg',
    connection: {
      host: env.POSTGRES_HOST || '127.0.0.1',
      port: Number(env.POSTGRES_PORT || 5432),
      user: env.POSTGRES_USER || 'postgres',
      password: env.POSTGRES_PASSWORD || '',
      database: 'postgres',
    },
  });
  try {
    const existing: unknown = await admin('pg_database')
      .where({ datname: INTEGRATION_TEST_DATABASE })
      .first('datname');
    if (existing === undefined) {
      await admin.raw('CREATE DATABASE ??', [INTEGRATION_TEST_DATABASE]);
    }
  } finally {
    await admin.destroy();
  }

  execFileSync('npx', ['knex', '--knexfile', 'src/knexfile.ts', 'migrate:latest'], {
    cwd: apiRoot,
    env: { ...env, NODE_OPTIONS: '--import=tsx', POSTGRES_DB: INTEGRATION_TEST_DATABASE },
    stdio: 'inherit',
  });
};

export default globalSetup;
