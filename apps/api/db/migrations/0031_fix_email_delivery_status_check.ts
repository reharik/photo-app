import type { Knex } from 'knex';

/**
 * Rebuild `email_delivery_status_check` against the real EmailStatus wire values,
 * and drop `bounce_type` / `diagnostic_code`.
 *
 * 0029 wrote the CHECK as ('SENT','DELIVERED','BOUNCED','REJECTED','COMPLAINED').
 * Those were correct at the time. EmailStatus was then a flat key list
 * ['sent','delivered','bounced','rejected','complained'], and the wire value a
 * smart-enum stores is `constantCase(key)` — see `value: constantCase(k)` in
 * @reharik/smart-enum — so those five literals were exactly right.
 *
 * The enum was subsequently rewritten: object form, `rank`/`display` metadata, and
 * six new keys — send, delivery, bounceTransient, complaint, reject, bouncePermanent
 * — which constantCase to SEND, DELIVERY, BOUNCE_TRANSIENT, COMPLAINT, REJECT,
 * BOUNCE_PERMANENT. Not one of the old five survived, so the constraint went from
 * fully correct to rejecting every insert the application can make, with no
 * intermediate state and nothing to notice it. The table has never held a row.
 *
 * This is the third enum-literal defect in this migration history, but NOT a third
 * instance of the 0027/0028 class, and the distinction is the whole lesson:
 *   - 0027, 0028: literals WRONG WHEN WRITTEN (lowercase 'pending' where the wire
 *     value is 'PENDING'). An authoring mistake. A careful author catches it; 0028's
 *     header warns the next author to.
 *   - 0029 (this fix): literals RIGHT WHEN WRITTEN, invalidated later by an edit to
 *     the enum in another package. No author was careless. The warnings on 0027 and
 *     0028 could not have prevented it, because there was no mistake at authoring
 *     time to prevent.
 *
 * So the rule those headers state — enum literals in raw SQL are CONSTANT_CASE wire
 * values, derived from the member KEY, never from `display` — is necessary and still
 * applies here. It is also insufficient. A correct literal is a snapshot of a value
 * owned by a file in a different package, and nothing links the two: renaming an
 * enum member does not fail any build, any test, or any typecheck. The coupling is
 * real and completely invisible.
 *
 * Anyone editing a smart-enum whose values reach the database should grep the
 * migrations for the old wire values before changing a member key. That is a weak
 * control and is offered as one; see the migration-import note at the bottom of this
 * file for why the strong version (deriving the literals from the enum object)
 * cannot be done from inside a migration.
 *
 * `bounce_type` and `diagnostic_code` were speculative: nothing has ever read or
 * written either. `IncomingSesEventBody.bounce.bounceType` in the worker is the SES
 * payload shape, consumed to choose bounceTransient vs bouncePermanent and then
 * discarded — it never reached this column. The matching dead props are removed
 * from `EmailDeliveryProps` in the same change.
 *
 * No backfill. up() asserts the table is empty first. That assertion is exact rather
 * than cautious: a row could only have been inserted while 0029's constraint was in
 * force, so any surviving row necessarily holds one of that constraint's five values,
 * none of which is a member of the current enum. Non-empty therefore means the
 * ALTER is guaranteed to fail — better to stop with a readable breakdown than to
 * surface a raw check-violation from inside a migration.
 *
 * `email_kind` deliberately gets no CHECK. It has never had one, and a hand-typed
 * list of enum literals is exactly the artifact this migration exists to repair.
 *
 * down() is a true inverse: it restores 0029's schema, broken constraint included.
 * That means down() will itself fail if the table has acquired rows with real wire
 * values in the meantime — which is correct, since those rows cannot satisfy the
 * constraint 0029 defined. Reverting past this migration with live data requires
 * deciding what to do with that data, not a silent widening. Note also that the two
 * restored columns come back at the end of the column order rather than their
 * original positions; they are nullable and unreferenced, so nothing observes it.
 *
 * Why this file hand-types the literals instead of importing EmailStatus:
 * migrations under db/ are compiled by plain `tsc` (tsconfig.db.json, the `build:db`
 * target), NOT bundled by vite the way src/ is, so their imports survive into
 * dist/db/migrations/*.js as live runtime specifiers. The prod image copies only
 * apps/<svc>/dist plus a prod node_modules (infra/docker/Dockerfile) — `packages/`
 * is never copied, so the node_modules/@packages/contracts workspace symlink dangles
 * there. An `import { EmailStatus } from '@packages/contracts'` would typecheck, pass
 * locally under tsx, and then crash the prod migrate one-shot with ERR_MODULE_NOT_FOUND.
 * 0030 states the policy reason for the same conclusion (a migration that imports app
 * code pins that code's shape into migration history); this is the mechanical one.
 */

const CONSTRAINT = 'email_delivery_status_check';

// EmailStatus wire values: constantCase of each member key in
// packages/foundation/contracts/src/enums/EmailStatus.ts.
// send, delivery, bounceTransient, complaint, reject, bouncePermanent
const STATUS_VALUES = [
  'SEND',
  'DELIVERY',
  'BOUNCE_TRANSIENT',
  'COMPLAINT',
  'REJECT',
  'BOUNCE_PERMANENT',
] as const;

// The 0029 list, kept verbatim so down() restores that schema exactly.
const STATUS_VALUES_0029 = ['SENT', 'DELIVERED', 'BOUNCED', 'REJECTED', 'COMPLAINED'] as const;

const sqlList = (values: readonly string[]): string => values.map((v) => `'${v}'`).join(', ');

export async function up(knex: Knex): Promise<void> {
  const [{ count }] = await knex('email_delivery').count<{ count: string }[]>('* as count');
  const rowCount = Number(count);
  if (rowCount > 0) {
    const breakdown = await knex('email_delivery')
      .select('status')
      .count<{ status: string; count: string }[]>('* as count')
      .groupBy('status')
      .orderBy('status');
    throw new Error(
      `0031: expected email_delivery to be empty, found ${rowCount} row(s). ` +
        `Every existing row predates this fix and holds a status from the superseded ` +
        `enum, which the corrected constraint rejects, so the ALTER cannot succeed. ` +
        `By status: ${breakdown.map((r) => `${r.status}=${r.count}`).join(', ')}. ` +
        `Decide how to map these to EmailStatus wire values (${sqlList(STATUS_VALUES)}) ` +
        `and add a backfill before re-running.`,
    );
  }

  await knex.raw(`ALTER TABLE email_delivery DROP CONSTRAINT ${CONSTRAINT}`);
  await knex.raw(`
    ALTER TABLE email_delivery
    ADD CONSTRAINT ${CONSTRAINT}
    CHECK (status IN (${sqlList(STATUS_VALUES)}))
  `);

  await knex.schema.alterTable('email_delivery', (table) => {
    table.dropColumn('bounce_type');
    table.dropColumn('diagnostic_code');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('email_delivery', (table) => {
    table.text('bounce_type').nullable();
    table.text('diagnostic_code').nullable();
  });

  await knex.raw(`ALTER TABLE email_delivery DROP CONSTRAINT ${CONSTRAINT}`);
  await knex.raw(`
    ALTER TABLE email_delivery
    ADD CONSTRAINT ${CONSTRAINT}
    CHECK (status IN (${sqlList(STATUS_VALUES_0029)}))
  `);
}
