# Self-hosting and operations

PixelForge Prompt Studio 1.0.0 is a static client-side app. No database,
backend, AI API key, account service, or GPU is required. It creates prompts,
not images. Each browser owns its profiles, settings and drafts.

## Prerequisites

- A Linux amd64 or arm64 host with [Docker Engine and Compose v2](https://docs.docker.com/engine/install/)
  (Compose 2.24+), or a static HTTPS web server.
- For a source build: Git; Node is supplied by the Docker build stage.
- Without Docker: Node.js 22 (22.12+) and npm 10 for `npm ci` and the build.
- For public HTTPS: a domain you control, correct DNS, ports 80/443 reachable,
  and an installed reverse proxy such as [Caddy](https://caddyserver.com/docs/install).

The configurations below assume a dedicated fresh host. Merge with existing
proxy configuration instead of overwriting another service's files. The
`prompt.example.com` domain is a reserved example, never a project endpoint.

## Deploy from source

After v1.0.0 is published:

```bash
git clone --branch v1.0.0 https://github.com/kleiveist/PixelForgeStudio.git
cd PixelForgeStudio
docker compose config --quiet
docker compose up --build -d --wait --wait-timeout 90
curl --fail http://127.0.0.1:8080/healthz
docker compose ps
```

During release preparation use the reviewed candidate commit instead of the
not-yet-published tag. The same build/start/health commands run in CI from a
clean checkout. Visit `http://127.0.0.1:8080` locally. A remote host's loopback
address is not your workstation; use HTTPS below, or an SSH tunnel for review:

```bash
ssh -L 8080:127.0.0.1:8080 user@your-server
```

### Configuration

Set Compose variables in the shell or copy `.env.example` to an untracked
`.env` and edit it. These values are not secrets.

| Setting | When applied | Default / meaning |
| --- | --- | --- |
| `PIXELFORGE_PORT` | Compose container recreation | Host port, `8080` |
| `PIXELFORGE_BIND` | Compose container recreation | `127.0.0.1`; loopback only |
| `PIXELFORGE_IMAGE` | Compose deployment | Locally built `pixelforge-prompt-studio:1.0.0` |
| `PIXELFORGE_REVISION` | Image build | Optional source commit metadata |
| Language/theme/start view | Browser Settings | Stored locally, not container environment |

For example, `PIXELFORGE_PORT=8090 docker compose up --build -d --wait` maps
8090 to the fixed internal port 8080. Adjust the proxy upstream too.
Binding `0.0.0.0` deliberately exposes HTTP to the host's network; enforce
firewall rules and do not bypass HTTPS for public operation.

There is no runtime `VITE_*` configuration. Any future Vite build-time
variable would be public JavaScript, never a place for credentials.

## HTTPS reverse proxy

Keep the app on loopback. On a dedicated host with Caddy installed:

```bash
sudo install -m 644 deploy/Caddyfile /etc/caddy/Caddyfile
sudoedit /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

Replace `prompt.example.com` with your real domain before reloading. Caddy
manages certificates and redirects HTTP to HTTPS when DNS and inbound ports
are correct. The app supplies CSP and other security headers; the proxy adds
HSTS. Do not enable HSTS on a domain that cannot reliably serve HTTPS.

```bash
curl --fail --head https://your-real-domain/
curl --fail https://your-real-domain/healthz
```

Expect HTTPS, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, and `Strict-Transport-Security`. The supplied
CSP permits self-hosted scripts, local SVG/data/blob images and inline style
attributes used by React, but no inline scripts, eval, frames, external
fonts or object plugins. Configure access control at the proxy if required;
the app does not implement authentication. Trust the hosting operator:
anyone able to replace its JavaScript can read data in that origin.

## Published image, updates and rollback

The public image becomes available only after the release gate completes.
Use an explicit version or, preferably, the release's immutable image digest.

```bash
export PIXELFORGE_IMAGE=ghcr.io/kleiveist/pixelforge-prompt-studio:1.0.0
docker compose pull
docker compose up -d --no-build --wait --wait-timeout 90
docker compose images
```

No registry login is needed for a public release. Digest pinning uses
`ghcr.io/kleiveist/pixelforge-prompt-studio@sha256:THE_RELEASE_DIGEST`; replace
the final placeholder with the exact digest in release metadata.

Before an upgrade, export each browser's workspace, read the release notes,
record the current image reference/digest and keep the previous image. Set
`PIXELFORGE_IMAGE` to the new reviewed version, then run `pull` and `up` above.
For rollback, set it back to the recorded previous digest and run `up` again.
Do not use `--build` when deploying a published image. Avoid `latest` for
auditable production deployments; version tags are never intentionally moved.

There is no automatic database migration on the server. An older client may
not understand data written by a future release: restore a compatible JSON
backup rather than assuming a container rollback also rolls back browser data.

## Static hosting without Docker

Build with `npm ci && npm run build`, or extract the verified static archive
from the GitHub release. Serve only `dist/` (or the archive's static root), not
the repository, `node_modules`, environment files or source-control metadata.
Do not use Vite's development or preview server in production.

On a dedicated Caddy host, copy the build to a new version directory, preserving
the old one for rollback:

```bash
sudo install -d /srv/pixelforge/releases/1.0.0
sudo cp -a dist/. /srv/pixelforge/releases/1.0.0/
sudo ln -sfn releases/1.0.0 /srv/pixelforge/current
sudo install -m 644 deploy/Caddyfile.static /etc/caddy/Caddyfile
sudoedit /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
```

Use a new directory for every release; do not overwrite a served version.
`current` must be a symlink, not a directory. The server must be able to read
the files. Replace the example domain. Point `current` back to the retained
version to roll back. Deploy during a maintenance window or atomically switch
the symlink; clients with an old page open may need a reload.

The supported container path is the web root. Navigation uses query parameters
such as `/?studio=prompt&view=wizard`, not separate directory routes. The build
uses relative asset URLs: a static subdirectory deployment must include the
whole artifact and a trailing slash (for example `/studio/`). Do not rewrite
asset requests to HTML. Arbitrary nested history routes and runtime base-path
configuration are not supported. Subpaths on one origin share the same data.

## Data ownership and backups

In Settings → JSON export, export the entire workspace before upgrades,
browser resets, or moving hosts. Import via Settings → JSON import and review
the confirmation before applying it. Profile-only exports do not replace a
full workspace backup. Test a backup in a separate browser profile.

- Data belongs to the browser profile and origin (scheme + hostname + port),
  not the server. HTTP→HTTPS, domain or port changes require export/import.
- Clearing site data, private-mode expiry, browser quotas or device loss can
  remove local work. A server/container backup does **not** back it up.
- `docker compose down` and container replacement do not touch browser data.
  No data volume is needed. Never mount a browser profile into the container.
- JSON may contain your project descriptions; store backups privately and do
  not attach them unredacted to public issues.
- There is no cross-device sync, multi-user database, analytics or cloud
  translation. First load still requires the static host; no offline/PWA
  installation guarantee is made.

## Monitoring, removal and troubleshooting

```bash
docker compose ps
docker compose logs --tail 100 app
docker compose restart app
docker compose down
```

The healthcheck validates the static HTTP process, not an individual browser's
storage or a complete user journey. Logs rotate at 10 MB × 3. Remove the
specific unused image only after recording rollback information; clearing
browser data is a separate, destructive user action.

| Symptom | Check |
| --- | --- |
| `vite: command not found` locally | Run `npm ci` with dev dependencies; use Node 22/npm 10. |
| Port already allocated | Choose an unused `PIXELFORGE_PORT`; adjust proxy and URL. |
| Unhealthy container | Read logs and `/healthz`; retain writable `/tmp` and UID 101. |
| Blank page / wrong MIME type | Deploy the entire build, keep `/assets/` 404s, check trailing slash. |
| Old UI / missing chunk after upgrade | Reload; HTML must revalidate. Do not cache HTML immutably. |
| Empty profiles on another URL | Export/import from the original origin; do not reset site data. |
| Saves unavailable | Check browser storage permission/quota and private mode; export before closing. |
| Certificate failure | Verify DNS, 80/443 reachability and proxy logs; never disable certificate verification. |

Tested baseline: automated Chromium and Firefox smokes. Other browsers are
not release-certified. Follow the [release checklist](https://github.com/kleiveist/PixelForgeStudio/issues/9)
for final published-image and HTTPS verification.

`scripts/smoke-proxy.sh` validates both Caddy examples with networking disabled
and runs the static-hosting example against the built artifact on a fresh CI
host. It does not obtain a certificate for the reserved example domain;
operators must verify DNS, certificate issuance and HTTPS on their own domain.

References: [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https),
[reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy),
[Compose interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).
