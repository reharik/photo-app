# Jest config

- **jest.preset.cjs**: Shared Nx/Jest preset. App projects reference it from repo root (e.g. `preset: '../../jest.preset.cjs'`) or from infra (e.g. `preset: '<root>/infra/config/jest/jest.preset.cjs'`).
- Per-project **jest.config.js** (displayName, testEnvironment, setupFiles, moduleNameMapper) stay in the app; they extend this preset and add app-specific mocks and setup.
