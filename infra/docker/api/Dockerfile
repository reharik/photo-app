ARG NODE_VERSION=22
# Monorepo path under repo root (e.g. apps/api). Nx project name and npm --workspace name are
# derived as basename(APP_WORKSPACE_PATH) → nx run <leaf>; npm --workspace=@app/<leaf>.

ARG APP_WORKSPACE_PATH=apps/api

# =============================================================================
# BASE IMAGE SETUP
# =============================================================================
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /repo
RUN apt-get update && apt-get install -y git vim && rm -rf /var/lib/apt/lists/*
RUN corepack enable || true

# =============================================================================
# DEPENDENCY PREPARATION STAGES
# =============================================================================

FROM base AS deps-dev-staging
ARG APP_WORKSPACE_PATH=apps/api
COPY package.json package-lock.json ./
COPY ${APP_WORKSPACE_PATH}/package.json ${APP_WORKSPACE_PATH}/package.json
# Copy other workspaces (e.g. packages/*) so npm sees them; otherwise "No workspaces found!"
COPY packages/ packages/
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

FROM base AS deps-prod
ARG APP_WORKSPACE_PATH=apps/api
COPY package.json package-lock.json ./
COPY ${APP_WORKSPACE_PATH}/package.json ${APP_WORKSPACE_PATH}/package.json
COPY packages/ packages/
RUN npm ci --workspaces --include-workspace-root --omit=dev --ignore-scripts

# =============================================================================
# BUILD STAGE
# =============================================================================

FROM base AS build
ARG APP_WORKSPACE_PATH=apps/api
WORKDIR /repo
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY . .
ENV NX_DAEMON=false
RUN npx nx reset || true

# Codegen (GraphQL, contracts enums, IoC) is driven by the Nx task graph.
RUN npx nx build "$(basename "${APP_WORKSPACE_PATH}")" --configuration=production

RUN test -f "${APP_WORKSPACE_PATH}/src/di/generated/ioc-manifest.ts" || \
  (echo "ERROR: ioc-manifest.ts was not generated for ${APP_WORKSPACE_PATH}" && exit 1)
RUN test -f "${APP_WORKSPACE_PATH}/src/di/generated/ioc-registry.types.ts" || \
  (echo "ERROR: ioc-registry.types.ts was not generated for ${APP_WORKSPACE_PATH}" && exit 1)

# =============================================================================
# RUNTIME STAGES
# =============================================================================

FROM node:${NODE_VERSION}-slim AS dev
ARG APP_WORKSPACE_PATH=apps/api
ENV APP_WORKSPACE_PATH=${APP_WORKSPACE_PATH}
ENV NODE_ENV=development
WORKDIR /app
RUN apt-get update && apt-get install -y git vim && rm -rf /var/lib/apt/lists/*
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY . .
RUN npm install -g nodemon
EXPOSE 3000
CMD ["sh", "-c", "npm run dev --workspace=@app/$(basename \"$APP_WORKSPACE_PATH\")"]

FROM node:${NODE_VERSION}-slim AS production
ARG APP_WORKSPACE_PATH=apps/api
ENV APP_WORKSPACE_PATH=${APP_WORKSPACE_PATH}
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /repo/${APP_WORKSPACE_PATH}/dist ./${APP_WORKSPACE_PATH}/dist

# Copy generated IoC files to dist for source-map/tooling parity.
RUN mkdir -p "${APP_WORKSPACE_PATH}/dist/di/generated"
COPY --from=build /repo/${APP_WORKSPACE_PATH}/src/di/generated/ioc-manifest.ts ./${APP_WORKSPACE_PATH}/dist/di/generated/ioc-manifest.ts
COPY --from=build /repo/${APP_WORKSPACE_PATH}/src/di/generated/ioc-registry.types.ts ./${APP_WORKSPACE_PATH}/dist/di/generated/ioc-registry.types.ts
RUN test -f "${APP_WORKSPACE_PATH}/dist/di/generated/ioc-registry.types.ts" || \
  (echo "ERROR: ioc-registry.types.ts was not copied to dist for ${APP_WORKSPACE_PATH}" && exit 1)

# Copy server startup script (copy from build stage where source files are)
RUN mkdir -p "${APP_WORKSPACE_PATH}/dist/scripts"
COPY --from=build /repo/${APP_WORKSPACE_PATH}/src/scripts/serverStartUpProd.sh ./${APP_WORKSPACE_PATH}/dist/scripts/serverStartUpProd.sh
RUN chmod +x "${APP_WORKSPACE_PATH}/dist/scripts/serverStartUpProd.sh"

COPY --from=deps-prod /repo/node_modules ./node_modules

RUN (test -d node_modules/dotenv || \
     (echo "ERROR: dotenv not found in node_modules" && \
      echo "Checking what's in node_modules..." && ls node_modules | grep -E '^d' | head -20 && exit 1)) && \
    echo "✓ dotenv verified in node_modules"

EXPOSE 3000
CMD ["sh", "-c", "exec sh ${APP_WORKSPACE_PATH}/dist/scripts/serverStartUpProd.sh"]

FROM production AS staging
ENV NODE_ENV=staging
COPY --from=deps-dev-staging /repo/node_modules ./node_modules
COPY infra/config/eslint/eslint-shared.js ./eslint-shared.js
