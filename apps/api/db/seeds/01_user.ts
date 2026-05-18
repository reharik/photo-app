import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Knex } from 'knex';

export const seed = async (knex: Knex): Promise<void> => {
  await knex('user').del();

  const userId = crypto.randomUUID();
  const userId2 = crypto.randomUUID();
  const passwordHash = await bcrypt.hash('123123123', 12);

  await knex('user').insert([
    {
      id: userId,
      email: 'harik.raif@gmail.com',
      firstName: 'Raif',
      lastName: 'Harik',
      passwordHash,
      emailVerified: true,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: userId2,
      email: 'bubba.jones@gmail.com',
      firstName: 'User',
      lastName: 'Two',
      passwordHash,
      emailVerified: true,
      createdBy: userId2,
      updatedBy: userId2,
    },
  ]);
};
