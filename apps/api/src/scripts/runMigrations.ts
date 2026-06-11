import knex from 'knex';
import { knexConfig } from '../knexfile';

const runMigrations = async () => {
  const db = knex(knexConfig);

  try {
    console.log('Running database migrations...');
    await db.migrate.latest();
    console.log('Migrations completed successfully');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await db.destroy();
    process.exit(1);
  }
};

void runMigrations();
