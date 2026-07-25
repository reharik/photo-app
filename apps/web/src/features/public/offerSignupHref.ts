import { safeReturnTo } from '../auth/safeReturnTo';

/**
 * The /signup URL the public-album offer hands off to.
 *
 * The email field is a COURIER, not a gate. Whatever she typed is passed verbatim — no
 * trim, no shape check, no "that doesn't look like an email" — so a bad address produces
 * exactly the same error, on the same screen, as typing it into the signup form directly.
 * Validating here would invent a second, worse rejection path for the same mistake.
 *
 * `autoSubmit=1` asks the signup door to fire its email step on arrival, so she lands on
 * the code screen ("we sent a code to …") instead of a pre-filled form she has to submit
 * a second time. The signup screen owns that behavior: it fires at most once per mount,
 * only with a non-empty email, and through its NORMAL submit handler — so an auto-fire
 * consumes the same per-IP and per-email rate-limit buckets as a manual click and cannot
 * fan out code-sends faster than a person could.
 *
 * `returnTo` is built from our own trusted album id but still goes through the shared
 * `safeReturnTo` whitelist — one source of truth — and /signup re-validates it on
 * consumption regardless. URLSearchParams percent-encodes every value.
 */
export const buildOfferSignupHref = (albumId: string, email: string): string => {
  const params = new URLSearchParams({
    email,
    autoSubmit: '1',
    returnTo: safeReturnTo(`/albums/${albumId}`),
  });
  return `/signup?${params.toString()}`;
};
