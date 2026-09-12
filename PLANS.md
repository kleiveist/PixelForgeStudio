# Release work — PixelForge Prompt Studio 1.0.0

Current task: **#7 — repository presentation**. Next: **#8 — release pipeline**,
then #9 publication. The verified homepage for #7 is finalized during the
publication gate, not set to an untested placeholder.

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
| #7 Presentation | Prepared; final deployment check pending | About/topics set, original preview and screenshots, tag-only Pages workflow; homepage remains unset until healthy |
| #8–#9 | Open | [Release gate](https://github.com/kleiveist/PixelForgeStudio/issues/9) |

This short ledger is the only active work plan. Retired implementation
instructions are recoverable from Git history, not maintained in the source tree.
Runtime boundaries live in [architecture](src/ARCHITECTURE.md); data guarantees
live in [compatibility](docs/COMPATIBILITY.md). No new prompt phase is implied.
