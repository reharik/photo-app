---
name: drive-web-app
description: Drive the running Homeroll web app in headless Chromium as a throwaway logged-in user — screenshot a screen at a given viewport, click through UI, and put the upload widget into uploading/failed states without touching S3. Use to see a web change working in the real app (not tests), e.g. mobile layout checks at 320/375px.
---

# Drive the web app

`session.cjs` (next to this file) does the setup: creates a throwaway user straight in
Postgres, logs in through the real API, gives you logged-in Playwright pages, routes S3,
and deletes the user afterwards. You write a small `.cjs` script against it;
`example.cjs` is a complete one.

## Preconditions — the stack must already be up

This skill drives the running dev stack; it does not start it.

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/   # web (Vite), expect 200
ss -ltn | grep -E ':(3002|5443)\b'                                # api (3002), Postgres (5443)
```

- Web: Vite on the host at **:5173**, serving the working tree (so it shows uncommitted
  code, with HMR). `/api/*` is proxied to the api — scripts only ever talk to :5173.
- API **:3002** and Postgres **:5443** are this clone's docker ports (remapped from
  3001/5432 via `DEV_API_PORT`/`DEV_DB_PORT` in the shell that launched compose — not in
  any file). `session.cjs` reads the DB settings from `apps/api/.env`.
- Override the web URL with `WEB_BASE_URL=...` if it isn't :5173.

## Run

Write the script in the scratchpad (not the repo), `require` the helper by absolute path,
and run it from the directory where `shots/` should land:

```bash
NODE_PATH="/home/reharik/Development/photoapp-cc/node_modules" node my-script.cjs
```

```js
const {
  runSession,
  testImages,
} = require('/home/reharik/Development/photoapp-cc/.claude/skills/drive-web-app/session.cjs');

runSession(async ({ user, newPage, shot }) => {
  const page = await newPage({ viewport: { width: 375, height: 700 }, s3: 'hold' });
  await page.goto('/media');
  // ...interact...
  await shot(page, 'media-375'); // → ./shots/media-375.png — then Read the PNG and look at it
});
```

`runSession` always cleans up, even on failure: the user row is deleted and every FK into
`user` cascades (media rows, albums). It prints the pages' console errors at the end.

## S3 routing (`newPage({ s3 })`)

Media bytes go browser → **real AWS S3** by presigned PUT (localstack is SES only), and
nothing ever deletes those objects. So by default no upload reaches S3:

| `s3`               | Effect                                               | Use for                                                             |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------- |
| `'hold'` (default) | PUT never answers; rows stay **Uploading** (spinner) | in-flight widget states                                             |
| `'abort'`          | PUT fails; rows end up **failed**                    | failure states                                                      |
| `'pass'`           | real upload to AWS                                   | only when you need a processed/READY item; leaves S3 objects behind |

`hold`/`abort` still create PENDING `media_item` rows (presign happens first); cleanup
removes them with the user. Expect one `net::ERR_FAILED` console error per aborted PUT.

## Driving uploads

- Every upload trigger shares a hidden `input[data-testid="upload-media-input"]`; use
  `.first()` and `setInputFiles(...)`. That bypasses the picker's `accept`, so a `.txt`
  goes in as an instant failed row (rejected at enqueue — no network).
- `testImages()` returns the e2e suite's JPEGs.
- The upload summary adds "· N failed" **only once nothing is in flight**: with
  `s3: 'hold'` it stays "0 of 5" even with a failed row. For failed wording use `'abort'`.
- The widget is either the open panel (`#upload-progress-panel`, minimized via
  `Minimize uploads`) or the header pill — never both. The pill exists only while minimized;
  its name starts with `Open uploads:` (`page.getByRole('button', { name: /^Open uploads:/ })`).
- Mobile shell kicks in at ≤768px: nav is behind `Open navigation menu`; the profile
  trigger's name is the user's display name (`Drive Web`).

## Gotchas hit building this

- **Scratch scripts must be CommonJS** (`.cjs` + `require`) run with `NODE_PATH` set to the
  repo's `node_modules`; ESM `import` ignores `NODE_PATH`.
- **`knex-stringcase` is ESM with a default export** — `require()` returns the namespace,
  and calling it throws `knexStringcase is not a function`. `session.cjs` unwraps `.default`.
- The user's email must be lowercase (`CHECK (email = lower(email))`) and `userStatus`
  `'ACTIVE'`; the password hash is the e2e suite's precomputed bcrypt of `123123123`.
- Login is rate-limited (5 / 15 min per email); each run uses a fresh email and clears its
  `rate_limit_event` rows anyway.
- Wait on the element you need (`waitFor`), not `networkidle` — the app polls.
- Don't run this while `test-integration` is running: same Postgres, and its reset
  truncates tables.
