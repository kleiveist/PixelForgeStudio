#!/usr/bin/env bash
set -euo pipefail
export COMPOSE_PROJECT_NAME="pixelforge-smoke-${GITHUB_RUN_ID:-local}"
export PIXELFORGE_PORT="${PIXELFORGE_PORT:-18080}"
export PIXELFORGE_TEST_URL="http://127.0.0.1:${PIXELFORGE_PORT}"
trap 'docker compose logs --no-color; docker compose down --remove-orphans' EXIT
docker compose up --build -d --wait --wait-timeout 90
container_id=$(docker compose ps -q app)
test "$(docker inspect --format '{{.Config.User}}' "$container_id")" = '101:101'
test "$(docker inspect --format '{{.HostConfig.ReadonlyRootfs}}' "$container_id")" = 'true'
docker compose exec -T app sh -c 'test ! -d /app/node_modules && test ! -d /usr/share/nginx/html/.git && test ! -d /root/.npm'
node scripts/smoke-http.mjs
docker compose down
docker compose up -d --no-build --wait --wait-timeout 90
node scripts/smoke-http.mjs
