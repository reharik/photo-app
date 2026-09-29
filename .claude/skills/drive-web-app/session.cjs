// Drives the running web app in headless Chromium as a throwaway, logged-in user.
// Usage and gotchas: SKILL.md next to this file.
//
//   const { runSession } = require('./.claude/skills/drive-web-app/session.cjs');
//   runSession(async ({ newPage, shot }) => {
//     const page = await newPage({ viewport: { width: 375, height: 700 }, s3: 'hold' });
//     await page.goto('/media');
//     await shot(page, 'media-375');
//   });
//
// Run from the repo root with: NODE_PATH="$PWD/node_modules" node <your-script>.cjs
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { chromium } = require('@playwright/test');
const knex = require('knex');
// knex-stringcase is ESM with a default export; require() hands back the namespace object.
const knexStringcaseModule = require('knex-stringcase');
const knexStringcase = knexStringcaseModule.default ?? knexStringcaseModule;

const ROOT = path.resolve(__dirname, '../../..');
const WEB = (process.env.WEB_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');

// Same fixed password + precomputed bcrypt hash the e2e user factory uses
// (packages/e2e/fixtures/users.ts); hashing per run would cost ~300ms for nothing.
const PASSWORD = '123123123';
const PASSWORD_HASH = '$2b$12$sc9Guv19f.uPOGPIgy/Z3uLLFQe.C5IoNdfSn3BaiWzYvWBGUiTgq';

/** Postgres settings from apps/api/.env — POSTGRES_PORT there is this clone's host port (5443). */
const readApiEnv = () =>
  Object.fromEntries(
    fs
      .readFileSync(path.join(ROOT, 'apps/api/.env'), 'utf8')
      .split('\n')
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => {
        const eq = line.indexOf('=');
        return [line.slice(0, eq), line.slice(eq + 1).replace(/^["']|["']$/g, '')];
      }),
  );

const openDb = () => {
  const env = readApiEnv();
  // This script creates and deletes users. 127.0.0.1 is most of the
  // protection, but an SSM port-forward makes prod reachable on
  // localhost too — so pin the port to the known dev ones.
  const DEV_PORTS = ['5432', '5443'];
  if (!DEV_PORTS.includes(String(env.POSTGRES_PORT))) {
    throw new Error(
      `refusing to run: POSTGRES_PORT=${env.POSTGRES_PORT} is not a dev port (${DEV_PORTS.join(', ')})`,
    );
  }
  return knex(
    knexStringcase({
      client: 'pg',
      connection: {
        host: '127.0.0.1',
        port: Number(env.POSTGRES_PORT),
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        database: env.POSTGRES_DB,
      },
    }),
  );
};

/** Media uploads PUT straight to (real AWS) S3 from the browser; everything else goes to :5173. */
const isS3Put = (request) => request.method() === 'PUT' && !request.url().startsWith(WEB);

/**
 * Creates a user, runs `fn`, then always deletes the user (every FK into `user` cascades, so
 * its media rows and albums go with it) and prints any console errors the pages logged.
 *
 * `fn` receives:
 * - `user` — { id, email, password, displayName }
 * - `newPage({ viewport, s3 })` — a logged-in page in a fresh context, baseURL = the web app.
 *   `s3`: 'hold' (default; PUTs never answer, rows stay "Uploading", nothing written),
 *         'abort' (PUTs fail, rows end up failed), 'pass' (REAL upload to AWS S3; objects
 *         are never cleaned up — only when you actually need a processed item).
 * - `shot(page, name)` — waits out UI transitions, saves `<outDir>/<name>.png`, returns the path.
 */
const runSession = async (fn, { outDir = path.join(process.cwd(), 'shots') } = {}) => {
  const db = openDb();
  const id = randomUUID();
  const email = `drive-web-${id.slice(0, 8)}@example.test`; // must be lowercase (CHECK constraint)
  const user = { id, email, password: PASSWORD, displayName: 'Drive Web' };
  const errors = [];
  fs.mkdirSync(outDir, { recursive: true });

  await db('user').insert({
    id,
    email,
    firstName: 'Drive',
    lastName: 'Web',
    passwordHash: PASSWORD_HASH,
    emailVerified: true,
    createdBy: id,
    updatedBy: id,
    userStatus: 'ACTIVE', // login ignores it, but sharing/grants reject non-active users
  });

  const browser = await chromium.launch();
  const newPage = async ({ viewport = { width: 1280, height: 800 }, s3 = 'hold' } = {}) => {
    const context = await browser.newContext({ baseURL: WEB, viewport });
    // Real login: the API sets the session cookie on this context (proxied through Vite).
    const res = await context.request.post('/api/auth/login', {
      data: { email, password: PASSWORD },
    });
    if (!res.ok()) {
      throw new Error(`login failed: ${res.status()} ${await res.text()}`);
    }
    const page = await context.newPage();
    const tag = `${viewport.width}px`;
    page.on('console', (m) => m.type() === 'error' && errors.push(`${tag}: ${m.text()}`));
    page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
    if (s3 !== 'pass') {
      await page.route('**/*', (route) => {
        if (!isS3Put(route.request())) {
          return route.continue();
        }
        return s3 === 'abort' ? route.abort() : undefined; // undefined = held open forever
      });
    }
    return page;
  };
  const shot = async (page, name) => {
    await page.waitForTimeout(450); // longest enter transition in the app is ~280ms
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    return file;
  };

  try {
    await fn({ user, newPage, shot });
  } finally {
    await browser.close();
    await db('rate_limit_event').where({ bucket: 'login:attempt', key: email }).delete();
    await db('user').where({ id }).delete();
    await db.destroy();
    console.log(errors.length ? `console errors:\n  ${errors.join('\n  ')}` : 'no console errors');
  }
};

/** Images the e2e suite uploads; handy for `setInputFiles`. */
const testImages = () => {
  const dir = path.join(ROOT, 'packages/e2e/fixtures/assets');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => path.join(dir, f));
};

module.exports = { runSession, testImages, WEB };
