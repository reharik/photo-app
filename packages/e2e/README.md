# @packages/e2e

Playwright end-to-end tests for the photo app. This package is a **test runner** (see `docs/Monorepo.md` §2.1): it is not imported by apps and does not produce a `dist/` artifact.

## Runtime prerequisites

Bring up the stack **before** running tests. Playwright does not start services for you.

| Requirement        | Default / notes                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **Web**            | `http://localhost:5173` — `npm run dev:web`                                                            |
| **API**            | `http://localhost:3001` — `npm run dev:api`                                                            |
| **media-worker**   | Background image processing for uploads — `npm run dev:worker` (or equivalent)                         |
| **Postgres**       | Same database as the API (`apps/api/.env`; e2e reads that file via `fixtures/env.ts`)                  |
| **Seed data**      | `apps/api/db/seeds/01_user.ts` — run `npm run db:seed:local --workspace=@app/api` if users are missing |
| **Object storage** | Whatever the API is configured for (S3 or local); uploads in tests go through the UI                   |

Override URLs and DB settings with `E2E_WEB_BASE_URL`, `E2E_API_BASE_URL`, and the same `POSTGRES_*` keys the API uses.

### Local stack (typical)

From the repo root, in separate terminals (or use your existing docker compose dev setup under `docker-compose/` / `infra/config/docker-compose/`):

```bash
npm run db:migrate:local --workspace=@app/api
npm run db:seed:local --workspace=@app/api
npm run dev:api
npm run dev:web
npm run dev:worker
```

Then run e2e from the root:

```bash
npm run test:e2e
```

## Running tests

| Command                       | Purpose                               |
| ----------------------------- | ------------------------------------- |
| `npm run test:e2e`            | Full suite (headless)                 |
| `npm run test:e2e:headed`     | Headed browser                        |
| `npm run test:e2e:ui`         | Playwright UI mode                    |
| `npm run test:e2e:trace`      | Record traces for all tests           |
| `npm run test:e2e:show-trace` | Open last trace viewer                |
| `npm run typecheck:e2e`       | `tsc --noEmit` for fixtures and specs |
| `npm run lint:e2e`            | ESLint for this package               |

Optional targets from the package directory: `nx run e2e:test:debug`, `nx run e2e:test:last-failed`, `nx run e2e:report`.

## Layout

- `tests/` — Playwright specs
- `fixtures/` — auth, DB helpers, upload helpers, custom `test` fixture
- `fixtures/assets/` — image files used by `grabTestImages`
- `playwright.config.ts` — base URL, reporters, timeouts

Tests create media and albums through the UI; DB access is for seed user lookup and teardown only.
