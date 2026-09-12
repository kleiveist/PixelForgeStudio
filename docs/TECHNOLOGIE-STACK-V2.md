# PixelForge Prompt Studio — technical stack (schema V2)

The public product is PixelForge Prompt Studio 1.0.0. The filename identifies
its stable data contract, not a second product version. It is a client-side
React application with no backend, animation-project engine or Python runtime.

## Stack

| Responsibility | Contract |
| --- | --- |
| Language | TypeScript, `strict: true` |
| UI/build | React, Vite, npm; Node.js 22 and npm 10 for the tested release |
| Forms | React Hook Form; Zod validation of all imported/edited data |
| Shared state | Context + `useReducer`; no duplicate global store |
| Persistence | Storage adapters over localStorage, JSON import/export |
| Styling | CSS Modules and semantic CSS custom properties |
| Icons | Original local SVG React components, no external icon/font service |
| Tests | Vitest, React Testing Library, jsdom; Chromium/Firefox Playwright |
| Hosting | Built static assets, unprivileged NGINX/Compose or static HTTPS host |

Exact dependency versions and integrity hashes are in `package-lock.json`.
Install with `npm ci`; the npm package remains private. Build/runtime image
digests are pinned in the [Dockerfile](../Dockerfile). See
[self-hosting](SELF-HOSTING.md) for deployment, not `vite` as a server.

## Architecture boundaries

- React is the UI layer. Domain functions stay pure TypeScript and must not
  import React, UI state, browser APIs or storage implementations.
- `src/domain/` owns profile resolution, capabilities, compatibility keys,
  category rules, migration and deterministic prompt generation.
- `src/schemas/` validates `unknown` data with Zod. Enum IDs, profile IDs,
  schema version 2 and export discriminators are stable contracts.
- `src/services/` owns storage, startup migration and browser download ports.
  Components do not independently access localStorage.
- Profile and Settings providers own shared persisted state. The wizard's
  provider owns the active validated draft. UI selection state remains local.
- React Hook Form owns editable values. Autosave persists valid changes;
  hydration/resume and language switching never rewrite profile answers.
- `src/i18n/` owns typed display translations. The prompt engine remains
  locale-explicit and framework-free. See [language behavior](LOCALIZATION.md).

The complete public module surface is in [architecture](../src/ARCHITECTURE.md).
Specialized category fields and constraints are defined once in the
[profile/catalog specification](V2-ABFRAGEKATALOG-UND-PROFILMODELL.md).

## Feature contracts

The shell has five views: Dashboard, Profiles, Wizard, Output and Settings.
The wizard chooses category/subtype first, then the base profile and only
relevant specialized editors. All nine categories remain required.

Base profiles own production values and locks; category/asset profiles
reference them. A changed base or conflicting locked override requires an
explicit, previewed decision. Never silently reparent existing profiles or
produce partial prompts from an unresolved graph.

Output resolves the complete graph before generating main, negative,
technical and combined prompts. Text export is Markdown; data export is
validated schema-V2 JSON. Settings also exports/imports the complete workspace
(profiles, settings and draft), with collision confirmation before writes.

The pure V1 compatibility domain and synthetic fixtures are retained only for
migration/regression. Their executable legacy UI is not part of the app.
Backup ordering, resume behavior, old routes and old settings are specified
in [compatibility](COMPATIBILITY.md).

## Verification

```bash
npm ci
npm run verify
npm run test:browser:install
npm run test:browser
git diff --check
```

`verify` includes documentation links, strict typecheck, unit/integration
tests and production build. CI additionally validates real Compose and static
hosting. See [accessibility expectations](ACCESSIBILITY.md) and the
[release gate](https://github.com/kleiveist/PixelForgeStudio/issues/9).

PWA/offline installation, desktop packaging, image generation, server-side
accounts/sync, rendering and engine exports are not supported release features.
