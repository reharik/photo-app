export default {
  displayName: 'heic-converter',
  preset: '../../../infra/config/jest/jest.preset.cjs',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|js|mjs)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@packages/heic-converter$': '<rootDir>/src/index.ts',
  },
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
};
