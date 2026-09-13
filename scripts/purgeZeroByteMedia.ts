/**
 * Purge media items whose ORIGINAL object in S3 is zero bytes.
 *
 * Fallout from the WebKit service-worker bug (sw.js re-issued every request and
 * dropped the body, so iOS PUTs landed as empty objects). Those bytes never
 * existed, so there is nothing to reprocess — the items are purged, not requeued.
 *
 * DRY RUN BY DEFAULT. Nothing is deleted without --apply.
 *
 *   npx tsx scripts/purgeZeroByteMedia.ts                 # report only
 *   npx tsx scripts/purgeZeroByteMedia.ts --apply         # delete
 *
 * Flags:
 *   --apply              actually delete (default: report only)
 *   --min-age-hours=N    ignore items newer than N hours (default 24) so an
 *                        upload still in flight is never purged
 *   --owner=<uuid>       restrict to one owner
 *   --limit=N            cap the number of items considered
 *   --include-missing    also purge items whose ORIGINAL object is absent
 *                        entirely (default: reported, not purged)
 *
 * Env: POSTGRES_HOST/PORT/USER/PASSWORD/DB, S3_BUCKET, AWS_REGION (+ AWS creds).
 */
import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

type Args = {
  apply: boolean;
  minAgeHours: number;
  owner?: string;
  limit?: number;
  includeMissing: boolean;
};

const parseArgs = (argv: string[]): Args => {
  const get = (name: string): string | undefined =>
    argv
      .find((a) => a.startsWith(`--${name}=`))
      ?.split('=')
      .slice(1)
      .join('=');
  const has = (name: string): boolean => argv.includes(`--${name}`);
  const minAge = get('min-age-hours');
  const limit = get('limit');
  return {
    apply: has('apply'),
    minAgeHours: minAge === undefined ? 24 : Number(minAge),
    owner: get('owner'),
    limit: limit === undefined ? undefined : Number(limit),
    includeMissing: has('include-missing'),
  };
};

type Candidate = {
  id: string;
  ownerId: string;
  status: string;
  mimeType: string;
  originalFileName: string | null;
  sizeBytes: string;
  createdAt: Date;
  originalAssetBytes: string | null;
};

type ChildFk = { table: string; column: string; deleteRule: string };

type Verdict = 'zero' | 'missing' | 'nonzero';

type Inspected = {
  candidate: Candidate;
  verdict: Verdict;
  originalBytes?: number;
  objectKeys: string[];
  objectTotalBytes: number;
};

const fmtBytes = (n: number): string => (n === 0 ? '0' : `${n.toLocaleString()}`);

/** Every FK pointing at media_item.id, straight from the catalog — so a table
 *  added by a later migration cannot be silently missed by a hand-written list. */
const loadChildFks = async (db: Client): Promise<ChildFk[]> => {
  const { rows } = await db.query<{ child_table: string; child_column: string; rule: string }>(`
    SELECT src.relname AS child_table,
           att.attname AS child_column,
           CASE con.confdeltype
             WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
             WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
             WHEN 'd' THEN 'SET DEFAULT' END AS rule
    FROM pg_constraint con
    JOIN pg_class src ON src.oid = con.conrelid
    JOIN pg_class tgt ON tgt.oid = con.confrelid
    JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
    WHERE con.contype = 'f' AND tgt.relname = 'media_item'
    ORDER BY src.relname, att.attname
  `);
  return rows.map((r) => ({ table: r.child_table, column: r.child_column, deleteRule: r.rule }));
};

