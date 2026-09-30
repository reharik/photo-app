export default {
  displayName: 'infrastructure',
  preset: '../../../tooling/jest/jest.preset.cjs',
  testEnvironment: 'node',
  maxWorkers: 1,
  forceExit: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|mjs)$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
  testMatch: ['**/src/**/*.tests.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@reharik/smart-enum|@reharik/smart-enum-knex|case-anything)/)',
  ],
};
