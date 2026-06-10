# Migration discipline

## The rule

Production runs **auto-migrate on deploy**. Every migration runs against real,
irreplaceable family data automatically, with **no manual checkpoint** to stop a
bad one before it executes.

Therefore: **no single migration may destroy data in one step.**

Split every schema change into separate deploys where each step is individually
safe and recoverable. This is expand/contract.

## Before writing any migration, ask:

> Could this migration lose data if it ran right now, half-failed, or had to be
> rolled back — or if old app code were still running when it lands?

If yes, it is destructive. Split it.

## Never do in a single auto-run migration

- `DROP COLUMN` / `DROP TABLE` in the same deploy that stops using it
- `RENAME COLUMN` / `RENAME TABLE`
- An in-place type change with a destructive cast
- Adding a `NOT NULL` column with no default to a populated table

## Expand / contract pattern

A schema change is three (or more) deploys, never one:

1. **Expand** — add the new shape _alongside_ the old. New column/table, nullable,
   nothing reads it yet. Backfill it. Old code still works untouched.
2. **Migrate readers** — change app code to read/write the new shape. Deploy.
   The old shape is now dead weight but remains as a safety net.
3. **Contract** — in a _later_ deploy, once nothing references the old shape,
   drop it.

No individual deploy is ever in a position to lose data.

### Worked example — renaming `taken_at` → `captured_at`

- ❌ One migration: `ALTER TABLE ... RENAME COLUMN taken_at TO captured_at`
  (torn state on any failure; old code breaks immediately)
- ✅ Three deploys:
  1. Add `captured_at` (nullable). Backfill from `taken_at`. Both exist, agree.
  2. App reads/writes `captured_at`. `taken_at` still present.
  3. Later migration drops `taken_at`.

### Other common cases

- **New `NOT NULL` column:** add nullable → backfill → add the constraint (separate deploy).
- **Split / merge tables:** create new → dual-write + backfill → cut readers over → drop old.
- **Type change:** add new column of new type → backfill → swap readers → drop old.

## Why this exists

Backups (`pg_dump` → S3, S3 versioning) protect against the _infrastructure_
failing — a dead volume, a terminated instance, a full disk. They do **not**
protect against a destructive migration, which corrupts the data _and_ gets
faithfully copied into the next backup. Expand/contract is the only thing
standing between auto-migrate and self-inflicted data loss.

Backups protect you from the machine. This protects you from yourself.
