import { SYSTEM_ACTOR_ID } from '@packages/contracts';
import knex from 'knex';
import { knexConfig } from '../knexfile';

const detectIfSeedsHaveBeenRun = async () => {
  const db = knex(knexConfig);
  // Exclude the system actor row. It is seeded by migration 0030, not by
  // `db.seed.run()`, so on a fresh database it is present before seeding has
  // ever happened — counting it would make this guard report "already seeded"
  // and silently skip dev/e2e seeding entirely.
  const result = await db('user').whereNot('id', SYSTEM_ACTOR_ID).count('* as count').first();
  return Number(result?.count || 0) > 0;
};

const runSeeds = async () => {
  const db = knex(knexConfig);

  try {
    console.log('Detecting if seed have been run...');
    const seedsHaveBeenRun = await detectIfSeedsHaveBeenRun();
    if (seedsHaveBeenRun) {
      console.log('Seeds have already been run, skipping...');
      await db.destroy();
      process.exit(0);
    }
    console.log('Running database seeds...');
    await db.seed.run();
    console.log('Seeds completed successfully');
    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    await db.destroy();
    process.exit(1);
  }
};

void runSeeds();