const loadCandidates = async (db: Client, args: Args): Promise<Candidate[]> => {
  const params: unknown[] = [args.minAgeHours];
  let ownerClause = '';
  if (args.owner) {
    params.push(args.owner);
    ownerClause = `AND mi.owner_id = $${params.length}`;
  }
  let limitClause = '';
  if (args.limit !== undefined) {
    params.push(args.limit);
    limitClause = `LIMIT $${params.length}`;
  }

  const { rows } = await db.query(
    `SELECT mi.id, mi.owner_id, mi.status, mi.mime_type, mi.original_file_name,
            mi.size_bytes, mi.created_at, oa.file_size_bytes AS original_asset_bytes
       FROM media_item mi
       LEFT JOIN media_asset oa
              ON oa.media_item_id = mi.id AND oa.kind = 'ORIGINAL'
      WHERE (mi.size_bytes = 0 OR oa.file_size_bytes = 0)
        AND mi.created_at < now() - ($1 || ' hours')::interval
        ${ownerClause}
      ORDER BY mi.created_at ASC
      ${limitClause}`,
    params,
  );

  return rows.map((r) => ({
    id: r.id,
    ownerId: r.owner_id,
    status: r.status,
    mimeType: r.mime_type,
    originalFileName: r.original_file_name,
    sizeBytes: String(r.size_bytes),
    createdAt: r.created_at,
    originalAssetBytes: r.original_asset_bytes === null ? null : String(r.original_asset_bytes),
  }));
};

/** S3 is the authority on "zero bytes", not the DB. */
const inspectInS3 = async (
  s3: S3Client,
  bucket: string,
  candidate: Candidate,
): Promise<Inspected> => {
  const prefix = `media/${candidate.ownerId}/${candidate.id}/`;
  const originalKey = `${prefix}original`;

  const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
  const contents = listed.Contents ?? [];
  const objectKeys = contents.map((o) => o.Key ?? '').filter(Boolean);
  const objectTotalBytes = contents.reduce((sum, o) => sum + (o.Size ?? 0), 0);

  let originalBytes: number | undefined;
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: originalKey }));
    originalBytes = head.ContentLength ?? 0;
  } catch {
    originalBytes = undefined;
  }

  const verdict: Verdict =
    originalBytes === undefined ? 'missing' : originalBytes === 0 ? 'zero' : 'nonzero';

  return { candidate, verdict, originalBytes, objectKeys, objectTotalBytes };
};

