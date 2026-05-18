/**
 * Records migration files as applied without executing `up` ("fake" baseline).
 *
 * Use after consolidating migrations when the database schema already matches the
 * files under `apps/api/db/migrations` (e.g. you previously ran the old chain and
 * only cleared `knex_migrations`). If tables are missing or drifted, use a normal
 * migrate from empty DB instead.
 *
 * Run: npm run db:baseline:migrations --workspace=@app/api
 * Or from repo root: npm run db:baseline:migrations
 */
import fs from 'fs';
import knex from 'knex';
import { knexConfig } from '../knexfile';

const BASELINE_SOURCE = 'baselineKnexMigrations.ts';

const parseNextBatchFromAggregateRow = (row: unknown): number => {
  if (typeof row !== 'object' || row === null || !('nextBatch' in row)) {
    return Number.NaN;
  }
  const value = row.nextBatch;
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return Number.NaN;
};

const resolveMigrationFilenames = (): string[] => {
  const directory = knexConfig.migrations?.directory;
  const extension = knexConfig.migrations?.extension;
  if (typeof directory !== 'string' || typeof extension !== 'string') {
    throw new Error('knexConfig.migrations.directory and extension must be set.');
  }
  if (!fs.existsSync(directory)) {
    throw new Error(`Migration directory missing: ${directory}`);
  }
  const suffix = `.${extension}`;
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(suffix))
    .sort();
};

const ensureMigrationInfrastructure = async (
  db: knex.Knex,
  migrateTable: string,
  lockTable: string,
): Promise<void> => {
  const hasMigrateTable = await db.schema.hasTable(migrateTable);
  if (!hasMigrateTable) {
    await db.schema.createTable(migrateTable, (t) => {
      t.increments('id');
      t.string('name');
      t.integer('batch');
      t.timestamp('migration_time');
    });
  }

  const hasLockTable = await db.schema.hasTable(lockTable);
  if (!hasLockTable) {
    await db.schema.createTable(lockTable, (t) => {
      t.increments('index').primary();
      t.integer('is_locked');
    });
  }

  const lockRows = await db(lockTable).select('*').limit(1);
  if (lockRows.length === 0) {
    await db(lockTable).insert({ isLocked: 0 });
  }
};

const baselineKnexMigrations = async (): Promise<void> => {
  const migrateTable = knexConfig.migrations?.tableName ?? 'knex_migrations';
  const lockTable = `${migrateTable}_lock`;
  const filenames = resolveMigrationFilenames();

  if (filenames.length === 0) {
    throw new Error('No migration files found for current knex extension.');
  }

  const db = knex(knexConfig);
  try {
    await ensureMigrationInfrastructure(db, migrateTable, lockTable);

    const aggregateRows = await db(migrateTable).select(
      db.raw('(COALESCE(MAX(batch), 0) + 1)::int AS next_batch'),
    );
    const batch = parseNextBatchFromAggregateRow(aggregateRows[0]);
    if (!Number.isFinite(batch)) {
      throw new Error('Could not compute next migration batch.');
    }

    let inserted = 0;
    let skipped = 0;

    for (const name of filenames) {
      const existing = await db(migrateTable).where({ name }).first<{ id: number }>();
      if (existing !== undefined) {
        skipped += 1;
        console.log('Already recorded: %s (batch skipped)', name);
        continue;
      }

      await db(migrateTable).insert({
        name,
        batch,
        migrationTime: db.fn.now(),
      });
      inserted += 1;
      console.log('Recorded as applied: %s (batch %d)', name, batch);
    }

    console.log(
      'Done (%s). Inserted %d, skipped %d. Filenames match knexConfig.migrations.directory.',
      BASELINE_SOURCE,
      inserted,
      skipped,
    );
    await db.destroy();
    process.exit(0);
  } catch (err) {
    console.error('baselineKnexMigrations failed:', err);
    await db.destroy();
    process.exit(1);
  }
};

void baselineKnexMigrations();
