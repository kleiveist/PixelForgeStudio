# Security policy

## Supported versions

From the publication of v1.0.0, the latest stable **1.x** release receives
best-effort security fixes while this release line is maintained. Upgrade to
the latest patch before reporting a known fixed issue. Older internal
prototypes, development branches and preview builds are not supported releases.
There is no paid SLA, fixed response deadline or promised lifetime. Changes
to this policy will be documented before ending support for the release line.

## Report privately

Use **Security → Advisories → Report a vulnerability**:
[private report](https://github.com/kleiveist/PixelForgeStudio/security/advisories/new).
Private vulnerability reporting is enabled as part of public-release setup.
Before that, or if the button is unavailable, open only a minimal issue asking
for a private security contact. Do **not** include the vulnerability details,
proof of concept, tokens, user exports, personal information or private hostnames
in public. Wait for an agreed private channel before sending details.

A useful private report includes affected version/image digest, impact,
minimal reproduction using invented data, environment and suggested mitigation
if known. Test only systems you own or are authorized to assess. Do not
extract other users' data, disrupt hosted instances or publish an uncoordinated
exploit in an issue. Coordinate disclosure and advisory timing with maintainers.
Reports are triaged best-effort; no bounty or fixed turnaround is promised.

## Scope and trust model

The application has no backend, authentication, analytics or server data
volume. Profiles and drafts live in origin-scoped browser storage. Hosting
operators and browser extensions capable of altering JavaScript are trusted;
local-first storage does not protect against a compromised client or host.
Export JSON privately and never publish real workspace backups in issues.

Serve production assets over HTTPS, retain the supplied CSP/security headers,
review pinned image/dependency updates and keep Docker, the proxy and browsers
patched. Pin deployments by image digest; do not store secrets in Vite variables,
Compose examples, source files or public artifacts. A static host's logs may
contain visitor network metadata; operate them according to your own policy.

Before a release, maintainers review dependencies, licenses, SBOM, artifact
contents, workflow permissions and Git history, then verify the published
artifacts. High/critical unresolved release defects block publication. See
[self-hosting](docs/SELF-HOSTING.md) for backup, upgrade and rollback limits.
