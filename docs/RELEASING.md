# Releasing PixelForge Prompt Studio

Product releases use stable SemVer tags (`v1.0.0`); package, UI, archive and OCI
labels share that version. Schema/export remain V2. Never force-push a release
tag or replace a versioned image: corrections get a new patch version. `latest`
is a convenience alias updated only by the stable release workflow; operators
should pin the digest in `container-image.txt`.

## Gates and permissions

CI runs from a fresh checkout on Ubuntu 24.04: pinned Node, `npm ci`, docs/license
checks, TypeScript, unit/UI tests, production build, npm vulnerability audit,
Chromium/Firefox, full-history secret scan and workflow lint. It builds and
restarts the read-only Compose service, tests its real browser behavior and
static Caddy configuration, boots the ARM64 image using QEMU, and rejects high
or critical runtime-image vulnerabilities. No ignored finding is a release gate.

The runtime uses the upstream unprivileged **Alpine slim** image: only NGINX
and its required libraries, without the unused image-filter/TIFF modules in
the larger variant. Scan both resulting architecture images, not just their base.

The 2026-09-12 base scan reports **CVE-2025-60876** at medium severity in
BusyBox-related packages (three matches for one advisory). It concerns control
characters in URLs supplied to BusyBox wget. The studio's only wget invocation
uses the fixed loopback `/healthz` URL, never user input; NGINX does not expose a
shell or CGI endpoint. Keep this finding visible in reports and recheck upstream
base updates; it is not suppressed or presented as fixed. See the
[CVE record](https://github.com/CVEProject/cvelistV5/blob/main/cves/2025/60xxx/CVE-2025-60876.json).

The release workflow reuses these checks before building the AMD64/ARM64 OCI
index. Actions and Docker bases are pinned to reviewed hashes. Only the image
job has `packages: write`; only final publication has `contents: write`, OIDC
and attestation permission. Authentication uses the short-lived Actions token
and runner-temporary Docker configuration, never repository secrets or files.
Fork PRs receive no publishing permissions. Source releases require an exact
stable version tag and an already reviewed **public** repository.

The `release` environment is the publication boundary. Configure its deployment
branch policy to approved version tags (and required reviewers where supported
and another maintainer is available). The initial owner-authorized release is
reviewed in [the release gate](https://github.com/kleiveist/PixelForgeStudio/issues/9).
Do not manufacture a second reviewer or imply protections unavailable on the
repository's plan. The separate dry-run environment cannot publish.

## Dry run and reproducibility

Use the Node version in [`.node-version`](../.node-version), npm from that Node
distribution, GNU tar, and a clean checkout of the intended commit:

```bash
npm ci
npm run verify
npm run test:browser:install
npm run test:browser
npm run package:release
npm run check:release
```

CI repeats the build/package steps and compares all checksums. The static
archive has sorted paths, fixed ownership and commit-time timestamps. SBOM
timestamps and identifiers are deterministic; local directory names are
normalized. Build from the same commit, pinned Node/npm and lockfile. The
runtime SBOM is selected from npm's full inventory using the production entries
in the lockfile. This avoids npm's `--omit=dev` traversal dropping runtime React
packages in this graph. Release checks require every runtime component and its
dependency edges; malformed or incomplete inventories stop publication. The
explicit `ALLOW_DIRTY_RELEASE=1` escape hatch is for local script tests only,
never release evidence. Generated files stay in ignored `release/`.

For the complete multi-architecture rehearsal:

```bash
gh workflow run release.yml --ref main -f dry_run=true
gh run list --workflow release.yml
```

This runs all gates and stores the verified static assets and a multi-arch OCI
archive as temporary Actions artifacts. It does **not** log into GHCR, push an
image, create a tag, change visibility or publish a GitHub release. Download
the static artifact and run `npm run check:release` at its exact source commit.
An untrusted Actions artifact is not an approved release.

BuildKit records image SBOM/provenance attestations. Their build timestamps can
change the OCI index digest on rebuild, so byte-identical **container digests**
are not promised. Static asset reproducibility is tested; container identity
is guaranteed by the published digest and source/version labels. Public release
assets also have GitHub provenance where supported (`gh attestation verify`).

## Publication order

1. Review compatibility, artifacts, runtime/dependency scan reports, full Git
   history, notices and the [release notes](releases/v1.0.0.md). Resolve every
   code/security blocker. Commit and push the approved source; wait for green CI.
2. Review repository visibility, then make the repository public. Enable
   private vulnerability reporting and restrict the `release` environment to
   approved tags. The owner explicitly authorizes these external changes.
3. Create and push `v1.0.0` from the approved commit. The Release workflow reruns
   gates, publishes the versioned multi-arch image and its stable `latest` alias.
4. **First GHCR publication only:** GitHub initially creates a private package.
   In the package settings, change its visibility to **Public**. GitHub's package
   visibility control is a web UI setting, not a public REST visibility setter.
   The workflow intentionally stops before creating a public GitHub release if
   an unauthenticated digest pull fails. After changing visibility, re-run
   **failed jobs only**, not the successful image build. Do not overwrite tags.
5. The final job checks version/revision, anonymously pulls the digest, starts it
   with Compose, runs Chromium/Firefox including language/JSON round-trips, then
   publishes release notes, archive, checksums, runtime SBOM, license notices,
   immutable image identity and provenance. Inspect the public download too.
6. Enable GitHub Pages with Actions as the source and dispatch `pages.yml` on
   `v1.0.0`. It deploys the exact checksum-verified release archive, not a rebuild.
   Verify HTTPS and all browser smokes using
   `PLAYWRIGHT_BASE_URL=https://kleiveist.github.io/PixelForgeStudio/` before
   setting the repository homepage. Upload the [social preview](../public/social-preview.png)
   in repository Settings when an authenticated web session is available.
7. Close presentation/pipeline acceptance items that require published URLs,
   then the release gate. The live-homepage and published-artifact checks happen
   after publication; all code/security checks happen before it. This avoids a
   circular dependency without waiving a gate.

## Outputs and rollback

`pixelforge-prompt-studio-1.0.0.tar.gz` contains the site at its archive root,
`LICENSE`, `THIRD_PARTY_NOTICES.md` and `release.json`. `SHA256SUMS` covers each
download, including `sbom.cdx.json` and `container-image.txt`. No source maps,
caches, workflow files, auth files or development dependencies ship in the site.

Release 1.0.0 ships an application/runtime-dependency SBOM alongside the site;
the container also carries a BuildKit SBOM including OS packages. Audit the
container separately: npm's runtime SBOM does not describe Alpine/NGINX.

Before upgrades, export JSON from Settings and record the current image digest.
For rollback restore that digest/site directory; never delete browser storage.
See [self-hosting](SELF-HOSTING.md) for complete commands and origin constraints.

Official references: [GitHub package access](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility),
[build attestations](https://docs.docker.com/build/metadata/attestations/), and
[GitHub artifact attestations](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds).
