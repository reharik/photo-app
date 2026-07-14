/**
 * Reusable rate limiter — Postgres-backed, keyed by (bucket, key).
 *
 * Designed as a general primitive, NOT welded to email verification:
 *   - `bucket` namespaces the use case  ('email_verification:issue', 'login:attempt', ...)
 *   - `key`    is the throttled identifier (normalized email, IP, userId, ...)
 *   - `rule`   is per-caller config (limit + window)
 *
 * Backing table `rate_limit_event(id, bucket, key, created_at)` — created by the
 * migration CC is writing. Requires a periodic sweep (delete created_at < now() - maxWindow);
 * there is no FK cascade to clean it.
 *
 */

import type { Knex } from 'knex';

export interface RateLimitRule {
  /** max events allowed within the window (inclusive) */
  limit: number;
  /** window length in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** events left in the current window after this one (0 when denied) */
  remaining: number;
  /** ms until the window frees up (null when allowed) */
  retryAfterMs: number | null;
}

export interface RateLimiter {
  consume: (bucket: string, key: string, rule: RateLimitRule) => Promise<RateLimitResult>;
}

type RateLimiterDeps = { database: Knex };

export const build__RateLimiter = ({ database }: RateLimiterDeps): RateLimiter => {
  /**
   * Record an attempt and report whether it's within the limit.
   *
   * Semantics: **insert-then-count**. Every call inserts a row, then counts rows
   * in the window (including the one just inserted). This is deliberate — denied
   * attempts still count, so hammering keeps the counter pinned instead of letting
   * it drain. `limit` is inclusive: limit=3 allows exactly 3 in the window, denies the 4th.
   */
  const consume = async (
    bucket: string,
    key: string,
    rule: RateLimitRule,
  ): Promise<RateLimitResult> => {
    const now = Date.now();
    const since = new Date(now - rule.windowMs);

    // Always record the attempt (denied ones count too).
    await database('rateLimitEvent').insert({ bucket, key });

    const rows = await database('rateLimitEvent')
      .where({ bucket, key })
      .andWhere('createdAt', '>', since)
      .orderBy('createdAt', 'asc')
      .select('createdAt');

    const used = rows.length;

    if (used > rule.limit) {
      // window is full — free space opens when the oldest in-window event ages out
      const oldest = rows[0]?.createdAt;
      const oldestMs = oldest ? new Date(oldest).getTime() : now;
      const retryAfterMs = Math.max(oldestMs + rule.windowMs - now, 0);
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    return { allowed: true, remaining: rule.limit - used, retryAfterMs: null };
  };
  return { consume };
};

export const EMAIL_VERIFICATION_LIMITS = {
  /** per normalized email — allows a couple of legit resends, blocks mail-bombing one address */
  perEmail: { limit: 5, windowMs: 15 * 60_000 } satisfies RateLimitRule,
  /**
   * per IP — guards enumeration / bulk abuse from one source.
   * ⚠️ A whole household behind one router shares an IP. Keep this generous
   * enough that a family passing the app around doesn't trip it.
   */
  perIp: { limit: 30, windowMs: 15 * 60_000 } satisfies RateLimitRule,
} as const;

/* ------------------------------------------------------------------ *
 * Integration — how verifyEmail uses it. Two buckets: email + IP.
 * Stays existence-blind: on throttle we DON'T reveal anything; we just
 * skip issuing and return the same 200 the happy path returns.
 * ------------------------------------------------------------------ */

// inside authService.emailVerification(email, ip) — sketch, adapt to your signatures:
//
//   const normalized = email.trim().toLowerCase();   // MUST match the normalization
//                                                     // setPassword uses, or codes won't validate
//
//   const [byEmail, byIp] = await Promise.all([
//     rateLimiter.consume('email_verification:issue', normalized, EMAIL_VERIFICATION_LIMITS.perEmail),
//     rateLimiter.consume('email_verification:ip', ip,          EMAIL_VERIFICATION_LIMITS.perIp),
//   ]);
//
//   if (!byEmail.allowed || !byIp.allowed) {
//     // Silently skip issuing. Controller still returns the same blind 200
//     // ("we sent you a code"). Do NOT surface a 429 here — a different status
//     // for throttled-vs-not is itself an observable signal on a public endpoint.
//     return;
//   }
//
//   // ...generate code, hash, store in email_verification keyed by `normalized`, send email

/* ------------------------------------------------------------------ *
 * Notes / tradeoffs (read before reusing elsewhere)
 * ------------------------------------------------------------------ *
 *
 * 1. RACE: count-after-insert is not fully atomic under high concurrency — two
 *    simultaneous requests can both slip through at the boundary (slight
 *    over-admission). Fine for abuse throttling; a throttle doesn't need to be
 *    exact. If you ever need hard exactness (e.g. billing), upgrade to a
 *    transaction with `SELECT ... FOR UPDATE` on a per-(bucket,key) counter row,
 *    or a Postgres advisory lock keyed on hash(bucket,key). Don't bother for auth.
 *
 * 2. GROWTH: denied attempts insert rows too, so a sustained attack inflates the
 *    table. Bounded by request rate and reaped by the sweep. Keep the sweep's
 *    horizon >= the largest windowMs you use across all buckets, or you'll delete
 *    in-window events and under-count.
 *
 * 3. BLINDNESS: never let a throttle change an endpoint's *response shape* on a
 *    public/unauthenticated route. Throttle by skipping work, not by returning a
 *    distinguishable error — otherwise the limiter becomes the oracle the rest of
 *    the design worked to remove. (Authenticated endpoints can safely 429.)
 *
 * 4. REUSE: the primitive is bucket+key+rule. For login throttling:
 *      rateLimiter.consume('login:attempt', normalizedEmail, { limit: 10, windowMs: 15*60_000 })
 *    Same table, same sweep, new bucket. No new schema per use case.
 */
