#!/usr/bin/env bash
set -euo pipefail
image='pixelforge-arm64-smoke:local'
docker buildx build --platform linux/arm64 --load --tag "$image" .
container_id=$(docker run --detach --platform linux/arm64 --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=16m,mode=1777 --cap-drop ALL \
  --security-opt no-new-privileges:true --publish 127.0.0.1:18082:8080 "$image")
trap 'docker logs "$container_id"; docker rm -f "$container_id"' EXIT
curl --fail --silent --show-error --retry 20 --retry-all-errors --retry-delay 1 http://127.0.0.1:18082/healthz
PIXELFORGE_TEST_URL=http://127.0.0.1:18082 node scripts/smoke-http.mjs
