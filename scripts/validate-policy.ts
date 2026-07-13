#!/usr/bin/env tsx
/**
 * Monorepo policy validator (docs/Monorepo.md §14 + rules 18–19).
 * Reports pass/fail per rule; exits 1 if any hard rule fails.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SMART_ENUM_ESLINT_RULE_NAMES = [
  'no-smart-enum-reference-equality',
  '@photoapp/no-smart-enum-reference-equality',
  'smart-enum/no-reference-equality',
];

type CheckResult = {
  rule: string;
  passed: boolean;
  violations: string[];
  /** Soft spot: report but do not fail the run */
  warningOnly?: boolean;
};

const pass = (rule: string): CheckResult => ({ rule, passed: true, violations: [] });

const fail = (rule: string, violations: string[]): CheckResult => ({
  rule,
  passed: false,
  violations,
});

const warn = (rule: string, violations: string[]): CheckResult => ({
  rule,
  passed: true,
  violations,
  warningOnly: true,
});

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;

/** tsconfig.json allows comments and trailing commas */
const readTsConfigJson = <T>(filePath: string): T => {
  const content = readText(filePath);
  const { config, error } = ts.parseConfigFileTextToJson(filePath, content);
  if (error) {
    throw new Error(`Failed to parse ${rel(filePath)}: ${error.messageText}`);
  }
  return config as T;
};

const fileExists = (filePath: string): boolean => fs.existsSync(filePath);

const readText = (filePath: string): string => fs.readFileSync(filePath, 'utf8');

const rel = (absolutePath: string): string => path.relative(REPO_ROOT, absolutePath);

const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', '.git', 'coverage', 'test-results']);

const findFiles = (dir: string, predicate: (name: string) => boolean): string[] => {
  const results: string[] = [];
  if (!fileExists(dir)) {
    return results;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIR_NAMES.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, predicate));
    } else if (predicate(entry.name)) {
      results.push(full);
    }
  }
  return results;
};

/** Workspace packages only: packages/<group>/<name>/package.json and packages/e2e/package.json */
const listPackageJsonUnderPackages = (): string[] => {
  const packagesRoot = path.join(REPO_ROOT, 'packages');
  const results: string[] = [];

  if (!fileExists(packagesRoot)) {
    return results;
  }

  for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const topPath = path.join(packagesRoot, entry.name);
    const topPkgJson = path.join(topPath, 'package.json');

    if (fileExists(topPkgJson)) {
      results.push(topPkgJson);
      continue;
    }

    for (const sub of fs.readdirSync(topPath, { withFileTypes: true })) {
      if (!sub.isDirectory() || SKIP_DIR_NAMES.has(sub.name)) {
        continue;
      }
      const pkgJson = path.join(topPath, sub.name, 'package.json');
      if (fileExists(pkgJson)) {
        results.push(pkgJson);
      }
    }
  }

  return results;
};

const listWorkspacePackageJsons = (): string[] => {
  const files: string[] = [path.join(REPO_ROOT, 'package.json')];
  for (const app of ['api', 'media-worker', 'web']) {
    const p = path.join(REPO_ROOT, 'apps', app, 'package.json');
    if (fileExists(p)) {
      files.push(p);
    }
  }
  files.push(...listPackageJsonUnderPackages());
  return files;
};

const projectJsonPathForPackageDir = (packageDir: string): string | undefined => {
  const direct = path.join(packageDir, 'project.json');
  if (fileExists(direct)) {
    return direct;
  }
  return undefined;
};

const isTestRunnerPackage = (packageDir: string): boolean => {
  const projectPath = projectJsonPathForPackageDir(packageDir);
  if (!projectPath) {
    return packageDir.endsWith(`${path.sep}e2e`);
  }
  const project = readJson<{ tags?: string[] }>(projectPath);
  return (project.tags ?? []).includes('scope:test-runner');
};

