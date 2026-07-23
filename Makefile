APP_NAME := homeroll
ENV_NAME ?= dev

# Per-clone overrides (git-ignored). A secondary working copy drops in a
# Makefile.local that sets `ENV_NAME := <name>` and points EXTRA_DEV_FILES at a
# local port-remap compose file — giving it a fully separate stack (distinct
# COMPOSE_PROJECT_NAME => own containers/network/volumes). Primary has no
# Makefile.local, so this is a no-op there.
-include Makefile.local

COMPOSE_PROJECT_NAME := $(APP_NAME)-$(ENV_NAME)

BASE_FILES := -f infra/config/docker-compose/base.yml

DEV_FILES := \
	-f infra/config/docker-compose/dev.yml \
	-f docker-compose/docker-compose.dev.yml \
	$(EXTRA_DEV_FILES)

define compose_dev
APP_NAME=$(APP_NAME) \
COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) \
docker compose --project-directory $(CURDIR) $(BASE_FILES) $(DEV_FILES)
endef

temp-raw:
	$(compose_dev) logs api | grep -i -A3 'restarting due to' | head -40

temp:
	$(compose_dev) logs api | grep -oiP 'due to changes?:?\s*\K.*' \
  | xargs -n1 dirname 2>/dev/null | sort | uniq -c | sort -rn


docker/dev/recreate-api:
	$(compose_dev) rm -sf api
	$(compose_dev) up -d api

docker/dev/recreate-worker:
	$(compose_dev) rm -sf media-worker
	$(compose_dev) up -d media-worker

docker/dev/build:
	$(compose_dev) build --no-cache;

docker/dev/up:
	$(compose_dev) up --build;

docker/dev/up/no-cache:
	$(compose_dev) build --no-cache
	$(compose_dev) up
	
docker/dev/down:
	$(compose_dev) down --rmi local --remove-orphans --volumes

docker/dev/migrate:
	$(compose_dev) exec -T api npm run db:migrate:local --workspace=@app/api


docker/dev/seed:
	$(compose_dev) exec -T api npm run db:seed:local --workspace=@app/api

# make dc CMD="exec localstack awslocal ses verify-email-identity --email-address test@example.com"
dc:
	$(compose_dev) $(CMD)