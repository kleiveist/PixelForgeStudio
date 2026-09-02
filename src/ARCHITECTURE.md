# V2 source architecture

- `app/`: Composition, persistente App Shell, View-Metadaten und semantische
  Haupt-/Schnellnavigation
- `components/`: wiederverwendbare CSS-Module-Oberflächen, Theme-Control,
  View-Links und lokale SVG-Icons
- `config/`: zentrale sichtbare `BRAND`-Konfiguration sowie bewusst stabiler,
  davon getrennter Exportformat-Identifier
- `domain/`: frameworkfreie, pure TypeScript-Fachlogik
  - `assets/`: V2 categories, subtype catalogs, capability resolution, and
    direction-option guards
  - `profiles/`: validated profile-chain resolution, base-lock enforcement,
    structured diagnostics, normalized overrides, compatibility keys, and
    immutable AssetProfile leaf mutations
  - `json/`: canonical JSON serialization and semantic equality for stable
    import comparisons, fingerprints, and idempotent migration decisions
  - `migration/`: deterministic, framework-free V1-to-V2 profile
    transformation and source fingerprinting
  - `theme/`: pure preference-to-effective-theme resolution without browser
    or React dependencies
  - `navigation/`: six stable top-level view IDs plus pure query parsing and
    canonical serialization
  - `legacy-v1/`: namespaced compatibility port of the V1 defaults, state
    whitelist, prompt builder, validation, and frame/canvas metrics
- `features/`: getrennte View-Flächen; `dashboard/` enthält das produktive
  Kategorie-Dashboard, `profiles/` die kategorisierte Assetprofilbibliothek
  und `wizard/` die deklarative RHF-/Zod-Wizard-Grundlage; Review-/Output-
  Flächen bleiben bis zu ihren jeweiligen Phasen Platzhalter
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
- `services/`: injectable storage and navigation ports, JSON profile transfer,
  and V1 storage migration orchestration; public exports live in
  `services/index.ts`
- `store/`: Contexts, pure Reducer, Actions und Selectors; `settings/` owns the
  complete validated app-settings envelope and effective theme state;
  `profiles/` owns the validated profile-library UI state, filters, and
  mutation boundary; `navigation/` owns only the current top-level view;
  `wizard/` owns Startintent, aktiven validierten Draft, Dirty-Baseline und
  Persistenzstatus, während React Hook Form Eigentümer der aktuellen
  Formularwerte bleibt
- `styles/`: globale semantische Light-/Dark-Tokens, System-Fallback und
  Reset-/Grundregeln
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

The same public profile API exposes immutable AssetProfile leaf operations.
Favorite changes preserve the content-oriented `updatedAt`; duplicates retain
their parent references and effective compatibility while receiving a fresh
identity and shedding V1-only provenance. Deletion never cascades into Base or
Category profiles. Every resulting graph is validated again at the React
mutation boundary before persistence.

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
complete Base→Category→Asset graph before a best-effort write with a rollback
attempt. If browser storage also rejects that rollback, the adapter reports
`unavailable` but cannot guarantee atomicity. `ProfileLibraryProvider` is the
sole in-app mutation owner and assumes its adapter identity remains stable for
the app lifecycle. Future import or restore paths must rehydrate that provider
instead of writing beside its in-memory graph; cross-tab synchronization is
not part of Prompt 10.

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

`config/brand.ts` is the single source for visible product copy. The separate
`EXPORT_APPLICATION_ID` remains stable because it is a persisted wire-format
discriminator and must not change during a visual rebrand.

`domain/theme/index.ts` is the framework-free theme API. It distinguishes the
persisted `light | dark | system` preference from the resolved `light | dark`
mode. `store/settings/index.ts` is the React-facing settings boundary:
`SettingsProvider` loads and preserves the full Zod-validated `AppSettings`
object, persists only explicit user changes through the injected storage port,
and observes `prefers-color-scheme` only while System is selected. It writes
the resolved mode to `document.documentElement.dataset.theme`; media changes
never mutate storage or `updatedAt`. `main.tsx` creates the browser adapter once
at the composition root.

`components/ui/index.ts` exposes the first reusable CSS-Module primitives,
`Badge` and `Surface`. `components/theme/ThemeSwitcher.tsx` is a native,
keyboard-operable radio group. All component colors, spacing, focus rings,
control sizes, radii, shadows, and motion timings come from `styles/tokens.css`.

`domain/navigation/index.ts` is the public, framework-free view contract. The
same `APP_VIEW_IDS` tuple validates `AppSettings.startView`, preventing schema
and UI routes from drifting. Routing uses a query parameter (`?view=…`) rather
than the fragment so the accessible `#main-content` skip target remains usable.

`services/navigationAdapter.ts` is the only module that talks to browser
History for top-level navigation. `pushView()` is reserved for an explicit
user transition, `replaceView()` canonicalizes a missing or invalid route, and
`subscribe()` observes `popstate` without creating another entry. Link hrefs
preserve unrelated query parameters and remove obsolete fragments.