const isLibraryPackageDir = (packageDir: string): boolean => {
  if (!packageDir.startsWith(path.join(REPO_ROOT, 'packages'))) {
    return false;
  }
  return !isTestRunnerPackage(packageDir);
};

const THIN_BUILD_RE = /^(nx build \S+|nx run \S+:build)$/;

// --- Rule 1: dist entry points ---
const checkLibraryPackageJsonDistEntries = (): CheckResult => {
  const rule = '1. Library package.json main/types/exports point at dist/';
  const violations: string[] = [];

  for (const pkgJsonPath of listPackageJsonUnderPackages()) {
    const packageDir = path.dirname(pkgJsonPath);
    if (!isLibraryPackageDir(packageDir)) {
      continue;
    }

    const pkg = readJson<Record<string, unknown>>(pkgJsonPath);
    const label = rel(pkgJsonPath);

    const main = pkg.main;
    if (typeof main !== 'string' || !main.startsWith('./dist/')) {
      violations.push(`${label}: main must start with "./dist/" (got ${JSON.stringify(main)})`);
    }

    const types = pkg.types;
    if (typeof types !== 'string' || !types.startsWith('./dist/')) {
      violations.push(`${label}: types must start with "./dist/" (got ${JSON.stringify(types)})`);
    }

    const exports = pkg.exports as Record<string, unknown> | undefined;
    const rootExport = exports?.['.'] as Record<string, unknown> | undefined;
    if (!rootExport) {
      violations.push(`${label}: exports["."] is required`);
    } else {
      const defaultEntry = rootExport.default;
      if (typeof defaultEntry !== 'string' || !defaultEntry.startsWith('./dist/')) {
        violations.push(
          `${label}: exports["."].default must start with "./dist/" (got ${JSON.stringify(defaultEntry)})`,
        );
      }
      const typesEntry = rootExport.types;
      if (typeof typesEntry !== 'string' || !typesEntry.startsWith('./dist/')) {
        violations.push(
          `${label}: exports["."].types must start with "./dist/" (got ${JSON.stringify(typesEntry)})`,
        );
      }
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rules 2 & 3: thin build scripts ---
const checkBuildScriptsThin = (): CheckResult => {
  const rule = '2. Every build script is a thin nx alias (no shell composition)';
  const violations: string[] = [];

  for (const pkgJsonPath of listWorkspacePackageJsons()) {
    const pkg = readJson<{ scripts?: Record<string, string> }>(pkgJsonPath);
    const build = pkg.scripts?.build;
    if (build === undefined) {
      continue;
    }

    const trimmed = build.trim();
    const label = rel(pkgJsonPath);

    if (/&&|;|\|/.test(trimmed)) {
      violations.push(
        `${label}: build script contains shell composition: ${JSON.stringify(build)}`,
      );
      continue;
    }
    if (/rimraf/i.test(trimmed)) {
      violations.push(`${label}: build script must not use rimraf: ${JSON.stringify(build)}`);
      continue;
    }
    if (!THIN_BUILD_RE.test(trimmed)) {
      violations.push(
        `${label}: build script must match "nx build <name>" or "nx run <name>:build" (got ${JSON.stringify(build)})`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

const checkBuildScriptsTargetCorrectPackage = (): CheckResult => {
  const rule = '3. Every build script builds the correct nx project';
  const violations: string[] = [];

  for (const pkgJsonPath of listWorkspacePackageJsons()) {
    const pkg = readJson<{ scripts?: Record<string, string> }>(pkgJsonPath);
    const build = pkg.scripts?.build?.trim();
    if (!build) {
      continue;
    }

    const packageDir = path.dirname(pkgJsonPath);
    const projectPath = projectJsonPathForPackageDir(packageDir);
    if (!projectPath) {
      continue;
    }

    const nxName = readJson<{ name: string }>(projectPath).name;
    const label = rel(pkgJsonPath);

    const buildMatch = build.match(/^nx build (\S+)$/);
    const runMatch = build.match(/^nx run (\S+):build$/);
    const scriptTarget = buildMatch?.[1] ?? runMatch?.[1];

    if (!scriptTarget) {
      violations.push(
        `${label}: could not parse nx project from build script ${JSON.stringify(build)}`,
      );
      continue;
    }
    if (scriptTarget !== nxName) {
      violations.push(
        `${label}: build script targets "${scriptTarget}" but project.json name is "${nxName}"`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- tsconfig helpers ---
type TsConfig = {
  extends?: string;
  compilerOptions?: {
    baseUrl?: string;
    outDir?: string;
    paths?: Record<string, string[]>;
  };
};

const resolveTsConfigPath = (fromFile: string, extendsValue: string): string => {
  const base = path.dirname(fromFile);
  const candidate = path.resolve(base, extendsValue);
  const withJson =
    candidate.endsWith('.json') || fileExists(candidate) ? candidate : `${candidate}.json`;
  return withJson;
};

const loadTsConfigChain = (tsconfigPath: string): TsConfig[] => {
  const chain: TsConfig[] = [];
  let current = tsconfigPath;
  const seen = new Set<string>();

  while (fileExists(current) && !seen.has(current)) {
    seen.add(current);
    const config = readTsConfigJson<TsConfig>(current);
    chain.push(config);
    if (!config.extends) {
      break;
    }
    current = resolveTsConfigPath(current, config.extends);
  }

  return chain;
};

const reachesTsconfigBaseJson = (tsconfigPath: string): boolean => {
  let current = tsconfigPath;
  const seen = new Set<string>();

  while (fileExists(current) && !seen.has(current)) {
    seen.add(current);
    if (path.basename(current) === 'tsconfig.base.json') {
      return true;
    }
    const config = readTsConfigJson<TsConfig>(current);
    if (!config.extends) {
      return false;
    }
    current = resolveTsConfigPath(current, config.extends);
  }

  return false;
};

const mergedPathsFromChain = (chain: TsConfig[]): Record<string, string[]> => {
  const merged: Record<string, string[]> = {};
  for (const config of [...chain].reverse()) {
    const paths = config.compilerOptions?.paths;
    if (paths) {
      Object.assign(merged, paths);
    }
  }
  return merged;
};

const hasPackagesSourcePaths = (paths: Record<string, string[]>): boolean =>
  Object.entries(paths).some(([key, values]) => {
    if (!key.startsWith('@packages/')) {
      return false;
    }
    return values.some((v) => v.includes('/src/') || v.includes('\\src\\'));
  });

// --- Rule 4: tsconfig extends + outDir ---
const checkLibraryTsconfigExtendsAndOutDir = (): CheckResult => {
  const rule = '4. Shared packages tsconfig extends base and outDir is ./dist';
  const violations: string[] = [];

  for (const pkgJsonPath of listPackageJsonUnderPackages()) {
    const packageDir = path.dirname(pkgJsonPath);
    if (!isLibraryPackageDir(packageDir)) {
      continue;
    }

    const tsconfigPath = path.join(packageDir, 'tsconfig.json');
    const label = rel(tsconfigPath);

    if (!fileExists(tsconfigPath)) {
      violations.push(`${label}: missing tsconfig.json`);
      continue;
    }

    if (!reachesTsconfigBaseJson(tsconfigPath)) {
      violations.push(`${label}: extends chain must reach tsconfig.base.json`);
    }

    const chain = loadTsConfigChain(tsconfigPath);
    const local = chain[0]?.compilerOptions;
    const outDir = local?.outDir;
    if (outDir !== './dist') {
      violations.push(
        `${label}: compilerOptions.outDir must be "./dist" (got ${JSON.stringify(outDir)})`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 5: baseUrl ---
const checkLibraryTsconfigBaseUrl = (): CheckResult => {
  const rule = '5. Shared packages tsconfig has baseUrl "."';
  const violations: string[] = [];

  for (const pkgJsonPath of listPackageJsonUnderPackages()) {
    const packageDir = path.dirname(pkgJsonPath);
    if (!isLibraryPackageDir(packageDir)) {
      continue;
    }

    const tsconfigPath = path.join(packageDir, 'tsconfig.json');
    if (!fileExists(tsconfigPath)) {
      continue;
    }

    const chain = loadTsConfigChain(tsconfigPath);
    const local = chain[0]?.compilerOptions;
    if (local?.baseUrl !== '.') {
      violations.push(
        `${rel(tsconfigPath)}: compilerOptions.baseUrl must be "." (got ${JSON.stringify(local?.baseUrl)})`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 6: project.json targets ---
const LIBRARY_REQUIRED_TARGETS = ['clean', 'barrels', 'build', 'test', 'lint', 'dev'] as const;
const TEST_RUNNER_REQUIRED_TARGETS = ['test', 'typecheck', 'lint'] as const;

const checkProjectJsonRequiredTargets = (): CheckResult => {
  const rule = '6. project.json has required targets per package kind';
  const violations: string[] = [];

  for (const pkgJsonPath of listPackageJsonUnderPackages()) {
    const packageDir = path.dirname(pkgJsonPath);
    const projectPath = projectJsonPathForPackageDir(packageDir);
    if (!projectPath) {
      violations.push(`${rel(packageDir)}: missing project.json`);
      continue;
    }

    const project = readJson<{ name: string; targets?: Record<string, unknown> }>(projectPath);
    const targetNames = new Set(Object.keys(project.targets ?? {}));
    const label = rel(projectPath);

    if (isTestRunnerPackage(packageDir)) {
      for (const required of TEST_RUNNER_REQUIRED_TARGETS) {
        if (!targetNames.has(required)) {
          violations.push(`${label}: test-runner missing target "${required}"`);
        }
      }
      if (targetNames.has('build')) {
        violations.push(`${label}: test-runner must not have build target`);
      }
      continue;
    }

    if (!isLibraryPackageDir(packageDir)) {
      continue;
    }

    for (const required of LIBRARY_REQUIRED_TARGETS) {
      if (!targetNames.has(required)) {
        violations.push(`${label}: library missing target "${required}"`);
      }
    }

    // contracts' codegen target is named "gen-enums" (see its project.json and the
    // codegen chain in CLAUDE.md); accept either name.
    if (
      project.name === 'contracts' &&
      !targetNames.has('codegen') &&
      !targetNames.has('gen-enums')
    ) {
      violations.push(`${label}: contracts must have a codegen target (codegen or gen-enums)`);
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 7: no relative package imports in apps ---
const checkNoAppRelativePackageImports = (): CheckResult => {
  const rule = '7. No app imports package source via relative path';
  const violations: string[] = [];
  const patterns = [
    /from\s+['"]\.\.\/\.\.\/\.\.\/packages\//,
    /from\s+['"]\.\.\/\.\.\/packages\//,
    /from\s+['"]\.\.\/packages\//,
    /import\s+['"]\.\.\/\.\.\/\.\.\/packages\//,
    /import\s+['"]\.\.\/\.\.\/packages\//,
    /import\s+['"]\.\.\/packages\//,
  ];

  for (const app of ['api', 'media-worker', 'web']) {
    const srcDir = path.join(REPO_ROOT, 'apps', app, 'src');
    if (!fileExists(srcDir)) {
      continue;
    }

    for (const filePath of findFiles(
      srcDir,
      (name) => name.endsWith('.ts') || name.endsWith('.tsx'),
    )) {
      const content = readText(filePath);
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          violations.push(`${rel(filePath)}: relative import into packages/`);
          break;
        }
      }
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 8: app tsconfig paths ---
const effectiveAppTsconfigPaths = (tsconfigPath: string): Record<string, string[]> => {
  const chain = loadTsConfigChain(tsconfigPath);
  const localPaths = chain[0]?.compilerOptions?.paths;

  // Explicit opt-out: paths: {} overrides inherited @packages/* → src mappings (§4, rule 19).
  if (localPaths !== undefined) {
    return localPaths;
  }

  return mergedPathsFromChain(chain.slice(1));
};

const checkAppTsconfigNoPackagesSourcePaths = (): CheckResult => {
  const rule = '8. App tsconfig has no paths mapping @packages/* to source';
  const violations: string[] = [];

  for (const app of ['api', 'media-worker', 'web']) {
    const tsconfigPath = path.join(REPO_ROOT, 'apps', app, 'tsconfig.json');
    if (!fileExists(tsconfigPath)) {
      violations.push(`apps/${app}/tsconfig.json: missing`);
      continue;
    }

    const effectivePaths = effectiveAppTsconfigPaths(tsconfigPath);

    if (hasPackagesSourcePaths(effectivePaths)) {
      violations.push(
        `${rel(tsconfigPath)}: paths map @packages/* to source (${JSON.stringify(effectivePaths)})`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 9: internal deps use "*" ---
const checkInternalDepsAreWildcard = (): CheckResult => {
  const rule = '9. All @packages/* dependencies use "*"';
  const violations: string[] = [];
  const depFields = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ] as const;

  for (const pkgJsonPath of listWorkspacePackageJsons()) {
    const pkg = readJson<Record<string, Record<string, string>>>(pkgJsonPath);

    for (const field of depFields) {
      const deps = pkg[field];
      if (!deps) {
        continue;
      }

      for (const [name, version] of Object.entries(deps)) {
        if (!name.startsWith('@packages/')) {
          continue;
        }
        if (version !== '*') {
          violations.push(
            `${rel(pkgJsonPath)}: ${field}["${name}"] must be "*" (got ${JSON.stringify(version)})`,
          );
        }
      }
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 10: barrelsby.json ---
const checkLibraryBarrelsbyConfig = (): CheckResult => {
  const rule = '10. Library packages have barrelsby.json';
  const violations: string[] = [];

  for (const pkgJsonPath of listPackageJsonUnderPackages()) {
    const packageDir = path.dirname(pkgJsonPath);
    if (!isLibraryPackageDir(packageDir)) {
      continue;
    }

    const barrelsbyPath = path.join(packageDir, 'barrelsby.json');
    if (!fileExists(barrelsbyPath)) {
      violations.push(`${rel(packageDir)}: missing barrelsby.json`);
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 11: barrels up-to-date ---
const gitChangedFiles = (): Set<string> => {
  const tracked = execSync('git diff --name-only', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  const untracked = execSync('git ls-files --others --exclude-standard', {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  }).trim();
  const names = [
    ...(tracked ? tracked.split('\n') : []),
    ...(untracked ? untracked.split('\n') : []),
  ];
  return new Set(names);
};

const isLikelyBarrelFile = (repoRelativePath: string): boolean =>
  repoRelativePath.includes('/src/') && repoRelativePath.endsWith('/index.ts');

const checkBarrelsUpToDate = (runBarrels: boolean): CheckResult => {
  const rule = '11. Barrels are up-to-date (git clean after barrels run)';
  if (!runBarrels) {
    return warn(rule, ['Skipped (--skip-barrels). Run without flag before CI.']);
  }

  const changedBefore = gitChangedFiles();

  try {
    execSync('npx nx run-many --target=barrels --all', {
      cwd: REPO_ROOT,
      stdio: 'inherit',
    });
  } catch {
    return fail(rule, ['nx run-many --target=barrels --all exited non-zero']);
  }

  const changedAfter = gitChangedFiles();
  const newChanges = [...changedAfter].filter((f) => !changedBefore.has(f));
  const barrelChanges = newChanges.filter(isLikelyBarrelFile);

  if (barrelChanges.length === 0) {
    return pass(rule);
  }

  return fail(rule, [
    'Barrels produced new changes; re-run barrels:all and commit:',
    ...barrelChanges.map((f) => `  ${f}`),
  ]);
};

// --- Rule 12: syncpack lint ---
const checkSyncpackLint = (): CheckResult => {
  const rule = '12. syncpack lint finds no external dep version drift';
  try {
    execSync('npx syncpack lint', { cwd: REPO_ROOT, stdio: 'pipe', encoding: 'utf8' });
    return pass(rule);
  } catch (err) {
    const execErr = err as { stdout?: string; stderr?: string };
    const output = [execErr.stdout, execErr.stderr].filter(Boolean).join('\n').trim();
    return fail(rule, output ? output.split('\n') : ['syncpack lint exited non-zero']);
  }
};

// --- Rule 13: smart enum ESLint rule presence ---
const grepRepoForSmartEnumEslintRule = (): { found: boolean; matches: string[] } => {
  const matches: string[] = [];
  const searchRoots = [
    path.join(REPO_ROOT, 'eslint.config.js'),
    path.join(REPO_ROOT, 'eslint.repo.config.js'),
    path.join(REPO_ROOT, 'infra/config/eslint'),
  ];

  const scanFile = (filePath: string): void => {
    if (!fileExists(filePath) || !filePath.endsWith('.js')) {
      return;
    }
    const content = readText(filePath);
    for (const ruleName of SMART_ENUM_ESLINT_RULE_NAMES) {
      if (content.includes(ruleName)) {
        matches.push(`${rel(filePath)}: mentions ${ruleName}`);
      }
    }
  };

  for (const root of searchRoots) {
    if (fileExists(root) && fs.statSync(root).isFile()) {
      scanFile(root);
    } else if (fileExists(root)) {
      for (const file of findFiles(root, (n) => n.endsWith('.js'))) {
        scanFile(file);
      }
    }
  }

  return { found: matches.length > 0, matches };
};

const checkSmartEnumEslintRule = (): CheckResult => {
  const rule = '13. Smart-enum === ESLint rule (presence check; violations enforced by ESLint)';
  const { found, matches } = grepRepoForSmartEnumEslintRule();

  if (found) {
    return pass(rule);
  }

  return warn(rule, [
    'ESLint rule for smart-enum reference equality not found in workspace config (known soft spot per §0.1).',
    `Searched for: ${SMART_ENUM_ESLINT_RULE_NAMES.join(', ')}`,
    'Implement the rule in a follow-up; validate-policy will hard-fail once it exists.',
  ]);
};

// --- Rule 14: generated paths in .gitignore ---
// NOTE: contracts' graphqlSmartEnums.ts is intentionally NOT listed here. Although it is a
// codegen output, it lives in a foundation package that every other package consumes AS SOURCE
// (tsconfig paths / jest moduleNameMapper), so it is committed and must be present in a fresh
// checkout before any typecheck/test — like the hand-authored enums beside it.
const GENERATED_PATHS = [
  'apps/api/src/graphql/generated/',
  'apps/api/src/di/generated/',
  'apps/media-worker/src/di/generated/',
  'packages/context/media-core/src/di/generated/',
  'apps/web/src/graphql/generated/',
] as const;

const SAMPLE_FILES_PER_PATH: Record<string, string> = {
  'apps/api/src/graphql/generated/': 'apps/api/src/graphql/generated/schema.graphql',
  'apps/api/src/di/generated/': 'apps/api/src/di/generated/ioc-manifest.ts',
  'apps/media-worker/src/di/generated/': 'apps/media-worker/src/di/generated/ioc-manifest.ts',
  'packages/context/media-core/src/di/generated/':
    'packages/context/media-core/src/di/generated/ioc-manifest.ts',
  'apps/web/src/graphql/generated/': 'apps/web/src/graphql/generated/schema.graphql',
};

const isGitIgnored = (repoRelativePath: string): boolean => {
  try {
    execSync(`git check-ignore -q -- "${repoRelativePath}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

const checkGeneratedPathsGitignored = (): CheckResult => {
  const rule = '14. Generated code paths are in .gitignore';
  const violations: string[] = [];

  for (const generatedPath of GENERATED_PATHS) {
    const sample =
      SAMPLE_FILES_PER_PATH[generatedPath] ??
      (generatedPath.endsWith('/') ? `${generatedPath}.gitkeep-check` : generatedPath);

    if (!isGitIgnored(sample)) {
      violations.push(
        `${generatedPath}: not ignored (checked sample "${sample}" with git check-ignore)`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 15: no root Dockerfile ---
const checkNoRootDockerfile = (): CheckResult => {
  const rule = '15. No Dockerfile at repo root';
  const violations: string[] = [];

  for (const entry of fs.readdirSync(REPO_ROOT)) {
    const lower = entry.toLowerCase();
    if (lower === 'dockerfile' || lower.endsWith('.dockerfile')) {
      violations.push(rel(path.join(REPO_ROOT, entry)));
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 16: test-runner package shape ---
const checkTestRunnerPackageShape = (): CheckResult => {
  const rule = '16. Test-runner packages (e2e) have scope:test-runner and no publish fields/build';
  const violations: string[] = [];
  const e2eDir = path.join(REPO_ROOT, 'packages/e2e');
  const pkgJsonPath = path.join(e2eDir, 'package.json');
  const projectPath = path.join(e2eDir, 'project.json');

  if (!fileExists(pkgJsonPath) || !fileExists(projectPath)) {
    return fail(rule, ['packages/e2e must exist with package.json and project.json']);
  }

  const project = readJson<{ tags?: string[]; targets?: Record<string, unknown> }>(projectPath);
  if (!(project.tags ?? []).includes('scope:test-runner')) {
    violations.push(`${rel(projectPath)}: tags must include "scope:test-runner"`);
  }
  if (project.targets?.build) {
    violations.push(`${rel(projectPath)}: must not define build target`);
  }

  const pkg = readJson<Record<string, unknown>>(pkgJsonPath);
  for (const field of ['main', 'types', 'exports'] as const) {
    if (pkg[field] !== undefined) {
      violations.push(`${rel(pkgJsonPath)}: must not have "${field}"`);
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 17: test scripts exclude test-runner ---
const checkTestScriptsExcludeTestRunner = (): CheckResult => {
  const rule = '17. test:all and test:ci exclude tag:scope:test-runner';
  const violations: string[] = [];
  const rootPkg = readJson<{ scripts?: Record<string, string> }>(
    path.join(REPO_ROOT, 'package.json'),
  );
  const requiredFlag = '--exclude=tag:scope:test-runner';

  for (const scriptName of ['test:all', 'test:ci'] as const) {
    const script = rootPkg.scripts?.[scriptName];
    if (!script) {
      violations.push(`package.json: missing scripts.${scriptName}`);
      continue;
    }
    if (!script.includes(requiredFlag)) {
      violations.push(`package.json scripts.${scriptName}: must include ${requiredFlag}`);
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 18: nx scope tags ---
const checkNxScopeTags = (): CheckResult => {
  const rule = '18. Apps have scope:apps; library packages have scope:packages';
  const violations: string[] = [];

  for (const app of ['api', 'media-worker', 'web']) {
    const projectPath = path.join(REPO_ROOT, 'apps', app, 'project.json');
    if (!fileExists(projectPath)) {
      violations.push(`apps/${app}/project.json: missing`);
      continue;
    }
    const tags = readJson<{ tags?: string[] }>(projectPath).tags ?? [];
    if (!tags.includes('scope:apps')) {
      violations.push(`${rel(projectPath)}: tags must include "scope:apps"`);
    }
  }

  for (const pkgJsonPath of listPackageJsonUnderPackages()) {
    const packageDir = path.dirname(pkgJsonPath);
    if (isTestRunnerPackage(packageDir)) {
      continue;
    }
    const projectPath = projectJsonPathForPackageDir(packageDir);
    if (!projectPath) {
      continue;
    }
    const tags = readJson<{ tags?: string[] }>(projectPath).tags ?? [];
    // media-core deliberately carries scope:media (not scope:packages) so it is
    // excluded from tag:scope:packages batch targets — documented in CLAUDE.md.
    if (tags.includes('scope:media')) {
      continue;
    }
    if (!tags.includes('scope:packages')) {
      violations.push(`${rel(projectPath)}: tags must include "scope:packages"`);
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Rule 19: apps paths opt-out ---
const parentDefinesPaths = (chain: TsConfig[]): boolean => {
  if (chain.length < 2) {
    return false;
  }
  for (const config of chain.slice(1)) {
    const paths = config.compilerOptions?.paths;
    if (paths && Object.keys(paths).length > 0) {
      return true;
    }
  }
  return false;
};

const checkAppsPathsOptOut = (): CheckResult => {
  const rule = '19. Apps extending root tsconfig with paths must set paths: {}';
  const violations: string[] = [];

  for (const app of ['api', 'media-worker', 'web']) {
    const tsconfigPath = path.join(REPO_ROOT, 'apps', app, 'tsconfig.json');
    if (!fileExists(tsconfigPath)) {
      continue;
    }

    const chain = loadTsConfigChain(tsconfigPath);
    if (!parentDefinesPaths(chain)) {
      continue;
    }

    const localPaths = chain[0]?.compilerOptions?.paths;
    if (localPaths === undefined) {
      violations.push(
        `${rel(tsconfigPath)}: must explicitly set compilerOptions.paths to {} (parent defines paths)`,
      );
    } else if (Object.keys(localPaths).length !== 0) {
      violations.push(
        `${rel(tsconfigPath)}: compilerOptions.paths must be {} (got ${JSON.stringify(localPaths)})`,
      );
    }
  }

  return violations.length === 0 ? pass(rule) : fail(rule, violations);
};

// --- Main ---
const printResult = (result: CheckResult): void => {
  const prefix = result.warningOnly ? '⚠' : result.passed ? '✓' : '✗';
  const suffix = result.warningOnly ? ' (warning)' : '';
  console.log(`${prefix} ${result.rule}${suffix}`);
  for (const line of result.violations) {
    console.log(`    ${line}`);
  }
};

const main = (): void => {
  const args = process.argv.slice(2);
  const skipBarrels = args.includes('--skip-barrels');

  console.log('Monorepo policy validation\n');

  const results: CheckResult[] = [
    checkLibraryPackageJsonDistEntries(),
    checkBuildScriptsThin(),
    checkBuildScriptsTargetCorrectPackage(),
    checkLibraryTsconfigExtendsAndOutDir(),
    checkLibraryTsconfigBaseUrl(),
    checkProjectJsonRequiredTargets(),
    checkNoAppRelativePackageImports(),
    checkAppTsconfigNoPackagesSourcePaths(),
    checkInternalDepsAreWildcard(),
    checkLibraryBarrelsbyConfig(),
    checkBarrelsUpToDate(!skipBarrels),
    checkSyncpackLint(),
    checkSmartEnumEslintRule(),
    checkGeneratedPathsGitignored(),
    checkNoRootDockerfile(),
    checkTestRunnerPackageShape(),
    checkTestScriptsExcludeTestRunner(),
    checkNxScopeTags(),
    checkAppsPathsOptOut(),
  ];

  let hardFailures = 0;
  let warnings = 0;

  for (const result of results) {
    printResult(result);
    if (!result.passed && !result.warningOnly) {
      hardFailures += 1;
    }
    if (result.warningOnly && result.violations.length > 0) {
      warnings += 1;
    }
  }

  const passed = results.filter((r) => r.passed && !r.warningOnly).length;
  const warned = results.filter((r) => r.warningOnly).length;

  console.log('');
  if (hardFailures === 0) {
    console.log(
      `Summary: ${passed} passed, ${warned} warning(s), 0 failed — policy OK${warned ? ' (with warnings)' : ''}.`,
    );
    process.exit(0);
  } else {
    console.log(`Summary: ${hardFailures} failed, ${passed} passed, ${warned} warning(s).`);
    process.exit(1);
  }
};

main();
