import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { knexConfig } from '../knexfile';

const exec = promisify(execFile);
const BUCKET = process.env.BACKUP_S3_BUCKET;
const REGION = process.env.AWS_REGION;

// single source of truth: pg_dump connects to exactly what knex connects to
function pgTarget(connection) {
  if (typeof connection === 'string') return { args: [connection], env: process.env };
  const { host, port, user, password, database } = connection;
  return {
    args: ['-h', host, '-p', String(port ?? 5432), '-U', user, '-d', database],
    env: { ...process.env, PGPASSWORD: password },
  };
}

export async function dumpToS3(prefix) {
  if (!BUCKET) throw new Error('BACKUP_S3_BUCKET unset — refusing to run an unverifiable backup');

  const sha = process.env.GIT_SHA ? `-${process.env.GIT_SHA.slice(0, 7)}` : '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = join(tmpdir(), `betaname-${stamp}${sha}.dump`);
  const key = `${prefix}/betaname-${stamp}${sha}.dump`;
  const { args, env } = pgTarget(knexConfig.connection);

  try {
    await exec('pg_dump', ['-Fc', '-f', file, ...args], { env }); // 1. dump
    await exec('pg_restore', ['--list', file]); // 2. validate not truncated
    const body = await readFile(file); // 3. upload (instance role)
    await new S3Client({ region: REGION }).send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body }),
    );
    console.log(`Backup uploaded: s3://${BUCKET}/${key}`);
    return key;
  } finally {
    await unlink(file).catch(() => {});
  }
}

// CLI entry — nightly cron: node scripts/dumpToS3.js daily
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prefix = process.argv[2];
  if (!prefix) {
    console.error('usage: node dumpToS3.js <prefix>');
    process.exit(1);
  }
  dumpToS3(prefix)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('Backup failed:', e);
      process.exit(1);
    });
}
