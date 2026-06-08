/**
 * E2e-only users from `apps/api/db/seeds/01_user.ts` (separate from the
 * manual dev accounts). Run `npm run db:seed:local --workspace=@app/api`
 * if these users are missing.
 */
export type TestUser = {
  email: string;
  password: string;
  displayName: string;
};

/** Primary test actor — creates albums, uploads media, shares items. */
export const USER_A: TestUser = {
  email: 'tester.one@gmail.com',
  password: '123123123',
  displayName: 'E2e Owner',
};

/** Secondary actor — receives shares and exercises recipient flows. */
export const USER_B: TestUser = {
  email: 'two.tester@gmail.com',
  password: '123123123',
  displayName: 'E2e Recipient',
};