const countCascade = async (
  db: Client,
  fks: ChildFk[],
  ids: string[],
): Promise<Map<string, number>> => {
  const counts = new Map<string, number>();
  if (ids.length === 0) return counts;
  for (const fk of fks) {
    const { rows } = await db.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM "${fk.table}" WHERE "${fk.column}" = ANY($1::uuid[])`,
      [ids],
    );
    const n = Number(rows[0]?.n ?? '0');
    if (n > 0) counts.set(`${fk.table}.${fk.column} (${fk.deleteRule})`, n);
  }
  return counts;
};

const deleteS3Objects = async (s3: S3Client, bucket: string, keys: string[]): Promise<void> => {
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
};

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET is not set');

  const db = new Client({
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT || 5432),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'photo_app',
  });
  await db.connect();
  const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

  console.log(`bucket=${bucket}  db=${process.env.POSTGRES_DB}@${process.env.POSTGRES_HOST}`);
  console.log(
    `mode=${args.apply ? 'APPLY (destructive)' : 'DRY RUN'}  minAgeHours=${args.minAgeHours}` +
      `${args.owner ? `  owner=${args.owner}` : ''}${args.limit ? `  limit=${args.limit}` : ''}` +
      `  includeMissing=${args.includeMissing}\n`,
  );

  const fks = await loadChildFks(db);
  const candidates = await loadCandidates(db, args);
  console.log(`DB candidates (size_bytes = 0 or ORIGINAL asset = 0): ${candidates.length}\n`);
  if (candidates.length === 0) {
    await db.end();
    return;
  }

  const inspected: Inspected[] = [];
  for (const c of candidates) {
    inspected.push(await inspectInS3(s3, bucket, c));
  }

  const zero = inspected.filter((i) => i.verdict === 'zero');
  const missing = inspected.filter((i) => i.verdict === 'missing');
  const nonzero = inspected.filter((i) => i.verdict === 'nonzero');

  const section = (title: string, rows: Inspected[], disposition: string): void => {
    console.log(`\n=== ${title} — ${rows.length} item(s) — ${disposition} ===`);
    if (rows.length === 0) {
      console.log('  (none)');
      return;
    }
    const header =
      '  media_item_id                        owner_id                             ' +
      'status        created_at           s3_original  objects  filename';
    console.log(header);
    console.log('  ' + '-'.repeat(header.length - 2));
    for (const i of rows) {
      const c = i.candidate;
      const orig =
        i.verdict === 'missing'
          ? 'ABSENT'
          : i.verdict === 'zero'
            ? '0'
            : fmtBytes(i.originalBytes!);
      console.log(
        `  ${c.id}  ${c.ownerId}  ${c.status.padEnd(12)}  ` +
          `${c.createdAt.toISOString().slice(0, 19)}  ${orig.padStart(11)}  ` +
          `${String(i.objectKeys.length).padStart(7)}  ${c.originalFileName ?? ''}`,
      );
    }
  };

  section('ZERO-BYTE ORIGINAL', zero, 'WOULD PURGE');
  section(
    'ABSENT ORIGINAL',
    missing,
    args.includeMissing
      ? 'WOULD PURGE (--include-missing)'
      : 'SKIPPED — pass --include-missing to purge',
  );
  section('NON-EMPTY ORIGINAL', nonzero, 'SKIPPED — has real bytes');

  if (missing.length > 0) {
    console.log(
      '\n  NOTE: ABSENT is where never-finalized picks land — a PENDING row whose\n' +
        '  bytes were never PUT at all. Those are abandoned uploads, not the iOS\n' +
        '  zero-byte bug, so they are held back from the purge by default.',
    );
  }

  const purgeSet = args.includeMissing ? [...zero, ...missing] : zero;
  const purgeIds = purgeSet.map((i) => i.candidate.id);
  const purgeKeys = purgeSet.flatMap((i) => i.objectKeys);
  const purgeBytes = purgeSet.reduce((s, i) => s + i.objectTotalBytes, 0);

  if (nonzero.length > 0) {
    console.log(
      '\n  NOTE: NON-EMPTY means a zero size in the DB but real bytes in S3 — a\n' +
        '  bookkeeping mismatch, not a lost upload. Never purged.',
    );
  }

  console.log(
    `\nS3 objects that would be deleted: ${purgeKeys.length} (${fmtBytes(purgeBytes)} bytes)`,
  );
  for (const k of purgeKeys) console.log(`  ${k}`);

  console.log('\nDB rows that would be deleted (via media_item delete + FK cascade):');
  console.log(`  media_item: ${purgeIds.length}`);
  const cascade = await countCascade(db, fks, purgeIds);
  if (cascade.size === 0) {
    console.log('  (no dependent rows)');
  } else {
    for (const [label, n] of [...cascade.entries()].sort()) console.log(`  ${label}: ${n}`);
  }

  if (!args.apply) {
    console.log('\nDRY RUN — nothing was deleted. Re-run with --apply to execute.');
    await db.end();
    return;
  }

  console.log('\nAPPLYING…');
  let purged = 0;
  const failures: Array<{ id: string; error: string }> = [];
  for (const item of purgeSet) {
    const id = item.candidate.id;
    try {
      // S3 first: a failure here leaves the DB row intact and the run resumable.
      // The reverse order would orphan objects with nothing left pointing at them.
      if (item.objectKeys.length > 0) await deleteS3Objects(s3, bucket, item.objectKeys);
      await db.query('BEGIN');
      await db.query('DELETE FROM media_item WHERE id = $1', [id]);
      await db.query('COMMIT');
      purged += 1;
      console.log(`  purged ${id} (${item.objectKeys.length} object(s))`);
    } catch (e) {
      await db.query('ROLLBACK').catch(() => undefined);
      const msg = e instanceof Error ? e.message : String(e);
      failures.push({ id, error: msg });
      console.error(`  FAILED ${id}: ${msg}`);
    }
  }

  console.log(`\npurged ${purged} item(s), ${failures.length} failure(s)`);
  await db.end();
  if (failures.length > 0) process.exitCode = 1;
};

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
