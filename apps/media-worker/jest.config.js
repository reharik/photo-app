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
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/tests/**/*.tests.ts', '**/?(*.)+(spec|test).?([mc])[jt]s?(x)'],
  transformIgnorePatterns: [
    'node_modules/(?!(@reharik/smart-enum|@reharik/smart-enum-knex|case-anything|@network|koa|@koa|only|http-errors|statuses)/)',
  ],
};
