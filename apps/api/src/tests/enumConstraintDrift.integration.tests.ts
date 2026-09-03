/**
 * GUARD: database CHECK constraints and partial-index predicates that hard-code
 * smart-enum wire values must stay in sync with the enums they were derived from.
 *
 * The bug this pins (0031): `email_delivery_status_check` was written in 0029 as
 * ('SENT','DELIVERED','BOUNCED','REJECTED','COMPLAINED') — correct at the time,
 * because EmailStatus was then ['sent','delivered','bounced','rejected','complained']
 * and the stored wire value is `constantCase(key)`. The enum was later rewritten with
 * six new keys (send, delivery, bounceTransient, complaint, reject, bouncePermanent).
 * Nothing linked the two, so the constraint silently went from fully correct to
 * rejecting every insert the application could make. No build, typecheck, or test
 * failed. It surfaced as a runtime check-violation on the first real send.
 *
 * That is the failure this file exists to make impossible. A migration is an immutable
 * snapshot and cannot import the enum (see 0031's header for the packaging and policy
 * reasons), so the literals must be hand-typed — which means the coupling can only be
 * enforced from outside, here, against a migrated database.
 *
 * Note the earlier sibling failure this also covers: 0027 rebuilt two partial indexes
 * whose predicates used lowercase literals ('pending') where the wire value is
 * 'PENDING'. Those predicates matched no rows, so the unique indexes enforced nothing
 * at all — a silent loss of a guarantee rather than a loud rejection. Index predicates
 * are therefore checked here alongside constraints; they are the more dangerous of the
 * two precisely because they fail open.
 *
 * How it works: every registered object's definition is read back from the catalog,
 * its quoted literals extracted, and each literal checked against the live enum's
 * `.values()`. A second test then asserts that no unregistered object in the schema
 * contains CONSTANT_CASE literals — so a future migration that adds an enum-backed
 * constraint fails here until it is registered, rather than silently going unchecked.
 * That backstop is the part that makes this durable; without it the registry rots.
 */
import {
  AuthorizationKind,
  AuthorizationOrigin,
  EmailStatus,
  EntityType,
  MediaJobStatus,
  Operation,
} from '@packages/contracts';
import type { Knex } from 'knex';
import knexFactory from 'knex';

import { createConfigFromEnv } from '../config.js';
import { build__KnexConfig } from '../knexfile.js';

/** The shape this test needs from a smart-enum: its wire values. */
type EnumLike = { values: () => readonly string[] };

type Mode = 'exact' | 'subset';

type RegistryEntry = {
  /** Constraint or index name, as it appears in the catalog. */
  object: string;
  relation: string;
  kind: 'constraint' | 'index';
  /**
   * Enums the literals in this object are drawn from. More than one when a single
   * predicate spans two columns (e.g. kind + origin).
   */
  enums: { name: string; enum: EnumLike }[];
  /**
   * 'exact'  — the literal set must equal the enum's value set. Use when the column
   *            is the enum: any new member must be storable, any removed member must
   *            not be.
   * 'subset' — the literals must all be current enum values, but need not cover the
   *            enum. Use for deliberately narrowed constraints, where adding an enum
   *            member is not automatically a permission to store it.
   */
  mode: Mode;
  /**
   * Literals that are knowingly not current enum values. Every entry needs a reason.
   * This is an escape hatch for recorded, benign divergence — not a place to park a
   * failure. Anything listed here is drift that was looked at and accepted.
   */
  staleLiterals?: Record<string, string>;
  why?: string;
};

