# Release work — PixelForge Prompt Studio 1.0.0

Current task: **#9 — final release gate**; #8 CI/dry run is running.
The live homepage and GitHub custom-image upload for #7, and published-image
criteria for #8, remain open until their external checks succeed.

The user authorized all nine issues, separate English emoji Conventional
Commits, a push after each commit, and closing each verified issue as Done.

| Issue | Status | Evidence |
| --- | --- | --- |
| #1 Localization | Done / pushed / closed | `ddd19f0`; 644 tests, 16 browser smokes |
| #2 Branding | Done / pushed / closed | `5afc54f`; 647 tests, SVG checks, 16 browser smokes |
| #3 Docker/Compose | Done / pushed / closed | `bde4189`; [clean Compose CI](https://github.com/kleiveist/PixelForgeStudio/actions/runs/34686091393) |
| #4 Self-hosting | Done / pushed / closed | `dcbea7a`, `a97287f`; [proxy/static-host CI](https://github.com/kleiveist/PixelForgeStudio/actions/runs/34686437928) |
| #5 Documentation | Done / pushed / closed | `991f192`; 59 retired files removed, 54 checked links, 647 tests |
| #6 Community | Done / pushed / closed | `722f152`, `30c742c`; fresh install, 647 tests, 16 browser smokes, GitHub health-file detection |
| #7 Presentation | Implemented / pushed; live checks pending | `a2a2b79`, `2675cd4`; About/topics, embedded preview/screenshots, tag-only Pages; custom GitHub upload needs a web session |
| #8 Pipeline | Implemented / pushed; final checks pending | `ba2c5cc`, `bfb4445`, `56be779`; 648 tests, 20 real-container browser smokes; slim AMD64 base has no high/critical scan findings; full two-architecture scan and dry run in CI |
| #9 Publication | Final candidate; not yet published | [Release gate](https://github.com/kleiveist/PixelForgeStudio/issues/9); full-history scan: 73 commits, no leaks; final visibility/tag/package/HTTPS checks still required |

No tag, GitHub release or public image is claimed by this source snapshot.
External acceptance and issue closures are recorded in the linked release gate.
The initial GHCR package must be made Public in its web settings before the
workflow can finish its anonymous pull gate. The GitHub-specific social preview
also needs an authenticated web upload; committing the image is not that upload.

This short ledger is the only active work plan. Retired implementation
instructions are recoverable from Git history, not maintained in the source tree.
Runtime boundaries live in [architecture](src/ARCHITECTURE.md); data guarantees
live in [compatibility](docs/COMPATIBILITY.md). No new prompt phase is implied.
