# Unified monorepo image. Build context: repo root.
#   Node apps:  docker build -f infra/docker/Dockerfile --target runtime-node --build-arg APP_NAME=api .
#   Web (SPA):  docker build -f infra/docker/Dockerfile --target runtime-web --build-arg APP_NAME=web .
#   Dev:        docker build -f infra/docker/Dockerfile --target dev --build-arg APP_NAME=api .

# === Build stage ===
FROM node:20 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json tsconfig.json ./
COPY infra infra
COPY packages packages
COPY apps apps

ENV NX_DAEMON=false
RUN npm ci
# ts-patch + tsx: ioc generate loads apps/*/src/ioc.config.ts (ESM .ts) during gen:container.
RUN npx ts-patch install
ENV NODE_OPTIONS='--import tsx'

ARG APP_NAME
RUN rm -rf .nx/cache node_modules/.cache
RUN npx nx build "${APP_NAME}" --skip-nx-cache --verbose
# RUN npx nx build "${APP_NAME}"

# Vite does not emit shell scripts or IoC sources into dist; copy when present (api, media-worker).
RUN if [ -f "apps/${APP_NAME}/src/scripts/serverStartUpProd.sh" ]; then \
  mkdir -p "apps/${APP_NAME}/dist/scripts" && \
  cp "apps/${APP_NAME}/src/scripts/serverStartUpProd.sh" "apps/${APP_NAME}/dist/scripts/" && \
  chmod +x "apps/${APP_NAME}/dist/scripts/serverStartUpProd.sh"; \
  fi && \
  if [ -f "apps/${APP_NAME}/src/di/generated/ioc-composed.ts" ]; then \
  mkdir -p "apps/${APP_NAME}/dist/di/generated" && \
  cp "apps/${APP_NAME}/src/di/generated/ioc-composed.ts" "apps/${APP_NAME}/dist/di/generated/" && \
  cp "apps/${APP_NAME}/src/di/generated/ioc-manifest.ts" "apps/${APP_NAME}/dist/di/generated/" && \
  cp "apps/${APP_NAME}/src/di/generated/ioc-registry.types.ts" "apps/${APP_NAME}/dist/di/generated/"; \
  fi

# === Production dependencies (runtime node_modules without devDependencies) ===
FROM node:20 AS deps-prod
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps apps
COPY packages packages
COPY infra infra
RUN npm ci --omit=dev

# === Runtime: Node apps (api, media-worker) ===
FROM node:20-slim AS runtime-node
WORKDIR /app

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/${APP_NAME}/dist ./apps/${APP_NAME}/dist
COPY --from=deps-prod /app/node_modules ./node_modules

RUN test -f "apps/${APP_NAME}/dist/scripts/serverStartUpProd.sh" || \
  (echo "ERROR: serverStartUpProd.sh missing for ${APP_NAME}" && exit 1)
RUN chmod +x "apps/${APP_NAME}/dist/scripts/serverStartUpProd.sh"

EXPOSE 3000
CMD ["sh", "-c", "exec sh apps/${APP_NAME}/dist/scripts/serverStartUpProd.sh"]

# === Runtime: Web (static assets) ===
FROM nginx:alpine AS runtime-web

ARG APP_NAME=web
COPY --from=builder /app/apps/${APP_NAME}/dist /usr/share/nginx/html
COPY infra/docker/nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# === Dev (docker compose: source mounted over apps/ and packages/) ===
FROM node:20-slim AS dev
WORKDIR /app

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json tsconfig.json ./
COPY infra infra
COPY packages packages
COPY apps apps

RUN npm ci

EXPOSE 3000
CMD ["sh", "-c", "sh apps/${APP_NAME}/src/scripts/serverStartUpDev.sh"]
