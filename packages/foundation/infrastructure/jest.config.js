export default {
  displayName: 'infrastructure',
  preset: '../../../tooling/jest/jest.preset.cjs',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|js|mjs)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
};