`store/navigation/index.ts` is the React-facing navigation boundary. Initial
precedence is a valid URL view followed by the already validated
`settings.startView`; the Settings default supplies `dashboard` when persisted
settings are absent or invalid. Navigation never persists the current view or
changes `updatedAt`. `main.tsx` creates one browser adapter, while tests inject
`MemoryNavigation` and can inspect pushes, replacements and live subscribers.

`components/navigation/index.ts` exposes `ViewLink`, the shared semantic anchor
for shell and feature navigation. It preserves real hrefs plus modifier/new-tab
behavior. Its optional `onNavigate` hook records a domain intent before the
navigation context changes the active view; it must not be used for unrelated
side effects.

`features/dashboard/dashboardCatalog.ts` is the UI metadata companion to the
public asset taxonomy. Its record is exhaustive over `AssetCategory`, and its
render order is derived from `ASSET_CATEGORY_IDS`; the dashboard therefore
cannot silently omit a newly added category. `CategoryIcon` and
`MaterialBadge` map these stable IDs to local decorative SVG components with
visible German text beside them.

`features/dashboard/dashboardData.ts` is a pure projection boundary. It accepts
structured `StorageReadResult` values, resolves every card through
`resolveProfile()`, applies deterministic updated-at/ID ordering and emits only
capability-relevant facts. Free-composition artwork omits Tile and world-
perspective facts; figures alone show character scale, and direction, movement
and animation badges describe configured answers rather than capability
potential. Unknown badge IDs are ignored safely. The React view reads this model
through the narrow `DashboardStorage` port (`readProfileLibrary` + `readDraft`)
and never accesses `localStorage`. Category, profile and draft starts are
write-free; only an explicit base-profile selection delegates a validated
AppSettings update to the existing Settings provider.

`features/profiles/profileLibraryData.ts` reuses that resolved presentation
projection, searches the complete source tag set, combines category, Base and
favorite filters with AND semantics, and groups visible cards either in
canonical category order or by the newly resolved compatibility key. The key
remains an opaque grouping identifier and is never parsed or displayed.

`store/profiles/index.ts` is the React-facing profile-library boundary. Its
Context/Reducer stays mounted above changing views, so non-persisted filters
survive navigation. Favorite, duplicate and delete commands operate on the
latest in-memory ref, validate the complete candidate with Zod, then delegate
one full-graph write to the storage adapter. The reducer adopts it only after a
successful write; invalid and unavailable results leave the previous graph
untouched and expose a typed visible notice.

`features/profiles/ProfileLibraryView.tsx` is the real `profiles` view. Cards
are non-interactive articles with separate native controls, avoiding nested
button semantics. Loading records the existing profile start intent without a
write. Deletion uses a named confirmation dialog, retains parent profiles, and
clears only a matching transient Wizard profile request after success.

`store/wizard/index.ts` exposes the transient handoff contract (`newAsset`,
`profile`, `resume`) plus the view-persistent Wizard session. Its reducer keeps
an active validated Draft and a structural baseline distinct. Invalid raw core
form values stay in a separate transient snapshot, so they survive a view
unmount without entering persistence or weakening `WizardDraftSchema`. The
activation modes `hydrate-transient`, `hydrate-persisted`, `edit` and `saved`
make Dirty- und Persistenzstatus explicit; each new start increments a session
revision so same-view restarts remount the form and refocus main content.

`features/wizard/GuidedWizardEngine.tsx` owns only generic RHF navigation,
progress, validation focus, Dirty state and persistence timing. The external
`WIZARD_CORE_FLOW` binds step components, Zod schemas, RHF field paths, Draft
mapping and summary presentation. Prompt 11 intentionally contains only
`project` and the prepared `category` handoff; Prompt 12 composes its category,
subtype and capability steps into that flow rather than branching the engine.

`features/wizard/wizardLifecycle.ts` creates blank drafts, resolves profile
starts against the current provider graph, updates route/step metadata and
validates exact Resume IDs plus required Base/Category references and current
lock compatibility of the stored override snapshot. Unknown future/older step
IDs fall back in memory with a visible notice and are not silently written.
Selected drafts can carry optional AssetProfile provenance and an asset-
override snapshot; resolution and summary use the portable snapshot rather
than treating provenance as a hard or live configuration reference.

`features/wizard/WizardView.tsx` replaces the Wizard placeholder. Initial,
profile-based and resumed hydration perform no writes. Its thin `WizardEngine`
adapter supplies the current product flow to `GuidedWizardEngine`, including a
dynamic Zod resolver, semantic progress, focus-managed forward/back navigation
and a 300-ms valid-change autosave. Navigation writes its new step immediately;
invalid or unavailable writes retain raw session data and the last successful
baseline. Recovery never deletes or overwrites the stored slot. The adjacent
technical summary displays the portable, capability-relevant snapshot and
omits world-grid geometry for resolved free-composition artwork.
