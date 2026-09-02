# V2 source architecture

- `app/`: bootstrap-nahe App-Komponenten und spätere Provider/Navigation
- `components/`: wiederverwendbare UI und lokale SVG-Icons
- `domain/`: frameworkfreie, pure TypeScript-Fachlogik
  - `assets/`: V2 categories, subtype catalogs, capability resolution, and
    direction-option guards
  - `profiles/`: validated profile-chain resolution, base-lock enforcement,
    structured diagnostics, normalized overrides, and compatibility keys
  - `json/`: canonical JSON serialization and semantic equality for stable
    import comparisons, fingerprints, and idempotent migration decisions
  - `migration/`: deterministic, framework-free V1-to-V2 profile
    transformation and source fingerprinting
  - `legacy-v1/`: namespaced compatibility port of the V1 defaults, state
    whitelist, prompt builder, validation, and frame/canvas metrics
- `features/`: Dashboard, Profile, Wizard, Editoren und Output als getrennte Features
- `schemas/`: Zod-Schemas und daraus abgeleitete Typen
  - `common.schema.ts`: schema version, stable IDs, profile values, locks, and
    reusable validated primitives
  - `categoryData.schema.ts`: strict category-specific answer contracts
  - `profiles.schema.ts`: base, category, and asset profile contracts
  - `appSettings.schema.ts`, `wizardDraft.schema.ts`,
    `exportBundle.schema.ts`: remaining persisted/imported V2 contracts
  - `legacyV1.schema.ts`: defensive whitelist and normalization boundary for
    raw, autosave, preset, and export-shaped V1 input
  - `storage.schema.ts`: versioned collection envelopes, profile-graph
    integrity, migration backup, and completion-marker contracts
- `services/`: injectable storage port, JSON profile transfer, and V1 storage
  migration orchestration; public exports live in `services/index.ts`
- `store/`: Contexts, Reducer, Actions und Selectors
- `styles/`: globale semantische Tokens und Reset-/Grundregeln
- `test/`: gemeinsames Vitest-/Testing-Library-Setup

V1 liegt unverändert unter `legacy/v1/` und darf nur als Referenz,
Migrationsquelle und Regressionstest verwendet werden.

The public compatibility API is `domain/legacy-v1/index.ts`. It intentionally
reproduces historical V1 behavior, including stale but valid sheet-layout
values. New V2 rules build beside this namespace instead of silently changing
the migration reference.

`domain/assets/index.ts` is the public V2 asset taxonomy API. Category and
subtype pairs form a discriminated union; UI features ask the capability
resolver whether direction, animation, scale, or other question groups apply.

`schemas/index.ts` is the public validation boundary. Persisted and imported
values enter its parse functions as `unknown`; exported TypeScript types are
inferred from the corresponding Zod schemas rather than maintained separately.

`domain/profiles/index.ts` is the public framework-free profile API.
`resolveProfile()` accepts already validated profile objects and returns a
discriminated success/conflict result. Reference failures never expose a
production profile; lock conflicts may expose only an explicitly named safe
`partialProfile`. Category defaults and asset answers remain correlated by the
category discriminant.

Compatibility keys use the `pf2-compat-v1__` format and are always recomputed
from effective values. They exclude profile metadata and omit
`characterHeight` unless `scaledCharacter` applies. Free-composition artwork
also omits tile and world-camera geometry. Lighting-note text is canonicalized
and represented by a compact deterministic, non-cryptographic fingerprint;
the key is for grouping, never for security or data integrity.

`services/storageAdapter.ts` is the only V2 module allowed to access browser
`localStorage`. `createV2StorageAdapter()` accepts an injected
`KeyValueStorage`; `createBrowserV2StorageAdapter()` is the browser composition
root. Reads return a discriminated `valid | empty | invalid | unavailable`
result. Profile writes use versioned namespace envelopes and validate the
complete Base→Category→Asset graph before a best-effort atomic write.

`services/v1Migration.ts` reads both V1 keys independently, writes their exact
raw strings to a `prepared` backup before parsing, transforms valid sources,
then writes the `completed` marker last. IDs derive from technical values and
source slots, so a prepared migration can converge safely after interruption.
Legacy keys are never deleted. V1 constraint flags remain isolated provenance
instead of being misinterpreted as V2 inheritance locks.

`services/profileTransfer.ts` owns the V2 JSON boundary. Selected exports add
their referenced Base/Category profiles automatically. Bundle parsing checks
schema/format/application, duplicate IDs, graph references, resolver conflicts,
and recomputed Compatibility Keys. Existing identical IDs are skipped;
different payloads are returned as visible conflicts unless replacement is
explicitly requested. UI settings and draft payloads roundtrip in the bundle
contract but profile import does not silently apply them to the local UI state.
