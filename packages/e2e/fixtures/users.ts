/**
 * Test user credentials. These match `apps/api/db/seeds/01_user.ts`.
 * Run `npm run db:seed:local --workspace=@app/api` against your local
 * database before running these tests if the seed has not been applied.
 */
export type TestUser = {
  email: string;
  password: string;
  displayName: string;
};

export const USER_A: TestUser = {
  email: 'harik.raif@gmail.com',
  password: '123123123',
  displayName: 'Raif',
};

export const USER_B: TestUser = {
  email: 'bubba.jones@gmail.com',
  password: '123123123',
  displayName: 'User',
};
