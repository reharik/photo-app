# Photo App

A full-stack application scaffolding (API + web, auth, shared contracts).

## Project Structure

This is a monorepo using npm workspaces and Nx for build orchestration:

- `api/` - Backend API (Koa + TypeScript)
- `web/` - Frontend web application (React + TypeScript)
- `contracts/` - Shared types and validation schemas (Typia)

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL (or SQLite for development)

## Getting Started

### Installation

```bash
npm install
```

### Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### Development

Run both API and web in development mode:

```bash
# Terminal 1 - API
npm run dev:api

# Terminal 2 - Web
npm run dev:web
```

Or run them individually:

```bash
npm run dev:api   # API only
npm run dev:web   # Web only
```

### Building

```bash
# Build all packages
npm run build

# Build for production
npm run build:web
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci
```

### Linting & Formatting

```bash
# Lint all projects
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Database Commands

```bash
# Run migrations
npm run db:migrate

# Run migrations in production
npm run db:migrate:prod

# Seed database
npm run db:seed
```

## Scripts

- `npm run dance` - Run format, build, lint, and test (full check)
- `npm run nuke` - Clean install and rebuild everything
- `npm run nuke:lite` - Clean build without reinstalling dependencies
- `npm run graph` - View project dependency graph

## Environment Variables

Copy `.env` to configure your local environment. Key variables:

- `DATABASE_URL` - Database connection string
- `API_PORT` - API server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `CORS_ORIGIN` - Allowed CORS origin for web app

## Architecture

### API (`api/`)

- **Framework**: Koa
- **Database**: Knex.js with PostgreSQL/SQLite
- **Validation**: Typia
- **Auth**: JWT-based authentication

### Web (`web/`)

- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: React Query
- **Styling**: Styled Components
- **Routing**: React Router

### Contracts (`contracts/`)

- **Purpose**: Shared TypeScript types and validation
- **Validation**: Typia for runtime type validation
- **Usage**: Imported by both API and web

## Development Workflow

1. Make changes to code
2. Run `npm run format` to format code
3. Run `npm run lint` to check for issues
4. Run `npm run test` to ensure tests pass
5. Run `npm run build` to verify build works

Or simply run `npm run dance` to do all of the above!

## License

ISC
