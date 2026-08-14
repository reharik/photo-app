import { expectLoggedIn } from '../../fixtures/authFlows';
import { expect, test } from '../../fixtures/test';

/**
 * A1 — the login SCREEN as a subject (not the `loginViaApi`/`loginViaUi` setup helpers).
 *
 * JOURNEY, one screen visit: every outcome lands on the same recoverable /login screen, so
 * a real user reaches the happy path by correcting the field they got wrong. The existence-
 * blind guarantee — unknown-email and wrong-password return the IDENTICAL message — is proven
 * by capturing both strings and asserting they match, then the corrected password logs in.
 *
 * The login rate-limit ("Too many attempts", 5 / 15 min) is deliberately NOT exercised here:
 * provoking it needs five real submissions and pollutes the shared `rate_limit_event` table
 * for little branch value over the wrong/unknown/valid outcomes below. The three attempts
 * this journey makes land on a per-test fresh email, so no reset is needed either.
 *
 * `userA` supplies the real account (created fresh for this test); the form itself is
 * driven on the anonymous page.
 */
test.describe('Login screen', () => {
  test('rejects bad credentials existence-blindly, then a correct password logs in', async ({
    userA,
    anonPage,
  }) => {
    await anonPage.goto('/login');
    const email = anonPage.getByTestId('login-email');
    const password = anonPage.getByTestId('login-password');
    const signIn = anonPage.getByRole('button', { name: 'Sign In' });
    // The exact server message, existence-blind for both failure modes below. Asserting the
    // SAME exact string in each step is the guard: if unknown-email ever gets its own copy,
    // one of these `getByText` waits fails and the leak is caught.
    const errorText = anonPage.getByText('Invalid email or password', { exact: true });

    await test.step('Unknown email is rejected and stays on /login', async () => {
      await email.fill(`no-such-user-${Date.now()}@example.test`);
      await password.fill('whatever123');
      await signIn.click();
      await expect(errorText).toBeVisible();
      await expect(anonPage).toHaveURL(/\/login$/);
    });

    await test.step('Wrong password for a REAL email returns the identical message', async () => {
      await email.fill(userA.user.email);
      await password.fill('definitely-the-wrong-password');
      await signIn.click();
      await expect(errorText).toBeVisible();
      await expect(anonPage).toHaveURL(/\/login$/);
    });

    await test.step('Correct credentials log in', async () => {
      await password.fill(userA.user.password);
      await signIn.click();
      await expectLoggedIn(anonPage);
    });
  });
});
