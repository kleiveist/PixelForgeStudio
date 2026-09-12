#!/usr/bin/env bash
set -euo pipefail
caddy_image='caddy:2-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648'
for config in Caddyfile Caddyfile.static; do
  docker run --rm --network none --read-only --tmpfs /tmp \
    --mount "type=bind,src=$PWD/deploy,dst=/etc/caddy,readonly" \
    "$caddy_image" caddy validate --config "/etc/caddy/$config" --adapter caddyfile
done

# Extract the already-built release candidate and exercise the static example.
proxy_test_dir=$(mktemp -d)
copy_container=$(docker create pixelforge-prompt-studio:1.0.0)
caddy_container=''
cleanup() {
  if [ -n "$caddy_container" ]; then docker logs "$caddy_container"; docker rm -f "$caddy_container"; fi
  docker rm "$copy_container"
}
trap cleanup EXIT
docker cp "$copy_container:/usr/share/nginx/html" "$proxy_test_dir/site"
sed 's/prompt.example.com/:8080/' deploy/Caddyfile.static > "$proxy_test_dir/Caddyfile"
caddy_container=$(docker run -d --read-only --tmpfs /tmp --tmpfs /config --tmpfs /data \
  -p 127.0.0.1:18081:8080 \
  --mount "type=bind,src=$proxy_test_dir/site,dst=/srv/pixelforge/current,readonly" \
  --mount "type=bind,src=$proxy_test_dir/Caddyfile,dst=/etc/caddy/Caddyfile,readonly" \
  "$caddy_image")
curl --fail --retry 20 --retry-connrefused --retry-delay 1 http://127.0.0.1:18081/healthz
PIXELFORGE_TEST_URL=http://127.0.0.1:18081 node scripts/smoke-http.mjs
