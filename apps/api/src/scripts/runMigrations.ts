import knex from 'knex';
import { knexConfig } from '../knexfile';
import { dumpToS3 } from './dumpToS3'; // +

const runMigrations = async () => {
  const db = knex(knexConfig);
  try {
    const [, pending] = await db.migrate.list(); // +  same knex instance that migrates
    if (pending.length) {
      // +  can't drift, can't spam on restart
      console.log(`${pending.length} pending migration(s) — pre-migration backup...`);
      await dumpToS3('pre-migration'); // +  throws → caught below → exit(1) → app never starts
    } // +
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
