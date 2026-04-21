export default {
  displayName: 'web',
  preset: '../../infra/config/jest/jest.preset.cjs',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs'],
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: [],
  testMatch: ['**/src/tests/**/*.tests.ts', '**/src/tests/**/*.tests.tsx'],
};
