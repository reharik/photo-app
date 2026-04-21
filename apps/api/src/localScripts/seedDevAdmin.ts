/**
 * Dev-only script: seeds a single admin user (admin / 123123123).
 * Not part of db seeds — do not run in production.
 * Run via: npm run seed:dev-admin (from repo root) or npm run seed:dev-admin --workspace=@app/api (from api).
 */
import bcrypt from 'bcryptjs';
import knex from 'knex';
import { knexConfig } from '../knexfile';

const DEV_ADMIN_EMAIL = 'harik.raif@gmail.com';
const DEV_ADMIN_PASSWORD = '123123123';

const seedDevAdmin = async (): Promise<void> => {
  const db = knex(knexConfig);
  try {
    const existing = await db('user').where({ email: DEV_ADMIN_EMAIL }).first<{ id: string }>();
    if (existing) {
      console.log('Dev admin user already exists (email: %s). Skipping.', DEV_ADMIN_EMAIL);
      await db.destroy();
      process.exit(0);
      return;
    }
    const passwordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, 12);
    const userId = crypto.randomUUID();
    await db('user').insert({
      id: userId,
      email: DEV_ADMIN_EMAIL,
      passwordHash,
      firstName: 'Raif',
      lastName: 'Harik',
      emailVerified: true,
      createdBy: userId,
      updatedBy: userId,
    });

    console.log('Dev admin user created: %s / %s', DEV_ADMIN_EMAIL, DEV_ADMIN_PASSWORD);
    await db.destroy();
    process.exit(0);
  } catch (err) {
    console.error('seedDevAdmin failed:', err);
    await db.destroy();
    process.exit(1);
  }
};

void seedDevAdmin();
