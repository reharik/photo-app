/**
 * The well-known system actor.
 *
 * Worker processes (the notification batcher, scheduled sweeps) write audited
 * records — `created_by` / `updated_by` — but run with no current viewer, so
 * they have no natural actor id. Rather than leaving those columns to a
 * per-caller improvisation, they all reference this one fixed row.
 *
 * The row itself is seeded by `apps/api/db/migrations/0030_seed_system_user.ts`.
 * It is schema-adjacent reference data, not a fixture: it must exist in every
 * environment including production, which is why it ships as a migration rather
 * than a seed.
 *
 * Deliberately NOT cast to `ActorId`. `ActorId` is a plain `string` alias living
 * in `@packages/media-core` (`layer:context`); importing it here would invert
 * the layering and cycle back on this package, and would buy nothing — the
 * alias is not branded, so this constant is already assignable wherever an
 * `ActorId` is expected.
 */
export const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001' as const;
