# Data and migration compatibility

Product release **1.0.0** and stored data format **2** are independent.
These guarantees remain mandatory when changing UI, branding or deployment.

## Stable identifiers

The JSON application discriminator is exactly `PixelForge Prompt Studio`.
`schemaVersion` and `formatVersion` remain `2`. Persisted enum values and
profile IDs are not translated. The six localStorage keys are:

| Data | Key |
| --- | --- |
| Settings | `pixelforge:v2:settings` |
| Base profiles | `pixelforge:v2:base-profiles` |
| Category profiles | `pixelforge:v2:category-profiles` |
| Asset profiles | `pixelforge:v2:asset-profiles` |
| Active draft | `pixelforge:v2:draft` |
| Migration backup | `pixelforge:v2:migration-backup` |

The [storage adapter](../src/services/storageAdapter.ts) is the only persisted
data boundary. Invalid/unavailable reads must be visible and must not silently
erase original data. localStorage is not a multi-key database transaction;
report failed writes and optional restore failures honestly. Export before
changing versions, browser profiles or origins.

## Profiles and imports

Base → Category → Asset references form a validated graph. Children reference
`baseProfileId`; production locks cannot be silently overridden. Compute the
deterministic `compatibilityKey` from resolved technical values; do not parse
its internal representation or persist a stale value. Unresolved graphs fail
closed instead of producing partial prompts.

JSON starts as `unknown`, is validated with strict Zod schemas and is bounded
to 10 MiB at the UI import boundary. Validate graph dependencies and show ID
collisions before confirmation. Workspace export covers profiles, settings
and the active draft; it is not an export of raw V1 migration backups.
Hydration/resume must not trigger eager writes or materialize irrelevant
category answers. Legacy single-action fields and newer action arrays remain
readable through the existing category schemas/adapters.

## Settings and navigation

German remains the default for old settings with no `locale`. Language changes
affect display, not stored names, tags, IDs or user prose. See
[localization](LOCALIZATION.md). `startView` controls the Prompt start view.
`startStudio` and `animationStartView` remain readable compatibility-only
fields with schema defaults; they have no UI or navigation effect.

The five current query routes use `studio=prompt`. Older `?view=` links remain
readable; `review` maps to `output`. Removed studio/home/project routes are
repaired to the configured Prompt start view without storage writes. Existing
unrelated browser IndexedDB data is neither opened nor deleted.

## V1 startup migration

Before any React provider reads profiles, the bootstrap checks
`pixelart-prompt-studio:autosave:v1` and `pixelart-prompt-studio:presets:v1`.
It backs up their exact raw strings before parsing or writing V2 profiles.
The migration marker moves from `prepared` to `completed` only after validated
Base → Category → Asset persistence. Resume uses the same backup and
deterministic IDs. Original V1 keys are retained; corrupt sources, conflicts
and storage failures are diagnosed without destroying them.

The pure migration maps all 18 old asset types. Generic values use documented
fallbacks without invented material/function data. Direction counts transfer
only when the resulting asset is directional. Irrelevant old figure heights,
layouts and other fields remain in `legacyData`, not effective prompt values.
The historic V1 export identifier `Pixelart Prompt Studio` belongs only to
legacy fixtures and migration, never to new exports.

The executable legacy UI was removed. Retain the pure compatibility domain
and synthetic fixtures; they contain invented examples, not user exports.
Do not delete them as documentation cleanup.

## Regression evidence

- [Migration orchestration tests](../src/services/v1Migration.test.ts)
- [Bootstrap tests](../src/services/workspaceBootstrap.test.ts)
- [Storage tests](../src/services/storageAdapter.test.ts)
- [Legacy domain tests](../src/domain/legacy-v1/legacyV1.test.ts)
- [Schema/domain tests](../src/ARCHITECTURE.md)
- [Browser routing tests](../e2e/release-smoke.spec.ts)

`npm run verify` and the Chromium/Firefox smokes are current evidence. Old
phase completion counts and removed prototype instructions are not release
acceptance for the current product.
