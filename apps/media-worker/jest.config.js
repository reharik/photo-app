export default {
  displayName: 'media-worker',
  preset: '../../infra/config/jest/jest.preset.cjs',
  testEnvironment: 'node',
  maxWorkers: 1,
  forceExit: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|mjs)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@packages/contracts$': '<rootDir>/../../packages/foundation/contracts/src/index.ts',
    '^@packages/infrastructure$': '<rootDir>/../../packages/foundation/infrastructure/src/index.ts',
    '^@packages/media-core$': '<rootDir>/../../packages/context/media-core/src/index.ts',
    '^@packages/heic-converter$': '<rootDir>/../../packages/context/heic-converter/src/index.ts',
    // Loading the real `@react-email/components` barrel pulls in tailwindcss, which
    // fails under Jest ESM; the worker never renders emails (see the mock file).
    '^@react-email/components$': '<rootDir>/src/tests/__mocks__/reactEmailComponents.js',
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  // Jest owns `*.tests.ts`; single-`test` files (`*.test.ts`, e.g. the exif
  // suites) run under node:test via `node --test` (see project.json), so keep
  // them out of jest to avoid double-running / runner-API clashes.
  testMatch: ['**/tests/**/*.tests.ts'],
  testPathIgnorePatterns: ['/node_modules/', '\\.test\\.ts$'],
  transformIgnorePatterns: [
    'node_modules/(?!(@reharik/smart-enum|@reharik/smart-enum-knex|case-anything|@network|koa|@koa|only|http-errors|statuses)/)',
  ],
};
