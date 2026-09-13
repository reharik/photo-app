APP_NAME := homeroll
ENV_NAME ?= dev

# Per-clone overrides (git-ignored). A secondary working copy drops in a
# Makefile.local that sets `ENV_NAME := <name>` for its own stack namespace
# (distinct COMPOSE_PROJECT_NAME => own containers/network/volumes) and
# `export`s DEV_DB_PORT / DEV_API_PORT / DEV_LOCALSTACK_PORT to keep off the
# primary clone's host ports. Those are read by docker-compose-dev.yml, which
# defaults them to 5433 / 3001 / 4566. Primary clone has no Makefile.local, so
# this is a no-op there.
#
# This used to work by layering an extra `-f` port-remap file on top of the dev
# chain. It is env vars now: the dev stack is ONE flat file and nothing is
# merged over it. `export` is required — plain `:=` keeps the value inside make.
-include Makefile.local

COMPOSE_PROJECT_NAME := $(APP_NAME)-$(ENV_NAME)

# APP_NAME= is vestigial for compose (docker-compose-dev.yml spells `homeroll`
# literally, as the generated prod overlay always did) and --project-directory
# is now redundant with the file at the repo root. Both are kept here so this
# commit changes exactly one thing; remove them separately if you want to.
define compose_dev
APP_NAME=$(APP_NAME) \
COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) \
docker compose --project-directory $(CURDIR) -f docker-compose-dev.yml
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

# make dc CMD="exec localstack awslocal ses verify-email-identity --email-address invites@homeroll.app"
dc:
	$(compose_dev) $(CMD)