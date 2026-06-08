import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Knex } from 'knex';

export const seed = async (knex: Knex): Promise<void> => {
  await knex('user').del();

  const devAdminId = crypto.randomUUID();
  const devSecondaryId = crypto.randomUUID();
  const e2eOwnerId = crypto.randomUUID();
  const e2eRecipientId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash('123123123', 12);

  await knex('user').insert([
    {
      id: devAdminId,
      email: 'harik.raif@gmail.com',
      firstName: 'Raif',
      lastName: 'Harik',
      passwordHash,
      emailVerified: true,
      createdBy: devAdminId,
      updatedBy: devAdminId,
    },
    {
      id: devSecondaryId,
      email: 'bubba.jones@gmail.com',
      firstName: 'Bubba',
      lastName: 'Jones',
      passwordHash,
      emailVerified: true,
      createdBy: devSecondaryId,
      updatedBy: devSecondaryId,
    },
    {
      id: e2eOwnerId,
      email: 'tester.one@gmail.com',
      firstName: 'E2e',
      lastName: 'Owner',
      passwordHash,
      emailVerified: true,
      createdBy: e2eOwnerId,
      updatedBy: e2eOwnerId,
    },
    {
      id: e2eRecipientId,
      email: 'two.tester@gmail.com',
      firstName: 'E2e',
      lastName: 'Recipient',
      passwordHash,
      emailVerified: true,
      createdBy: e2eRecipientId,
      updatedBy: e2eRecipientId,
    },
  ]);
};
