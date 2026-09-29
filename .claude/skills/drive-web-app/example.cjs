// Example: open the upload panel at 320px with every row failed, screenshot it.
// Run from the repo root: NODE_PATH="$PWD/node_modules" node .claude/skills/drive-web-app/example.cjs
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runSession, testImages } = require('./session.cjs');

const notMedia = path.join(os.tmpdir(), 'not-media.txt');
fs.writeFileSync(notMedia, 'not an image'); // rejected at enqueue → an instant failed row

runSession(async ({ newPage, shot }) => {
  const page = await newPage({ viewport: { width: 320, height: 700 }, s3: 'abort' });
  await page.goto('/media');
  // Hidden file input behind every upload trigger; setInputFiles bypasses the picker's `accept`.
  const input = page.locator('[data-testid="upload-media-input"]').first();
  await input.waitFor({ state: 'attached' });
  await input.setInputFiles([...testImages().slice(0, 4), notMedia]);
  await page.getByText(/0 of 5 · 5 failed/).first().waitFor({ timeout: 90_000 });
  console.log('saved', await shot(page, 'upload-panel-320-failed'));
}).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
