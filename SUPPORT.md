# Support

Start with the [README](README.md), [self-hosting guide](docs/SELF-HOSTING.md)
and [language/data behavior](docs/LOCALIZATION.md). Support is volunteer and
best effort; there is no guaranteed response time or managed hosting service.

For a reproducible defect, use the bug-report form in
[Issues](https://github.com/kleiveist/PixelForgeStudio/issues/new/choose).
For a usage question, choose the question form. Include the app version,
browser/OS, deployment mode, expected behavior and a small invented example.
Search existing reports first. English and German are both welcome.

Do not attach real profile exports, tokens, full logs containing private data,
private hostnames or unredacted screenshots. Never clear browser storage as a
first troubleshooting step. Export your workspace JSON and test with a separate
browser profile; a server restart cannot restore browser-local data.

Common fixes:

- `vite: command not found`: run `npm ci --include=dev` with Node 22/npm 10.
- Empty workspace on another URL: export/import from the original origin.
- Storage unavailable: check browser permissions/quota and export before closing.
- Container unhealthy or old UI: inspect health/logs and the deployment guide;
  do not disable HTTPS verification or publish a development server.

Feature proposals should explain the user problem and compatibility impact,
not just request a new dependency. Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md).
Security findings belong in the [private reporting process](SECURITY.md),
not public bug reports. [Community channels and governance](COMMUNITY.md)
describe where official announcements appear.
