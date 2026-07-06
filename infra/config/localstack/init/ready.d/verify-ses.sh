#!/bin/bash
# LocalStack init hook — runs automatically once LocalStack is ready.
#
# SES identity verification lives in LocalStack's ephemeral runtime state, and
# `make docker/dev/down` removes the localstack_data volume (`--volumes`), so the
# verified sender is wiped on every teardown. Without a verified Source, SES
# SendEmail fails. Re-verify here on each boot so it's never a manual step.
#
# Must match FROM_EMAIL in docker-compose/docker-compose.dev.yml (api + worker).
set -e

awslocal ses verify-email-identity --email-address test@example.com

echo "[init] SES identity verified: test@example.com"
