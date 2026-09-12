# Production container

Full operator guide: [Self-hosting, HTTPS, backup, updates and rollback](../docs/SELF-HOSTING.md).

Requires Docker Engine and Compose v2. Build from the repository root:

```bash
docker compose up --build -d --wait
curl --fail http://127.0.0.1:8080/healthz
docker compose logs --tail 50
docker compose down
```

Set `PIXELFORGE_PORT=8090` to change the host port. The default bind address is
loopback; set `PIXELFORGE_BIND` deliberately when placing the service behind
a proxy or exposing it to your network. `.env.example` lists non-secret
Compose variables. They are not Vite runtime configuration.

The digest-pinned multi-stage image serves only the built SPA via unprivileged
NGINX on port 8080. It runs as UID/GID 101, with read-only root, dropped Linux
capabilities, no privilege escalation, and only a small transient `/tmp`.
There are no application data volumes. Profiles, settings, and drafts live
in each browser's localStorage; back them up with JSON export.

Supported navigation uses query parameters (`?studio=prompt&view=settings`);
the app is deployed at the web root. HTML is revalidated, hashed assets are
immutable, missing assets return 404, and `/healthz` returns `ok`.
HTTPS belongs at the reverse proxy. Do not run Vite's dev/preview server in
production. Both base-image indexes include Linux amd64 and arm64.

CI runs `bash scripts/smoke-compose.sh`: it verifies user/read-only settings,
health, all route responses, MIME types, cache/security headers, and a full
down/up cycle. Each run uses its own Compose project; run it only on a test
host with port 18080 available. No images are published by this workflow.

References: [Docker multi-stage/pinning guidance](https://docs.docker.com/build/building/best-practices/),
[unprivileged NGINX](https://github.com/nginx/docker-nginx-unprivileged).
