# syntax=docker/dockerfile:1.6
# Unified monorepo image. Build context: repo root.
#   Node apps:  docker build -f infra/docker/Dockerfile --target runtime-node --build-arg SERVICE_NAME=api .
#   Web (SPA):  docker build -f infra/docker/Dockerfile --target runtime-web --build-arg SERVICE_NAME=web .
#   Dev:        docker build -f infra/docker/Dockerfile --target dev --build-arg SERVICE_NAME=api .

# === Workspace manifests stage ===
# Extracts every package.json (and the lockfile) into a clean dir so npm ci
# can plan the workspace install without dragging in the rest of the source.
# This stage rebuilds on any source change but is cheap (just file copying).
FROM node:20 AS manifests
WORKDIR /src
COPY . .
RUN mkdir -p /manifests && \
    find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.nx/*" \
      -exec cp --parents {} /manifests/ \; && \
    cp package-lock.json /manifests/

# === npm-pinned base images ===
# node:20 ships npm 10, but package-lock.json is authored by npm 11 on dev hosts;
# npm 10's `npm ci` then rejects a perfectly valid lock as "out of sync". So pin
# npm 11 once here. Because this layer sits ABOVE the manifests copy, its cache
# key is just (base image + this line) — it builds once and is reused by every
# downstream `npm ci` stage; dep changes never re-run it. Keep the version in
# lockstep with the root package.json "packageManager" field. (There is no
# official node:20 image bundling npm 11, hence the one-time global install.)
FROM node:20 AS node-npm11
RUN npm install -g npm@11.6.2

FROM node:20-slim AS node-slim-npm11
RUN npm install -g npm@11.6.2

# === Build stage ===
FROM node-npm11 AS builder
WORKDIR /app
ENV NX_DAEMON=false

# Copy only the workspace manifests + lockfile first.
# This layer's cache key depends only on package.json/package-lock.json contents,
# not on app/package source code. So most code changes leave it intact.
COPY --from=manifests /manifests/ ./

# Install deps. Cache mount keeps npm's tarball cache between builds even
# when the layer itself is invalidated (e.g., a dep version bump).
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ts-patch install needs node_modules but no source; do it now while the
# install layer is fresh, so adding source later doesn't invalidate it.
RUN npx ts-patch install

# Now bring in the actual source. Changes here only invalidate from this
# point forward — npm ci above stays cached.
COPY nx.json tsconfig.base.json tsconfig.json ./
COPY infra infra
COPY packages packages
COPY apps apps

ENV NODE_OPTIONS='--import tsx'
ARG SERVICE_NAME
RUN npx nx build "${SERVICE_NAME}"

# Vite does not emit shell scripts or IoC sources into dist; copy when present (api, media-worker).
RUN if [ -f "apps/${SERVICE_NAME}/src/scripts/serverStartUpProd.sh" ]; then \
  mkdir -p "apps/${SERVICE_NAME}/dist/scripts" && \
  cp "apps/${SERVICE_NAME}/src/scripts/serverStartUpProd.sh" "apps/${SERVICE_NAME}/dist/scripts/" && \
  chmod +x "apps/${SERVICE_NAME}/dist/scripts/serverStartUpProd.sh"; \
  fi && \
  if [ -f "apps/${SERVICE_NAME}/src/di/generated/ioc-composed.ts" ]; then \
  mkdir -p "apps/${SERVICE_NAME}/dist/di/generated" && \
  cp "apps/${SERVICE_NAME}/src/di/generated/ioc-composed.ts" "apps/${SERVICE_NAME}/dist/di/generated/" && \
  cp "apps/${SERVICE_NAME}/src/di/generated/ioc-manifest.ts" "apps/${SERVICE_NAME}/dist/di/generated/" && \
  cp "apps/${SERVICE_NAME}/src/di/generated/ioc-registry.types.ts" "apps/${SERVICE_NAME}/dist/di/generated/"; \
  fi

# === Production dependencies (runtime node_modules without devDependencies) ===
FROM node-npm11 AS deps-prod
WORKDIR /app
COPY --from=manifests /manifests/ ./
# --ignore-scripts: postinstall runs ts-patch install, but ts-patch is a
# devDependency and isn't present in a prod-only install.
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts

# === Runtime: Node apps (api, media-worker) ===
FROM node:20-slim AS runtime-node
WORKDIR /app
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/apps/${SERVICE_NAME}/dist ./apps/${SERVICE_NAME}/dist
COPY --from=deps-prod /app/node_modules ./node_modules
RUN test -f "apps/${SERVICE_NAME}/dist/scripts/serverStartUpProd.sh" || \
  (echo "ERROR: serverStartUpProd.sh missing for ${SERVICE_NAME}" && exit 1)
RUN chmod +x "apps/${SERVICE_NAME}/dist/scripts/serverStartUpProd.sh"
EXPOSE 3000
CMD ["sh", "-c", "exec sh apps/${SERVICE_NAME}/dist/scripts/serverStartUpProd.sh"]

# === Runtime: Web (static assets) ===
FROM nginx:alpine AS runtime-web
ARG SERVICE_NAME=web
COPY --from=builder /app/apps/${SERVICE_NAME}/dist /usr/share/nginx/html
COPY infra/docker/nginx-web.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# === Dev (docker compose: source mounted over apps/ and packages/) ===
FROM node-slim-npm11 AS dev
WORKDIR /app
ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}
RUN apt-get update && apt-get install -y curl git && rm -rf /var/lib/apt/lists/*
COPY --from=manifests /manifests/ ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY nx.json tsconfig.base.json tsconfig.json ./
COPY infra infra
COPY packages packages
COPY apps apps
EXPOSE 3000
CMD ["sh", "-c", "sh apps/${SERVICE_NAME}/src/scripts/serverStartUpDev.sh"]
