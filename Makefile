APP_NAME := photo-app
ENV_NAME ?= dev
COMPOSE_PROJECT_NAME := $(APP_NAME)-$(ENV_NAME)

BASE_FILES := -f infra/config/docker-compose/base.yml

DEV_FILES := \
	-f infra/config/docker-compose/dev.yml \
	-f docker-compose/docker-compose.dev.yml

define compose_dev
APP_NAME=$(APP_NAME) \
COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) \
docker compose --project-directory $(CURDIR) $(BASE_FILES) $(DEV_FILES)
endef

docker/dev/recreate-api:
	$(compose_dev) rm -sf api
	$(compose_dev) up -d api

docker/dev/build:
	$(compose_dev) build --no-cache;

docker/dev/up:
	$(compose_dev) up --build;

docker/dev/down:
	$(compose_dev) down --rmi local --remove-orphans --volumes

docker/dev/migrate:
	$(compose_dev) exec -T api npm run db:migrate:local --workspace=@app/api


docker/dev/seed:
	$(compose_dev) exec -T api npm run db:seed:local --workspace=@app/api
