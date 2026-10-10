// Rewrites the skin's `@videojs-skin/*` imports to relative paths.
//
// The Shadcn CLI can only emit alias imports, and this repo does not allow tsconfig `paths`
// in apps (scripts/validate-policy.ts, rule 19), so the alias is resolved once, here, right
// after a pull. Safe to re-run: files that are already relative are left alone.
//
//   node apps/web/src/vendor/videojs/rewrite-imports.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALIAS = '@videojs-skin/';
const vendorRoot = dirname(fileURLToPath(import.meta.url));

/** Any quoted module specifier that starts with the alias: `from '…'`, `import '…'`, `import('…')`. */
const SPECIFIER = /(['"])@videojs-skin\/([^'"]+)\1/g;

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(full);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });

const toRelative = (fromFile, aliasedPath) => {
  const target = join(vendorRoot, aliasedPath);
  const rel = relative(dirname(fromFile), target).split(sep).join(posix.sep);
  return rel.startsWith('.') ? rel : `./${rel}`;
};

let filesChanged = 0;
let importsRewritten = 0;

for (const file of sourceFiles(vendorRoot)) {
  const before = readFileSync(file, 'utf8');
  const after = before.replace(SPECIFIER, (_match, quote, aliasedPath) => {
    importsRewritten += 1;
    return `${quote}${toRelative(file, aliasedPath)}${quote}`;
  });
  if (after !== before) {
    writeFileSync(file, after);
    filesChanged += 1;
  }
}

console.log(`Rewrote ${importsRewritten} import(s) in ${filesChanged} file(s).`);

const leftovers = sourceFiles(vendorRoot).filter((file) =>
  readFileSync(file, 'utf8').includes(ALIAS),
);
if (leftovers.length > 0) {
  console.error(`Still referencing ${ALIAS} after the rewrite:\n  ${leftovers.join('\n  ')}`);
  process.exit(1);
}