const REGISTRY: RegistryEntry[] = [
  {
    object: 'email_delivery_status_check',
    relation: 'email_delivery',
    kind: 'constraint',
    enums: [{ name: 'EmailStatus', enum: EmailStatus }],
    mode: 'exact',
    why: 'The column is EmailStatus. This is the constraint 0029 broke and 0031 rebuilt.',
  },
  {
    object: 'access_grant_kind_grantee_check',
    relation: 'access_grant',
    kind: 'constraint',
    enums: [{ name: 'AuthorizationKind', enum: AuthorizationKind }],
    mode: 'exact',
    why: 'Every kind must appear — the constraint states the grantee shape of each, so a new kind with no branch would be unstorable.',
  },
  {
    object: 'access_grant_operations_check',
    relation: 'access_grant',
    kind: 'constraint',
    enums: [{ name: 'Operation', enum: Operation }],
    mode: 'subset',
    staleLiterals: {
      VIEW: 'Operation has no `view` member; nothing can write it, so the constraint merely permits an unreachable value. Benign (permissive, not restrictive) and pre-existing — recorded here rather than fixed, because dropping it is a migration of its own.',
    },
    why: 'A deliberately narrow allowlist: grants may only carry download/comment (see UserAuthorization.create), not every Operation.',
  },
  {
    object: 'grant_operations_check',
    relation: 'grant',
    kind: 'constraint',
    enums: [{ name: 'Operation', enum: Operation }],
    mode: 'subset',
    staleLiterals: {
      VIEW: 'Same stale literal as access_grant_operations_check; `grant` is the superseded legacy table.',
    },
    why: 'Legacy `grant` table, superseded by access_grant. Registered so it cannot drift unnoticed while it still exists.',
  },
  {
    object: 'comment_target_type_check',
    relation: 'comment',
    kind: 'constraint',
    enums: [{ name: 'EntityType', enum: EntityType }],
    mode: 'subset',
    why: 'EntityType narrowed to what can be commented on. Comment.targetType is narrower still (mediaItem only); the constraint is the looser DB-side bound.',
  },
  {
    object: 'reaction_target_type_check',
    relation: 'reaction',
    kind: 'constraint',
    enums: [{ name: 'EntityType', enum: EntityType }],
    mode: 'subset',
    why: 'EntityType narrowed to what can be reacted to.',
  },
  {
    object: 'media_processing_job_one_active_per_media_item',
    relation: 'media_processing_job',
    kind: 'index',
    enums: [{ name: 'MediaJobStatus', enum: MediaJobStatus }],
    mode: 'subset',
    why: "0027's index. The predicate names the ACTIVE statuses only, so it is a subset by design — but a renamed member makes it match nothing and the unique guard vanishes silently.",
  },
  {
    object: 'media_deletion_job_one_active_per_media_item',
    relation: 'media_deletion_job',
    kind: 'index',
    enums: [{ name: 'MediaJobStatus', enum: MediaJobStatus }],
    mode: 'subset',
    why: "0027's index, same predicate on the deletion queue.",
  },
  {
    object: 'access_grant_album_membership_unique',
    relation: 'access_grant',
    kind: 'index',
    enums: [{ name: 'AuthorizationKind', enum: AuthorizationKind }],
    mode: 'subset',
    why: "0028's membership unique, scoped to live USER grants.",
  },
  {
    object: 'access_grant_media_item_membership_unique',
    relation: 'access_grant',
    kind: 'index',
    enums: [{ name: 'AuthorizationKind', enum: AuthorizationKind }],
    mode: 'subset',
    why: "0028's membership unique on the media-item scope.",
  },
  {
    object: 'access_grant_album_canonical_public_link_unique',
    relation: 'access_grant',
    kind: 'index',
    enums: [
      { name: 'AuthorizationKind', enum: AuthorizationKind },
      { name: 'AuthorizationOrigin', enum: AuthorizationOrigin },
    ],
    mode: 'subset',
    why: 'Predicate spans two enum columns (kind PUBLIC + origin OWNER), so literals are checked against the union of both.',
  },
];

/** Looks like a smart-enum wire value: CONSTANT_CASE, at least one letter. */
const CONSTANT_CASE = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

const quotedLiterals = (sql: string): string[] => {
  const out: string[] = [];
  for (const m of sql.matchAll(/'([^']*)'/g)) {
    out.push(m[1]);
  }
  return out;
};

const enumLiterals = (sql: string): string[] =>
  [...new Set(quotedLiterals(sql))].filter((l) => CONSTANT_CASE.test(l));

type CatalogRow = { name: string; relation: string; definition: string };

describe('enum-backed constraint drift (integration)', () => {
  let database: Knex;
  let constraints: CatalogRow[];
  let indexes: CatalogRow[];

  const definitionOf = (entry: RegistryEntry): string => {
    const rows = entry.kind === 'constraint' ? constraints : indexes;
    const row = rows.find((r) => r.name === entry.object);
    if (!row) {
      throw new Error(
        `${entry.kind} "${entry.object}" is registered in this test but does not exist in the ` +
          `database. If it was intentionally dropped, remove its registry entry; otherwise the ` +
          `test database is not fully migrated.`,
      );
    }
    return row.definition;
  };

  beforeAll(async () => {
    database = knexFactory(build__KnexConfig({ config: createConfigFromEnv() }));

    constraints = await database
      .select({
        name: 'con.conname',
        relation: database.raw('con.conrelid::regclass::text'),
        definition: database.raw('pg_get_constraintdef(con.oid)'),
      })
      .from({ con: 'pg_constraint' })
      .where('con.contype', 'c')
      .andWhere('con.connamespace', database.raw("'public'::regnamespace"));

    indexes = await database
      .select({
        name: 'indexname',
        relation: 'tablename',
        definition: 'indexdef',
      })
      .from('pg_indexes')
      .where('schemaname', 'public');
  });

  afterAll(async () => {
    await database?.destroy();
  });

  describe.each(REGISTRY.map((e) => [e.object, e] as const))('%s', (_name, entry) => {
    const enumNames = entry.enums.map((e) => e.name).join(' + ');

    it(`only references current ${enumNames} wire values`, () => {
      const permitted = new Set(entry.enums.flatMap((e) => e.enum.values()));
      const stale = entry.staleLiterals ?? {};

      const unknown = enumLiterals(definitionOf(entry)).filter(
        (l) => !permitted.has(l) && !(l in stale),
      );

      expect({ object: entry.object, unknownLiterals: unknown }).toEqual({
        object: entry.object,
        unknownLiterals: [],
      });
    });

    if (entry.mode === 'exact') {
      it(`permits every current ${enumNames} wire value`, () => {
        const present = new Set(enumLiterals(definitionOf(entry)));
        const missing = entry.enums.flatMap((e) => e.enum.values()).filter((v) => !present.has(v));

        expect({ object: entry.object, missingLiterals: missing }).toEqual({
          object: entry.object,
          missingLiterals: [],
        });
      });
    }

    if (entry.staleLiterals) {
      it('still contains each literal recorded as knowingly stale', () => {
        const present = new Set(enumLiterals(definitionOf(entry)));
        const goneFromDb = Object.keys(entry.staleLiterals ?? {}).filter((l) => !present.has(l));

        // Keeps the escape hatch honest: once a stale literal is actually removed from
        // the schema, its exemption must be deleted from the registry too, or the next
        // real drift could hide behind it.
        expect({ object: entry.object, obsoleteExemptions: goneFromDb }).toEqual({
          object: entry.object,
          obsoleteExemptions: [],
        });
      });
    }
  });

  /**
   * The backstop. Without this, the registry above only covers what someone remembered
   * to add, and the next enum-backed constraint goes unchecked exactly the way 0029 did.
   */
  it('has a registry entry for every enum-looking constraint and index predicate in the schema', () => {
    const registered = new Set(REGISTRY.map((e) => e.object));

    const candidates = [
      ...constraints.map((r) => ({ ...r, kind: 'constraint' as const })),
      // Only partial indexes can carry literals; a plain index has no predicate.
      ...indexes
        .filter((r) => / WHERE /i.test(r.definition))
        .map((r) => ({ ...r, kind: 'index' as const })),
    ];

    const unregistered = candidates
      .filter((r) => !registered.has(r.name) && enumLiterals(r.definition).length > 0)
      .map((r) => ({ kind: r.kind, relation: r.relation, name: r.name }));

    expect(unregistered).toEqual([]);
  });
});
