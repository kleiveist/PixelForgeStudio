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
  - `characters/`: Character/NPC option catalogs, subtype guards, canonical
    animation-action order, and per-action frame defaults
  - `moving-objects/`: Moving Object production catalogs, subtype-to-class
    mapping, canonical animation-sequence order, and frame defaults used only
    when a sequence is deliberately activated
  - `textures/`: Texture/Material catalogs for material type, usage, structure,
    condition, surface, moisture, icing, lighting, and orientation plus the
    pure subtype-to-material mapping
  - `nature/`: Nature/Tree catalogs, exhaustive subtype-to-plant-type mapping,
    and pure trunk, crown, and root relevance guards
  - `static-objects/`: Static Object production catalogs and exhaustive pure
    subtype-to-object-class mapping
  - `buildings/`: Building/Architecture production catalogs and exhaustive
    pure subtype-to-building-type mapping
  - `profiles/`: validated profile-chain resolution, base-lock enforcement,
    structured diagnostics, normalized overrides, compatibility keys,
    canonical BaseProfile defaults, immutable BaseProfile creation/duplication,
    and immutable AssetProfile leaf mutations
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
  und `wizard/` die deklarative RHF-/Zod-Wizard-Grundlage;
  `character-editor/`, `moving-object-editor/`, `static-object-editor/`,
  `texture-editor/`, `nature-editor/` und `building-editor/` enthalten die
  ersten spezialisierten Asset-Editoren;
  Review-/Output-Flächen bleiben bis zu ihren jeweiligen Phasen Platzhalter
- `schemas/`: Zod-Schemas und daraus abgeleitete Typen
  - `common.schema.ts`: schema version, stable IDs, profile values, locks, and
    reusable validated primitives
  - `categoryData.schema.ts`: strict category-specific answer contracts,
    including additive Character/NPC, Moving Object, Static Object,
    Texture/Material, Nature/Tree, and Building/Architecture catalogs with
    strict category-specific values
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

`domain/characters/index.ts` is the public, framework-free Character/NPC
catalog API. It owns the stable values used by schema and UI, the canonical
`idle → walk → run → attack → use → talk → interact → hurt → special`
action order, 1-to-8-frame UI defaults (Walk: 5), and the pure NPC-context and
humanoid-subtype guards. This keeps subtype gating and new Character answer
serialization out of React literals.

`domain/moving-objects/index.ts` is the public, framework-free Moving Object
catalog API. It owns stable object-class, movement, animation, anchor,
mechanism, material, condition, lighting, and shadow IDs; canonical sequence
order; 1-to-16-frame activation defaults; and the pure
subtype-to-object-class mapping. Detail fields receive no value during mere
hydration.
Schema and UI consume these exports instead of maintaining parallel literals.

`domain/textures/index.ts` is the public, framework-free Texture/Material
catalog API. It owns stable material, usage, orientation, structure, condition,
surface, moisture, icing, and lighting IDs plus the exhaustive pure
subtype-to-material mapping. That mapping is available to UI and validation,
but profile hydration does not materialize missing values or write defaults.

`domain/nature/index.ts` is the public, framework-free Nature/Tree catalog API.
It exports stable readonly IDs for plant type, climate, season, age,
silhouette, trunk, crown, roots, moss, mushrooms, snow, vines, grounding, and
animation through `NATURE_PLANT_TYPE_IDS`, `NATURE_CLIMATE_IDS`,
`NATURE_SEASON_IDS`, `NATURE_AGE_IDS`, `NATURE_SILHOUETTE_IDS`,
`NATURE_TRUNK_THICKNESS_IDS`, `NATURE_TRUNK_SHAPE_IDS`,
`NATURE_CROWN_SHAPE_IDS`, `NATURE_CROWN_DENSITY_IDS`,
`NATURE_ROOT_VISIBILITY_IDS`, `NATURE_MOSS_COVERAGE_IDS`,
`NATURE_MUSHROOM_GROWTH_IDS`, `NATURE_SNOW_COVER_IDS`,
`NATURE_VINE_GROWTH_IDS`, `NATURE_GROUNDING_IDS`, and
`NATURE_ANIMATION_TYPE_IDS`, plus their corresponding `Nature*` types.
`NATURE_PLANT_TYPE_BY_SUBTYPE` and
`getDefaultNaturePlantType()` exhaustively map every Nature subtype, while
`natureSubtypeHasTrunk()`, `natureSubtypeHasCrown()`, and
`natureSubtypeHasRoots()` provide the shared pure anatomy gates for schemas
and React. Reading an older profile never materializes the derived plant type.

`domain/static-objects/index.ts` is the public, framework-free Static Object
catalog API. It owns stable object-class, purpose, shape, proportion, symmetry,
material, condition, interaction, animation, and shadow IDs plus the exhaustive
`STATIC_OBJECT_CLASS_BY_SUBTYPE` mapping and
`getDefaultStaticObjectClass()`. Schema and React consume the same contract;
reading an older profile never materializes its derived class.

`domain/buildings/index.ts` is the public, framework-free Building and
Architecture catalog API. It owns stable IDs for building type, size, plan,
material, roof, facade, doors, windows, condition, occupancy, environment,
mapping, collision, lighting, and gate animation. The exhaustive
`BUILDING_TYPE_BY_SUBTYPE` mapping and `getDefaultBuildingType()` are shared by
schema and React. Reading an older schema-version-2 profile never materializes
the derived building type.

`schemas/index.ts` is the public validation boundary. Persisted and imported
values enter its parse functions as `unknown`; exported TypeScript types are
inferred from the corresponding Zod schemas rather than maintained separately.
`CharacterAnswersSchema` remains a strict additive member of the category
union: detailed Character/NPC fields are optional but bounded, `characterHeight`
is deliberately absent, and `animationActions` accepts unique action/frame
pairs only. The previous schema-version-2 `animationAction` plus
`framesPerDirection` fields remain readable for existing local data. New UI
writes normalize them to `animationActions`; no eager storage migration occurs.
`MovingObjectAnswersSchema` is another strict additive union member. It bounds
each footprint axis to 1–64 tiles, `heightPixels` to 16–2048, and each unique
`animationSequences` entry to 1–16 frames. Existing `animationType` plus
`framesPerDirection` data remains readable; new UI writes use only the
canonical sequence list and never migrate on hydration.
`TextureAnswersSchema` remains strict and additive: all previous schema-v2
fields stay readable, while optional `materialType`, `surface`, `moisture`,
`icing`, and `lighting` extend the contract. A present material type must match
the selected Texture subtype. Missing values stay absent, and technical
`tileSize`, Character, clothing, motion, and direction fields are deliberately
not part of Texture answers.
`NatureAnswersSchema` is likewise strict and additive. The earlier
`subjectDescription`, `climate`, `season`, `age`, `animationType`, `footprint`,
and `extraDetails` fields remain readable without defaults. Optional plant,
species, silhouette, subtype-relevant anatomy, foliage, overlay, grounding,
and 1-to-12 variant fields extend the contract. A present `plantType` must
match the selected subtype, and irrelevant trunk, crown, or root fields are
rejected. Technical `tileSize`, Character, clothing, and direction data are
not Nature answers.
`StaticObjectAnswersSchema` is also strict and additive. Existing
`subjectDescription`, `extraDetails`, `purpose`, `interaction`,
`animationType`, and `footprint` values remain readable without defaults.
Optional class, form, proportion, symmetry, material, condition, construction,
contents, shadow, and 1-to-12 variant fields extend the contract. A present
class must match the selected subtype. Technical `tileSize`, Character scale,
and direction data are not Static Object answers.
`BuildingAnswersSchema` remains strict and additive as well. Existing
`subjectDescription`, `extraDetails`, `purpose`, `floors`, `condition`,
`modular`, and `footprint` values stay readable without defaults. Optional
building type, plan, size, height, materials, roof, facade, door, window,
occupancy, environment, mapping, collision, local-light, and gate-animation
fields extend the contract. A present building type must match the subtype,
and modular output or mapping is accepted only for a modular-capable subtype.
Technical tile and world-camera geometry, Character scale, and directions are
not Building answers.

`domain/profiles/index.ts` is the public framework-free profile API.
`resolveProfile()` accepts already validated profile objects and returns a
discriminated success/conflict result. Reference failures never expose a
production profile; lock conflicts may expose only an explicitly named safe
`partialProfile`. Category defaults and asset answers remain correlated by the
category discriminant.

Moving Object animation is merged as one semantic value rather than as three
independent keys. At the same profile level `animationSequences` wins over the
legacy `animationType`/`framesPerDirection` pair; an explicit Asset-level
representation replaces the inherited Category-level representation in either
direction. Resolution remains pure and never rewrites stored data.

Texture answers use the ordinary deterministic Base→Category→Asset merge: a
defined Asset answer replaces the corresponding Category default without
inventing absent values. The Wizard compares the effective inherited Texture
snapshot before writing and stores only non-redundant local differences.

Nature answers use the same deterministic merge and minimal local projection.
Clearing an inherited optional Nature value detaches Category/Asset
provenance and materializes the remaining effective answers and technical
values relative to the Base, so the cleared parent value cannot reappear on
Resume.

Static Object answers use the same deterministic merge and minimal local
projection. Clearing an inherited optional Static Object value detaches
Category/Asset provenance and materializes the remaining effective answers and
technical values relative to the Base, so the cleared parent value cannot
reappear on Resume.

Building answers follow the same deterministic merge and minimal local
projection. Clearing an inherited optional Building value detaches
Category/Asset provenance and materializes the remaining effective answers and
technical values relative to the Base. Changing the Base keeps architecture
answers, while changing category or subtype removes them.

The same public profile API exposes immutable BaseProfile and AssetProfile
operations. A Base family can be created from the canonical defaults or copied
with edited values and locks; both receive a fresh identity and timestamps.
Neither operation mutates the source family, reparents descendants, or rewrites
their compatibility snapshots. Asset favorite changes preserve the content-
oriented `updatedAt`; Asset duplicates retain their parent references and
effective compatibility while receiving a fresh identity and shedding V1-only
provenance. Asset deletion never cascades into Base or Category profiles. Every
resulting graph is validated again at the React mutation boundary before
persistence.

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
potential. Character animation facts prefer the canonical per-action frame
list and fall back to the previous single-action representation for existing
schema-version-2 profiles. Moving Object facts expose the resolved object
class, movement, footprint, anchor, capability-valid direction count,
animation sequences with frames, material, and condition. Canonical sequences
win over the old singleton representation, which remains a read fallback.
Texture facts expose the resolved material type, usage, three-state seamless
decision, effective central tile size, structure, condition, surface,
orientation, moisture, icing, and lighting only when applicable or explicitly
configured. They never infer Character or direction facts for a texture.
Nature facts expose the resolved plant type, species, environment, relevant
anatomy, overlays, footprint, grounding, variants, and configured
capability-valid animation. They never emit direction facts for a Nature
profile.
Static Object facts expose the resolved object class, purpose, form, materials,
condition, footprint, variants, interaction, shadow, and configured
capability-valid animation. They never emit Character-scale or direction facts.
Building facts expose the resolved building type, footprint, floors and height,
materials, roof, facade, openings, condition, occupancy, mapping, collision,
modularity, local lighting, and configured capability-valid gate animation.
They inherit world-grid facts but never emit Character-scale or direction facts.
Unknown badge IDs are ignored safely. The React view
reads this model through the narrow `DashboardStorage` port
(`readProfileLibrary` + `readDraft`) and never accesses `localStorage`.
Category, profile and draft starts are write-free; only an explicit base-profile
selection delegates a validated AppSettings update to the existing Settings
provider.

`features/profiles/profileLibraryData.ts` reuses that resolved presentation
projection, searches the complete source tag set, combines category, Base and
favorite filters with AND semantics, and groups visible cards either in
canonical category order or by the newly resolved compatibility key. The key
remains an opaque grouping identifier and is never parsed or displayed.

`store/profiles/index.ts` is the React-facing profile-library boundary. Its
Context/Reducer stays mounted above changing views, so non-persisted filters
survive navigation. Asset favorite/duplicate/delete and Base create/duplicate
commands operate on the latest in-memory ref, validate the complete candidate
with Zod, then delegate one logical full-graph write to the storage adapter.
The reducer adopts it only after a successful write; invalid and unavailable
results leave the previous graph untouched and expose a typed visible notice.
An initially empty library is a writable empty graph; invalid or unavailable
input remains fail-closed.

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
mapping and summary presentation. Steps can declare a pure `isApplicable`
predicate; one filtered list drives progress, navigation, error focus and
resume fallback. The engine supplies the flow context to Draft projection and
offers step components `notifyProgrammaticChange()`: a component that applies
several RHF values programmatically calls it once to enter the same projection,
Dirty-state and autosave path as a native control change. Product routing and
Base-profile semantics remain outside the generic engine.

`features/wizard/wizardCategoryRouting.ts` is the Prompt-19 boundary between
core form values and the strict Draft union. It validates category/subtype
pairs against the canonical taxonomy, resolves visibility only through
`resolveCapabilities()`, preserves hidden answers for an unchanged selection,
and creates clean answers when classification changes. The stable core flow is
`project → category/subtype → baseProfile → characterDetails,
movingObjectDetails, staticObjectDetails, textureDetails, natureDetails, or
buildingDetails when applicable → directions | animation | tileability`, with
specialist and capability steps conditionally present.
A category-only choice remains a raw
session value until a matching subtype makes it persistable; a classified
pre-Base Draft remains on `wizard/profile`. The Draft mapper returns `null` for
explicit non-persistable intermediates, allowing navigation while preventing
an old selected Draft from being written over raw form state. After Base
selection it derives only non-redundant, capability-relevant, unlocked
technical differences as Asset-level overrides. It serializes the Character
form's action/frame map in domain order as unique `animationActions` and the
Moving Object map as unique `animationSequences`; both old singleton forms
hydrate without an eager write. A confirmed Base switch removes prior
technical overrides and stale Category/Asset provenance while retaining the
current category answers; a category or subtype switch purges them. Explicitly
clearing an inherited optional Character, Moving Object, Static Object,
Texture, Nature, or Building
default detaches Category/Asset provenance and materializes every other
effective answer and technical override against the Base, so the parent value
cannot reappear on Resume. Texture `false` for `seamless` remains a deliberate value,
whereas the unset UI choice maps to `undefined`. Step schemas independently
reject incomplete Base values and category-incompatible specialist or
capability values, including partial Moving Object footprints, invalid
subtype/object-class combinations, mismatched Texture material types,
incomplete Nature footprints, mismatched Nature plant types, irrelevant Nature
anatomy, incomplete Static Object footprints, and mismatched Static Object
classes, plus incomplete Building footprints, mismatched Building types, and
modular mapping on non-modular building subtypes.
The Wizard reports a derived Nature plant-type mismatch on the editable
subtype control and offers an explicit repair that re-enters the normal
validation and autosave path without discarding the remaining Nature details.
The generic `tileability` step is skipped for Texture because
`textureDetails` already owns the explicit three-state seamless decision.

`features/wizard/wizardLifecycle.ts` creates blank drafts, resolves profile
starts against the current provider graph, updates route/step metadata and
validates exact Resume IDs plus required Base/Category references and current
lock compatibility of the stored override snapshot. Unknown future/older step
IDs fall back in memory with a visible notice and are not silently written.
Selected drafts can carry optional AssetProfile provenance and an asset-
override snapshot; resolution and summary use the portable snapshot rather
than treating provenance as a hard or live configuration reference. A newly
classified Draft on `wizard/profile` may intentionally have no Base reference
until the user completes the Base step; exact Resume returns it to that step.
Existing but unresolved references and lock conflicts still fail closed.

`features/wizard/WizardView.tsx` replaces the Wizard placeholder. Initial,
profile-based and resumed hydration perform no writes. Its thin `WizardEngine`
adapter supplies the current product flow to `GuidedWizardEngine`, including a
dynamic Zod resolver, semantic progress, focus-managed forward/back navigation
and a 300-ms valid-change autosave. Navigation writes its new step immediately;
invalid or unavailable writes retain raw session data and the last successful
baseline. Recovery never deletes or overwrites the stored slot. The adjacent
technical summary displays the portable, capability-relevant snapshot. It adds
the actual Character role, directions, selected actions with frame counts and
silhouette when present, plus Moving Object class, movement, footprint, anchor,
capability-valid directions, sequences with frames, material, and condition.
Texture summaries add material, usage, seamless state, effective tile size,
structure, condition, surface, orientation, moisture, icing, and lighting,
without displaying direction or Character fields.
Nature summaries add the derived plant type, species, environment, relevant
anatomy, overlays, complete footprint, grounding, variants, and the separate
capability-valid animation state without displaying any direction field.
Long free-form Nature descriptions stay in the Draft for later Review/Output
and are deliberately omitted from the compact sticky summary and Dashboard
card descriptions.
Static Object summaries add the derived class, purpose, form, materials,
condition, complete footprint, variants, interaction, shadow, and separate
capability-valid animation state. Long free-form object descriptions stay in
the Draft for later Review/Output and are not duplicated into compact cards.
Building summaries add the derived type, use, footprint, floors and height,
materials, roof, facade, doors, windows, condition, occupancy, mapping,
collision, modularity, local light, and separate capability-valid gate
animation. Long free-form architecture descriptions remain in the Draft for
later Review/Output and are not duplicated into compact cards.
World-grid geometry remains omitted for resolved free-composition artwork.

`features/wizard/BaseProfileStep.tsx` is the Prompt-13 UI boundary. It presents
native radio selection plus effective technical values with explicit Base,
Category or local source and visible lock state. Unlocked controls edit RHF
state; locked values are read-only and open an explicit cancel/switch/copy/new
workflow. New and copied families use a nested RHF/Zod editor but are persisted
only by an explicit action through `ProfileLibraryProvider`. The selected Draft
ID and its full technical RHF snapshot are updated only after that graph write
succeeds, followed by one `notifyProgrammaticChange()` call. If only the later
Draft autosave fails, the already persisted family remains and the session
selection stays visibly dirty. Character height, world geometry and alpha
padding follow the resolved capabilities. Mount, profile hydration and Resume
do not write.

`features/character-editor/index.ts` is the public React boundary for Prompt
14. `CharacterDetailsEditor` groups identity/variants, body/face/expression,
humanoid wardrobe, gear/material, local-or-profile palette intent and
silhouette fields. NPC-context fields render only for the centrally defined
NPC-like subtypes; humanoid wardrobe is hidden for animals and creatures. The
effective Character height is displayed read-only with Base/Category/local
source and Base lock, and is never part of `CharacterAnswers`.

`CharacterAnimationEditor` remains separate from direction selection. It is
rendered only for the `animated` capability and stores a transient RHF map of
selected actions to 1–8 frames; selecting Walk starts at five. Direction
selection remains the existing `directional`-only 4/8 step. Both specialist
surfaces use the same Draft projection, autosave and exact Resume path as the
core fields. Mount and hydration remain write-free.

`features/moving-object-editor/index.ts` is the public React boundary for
Prompt 15. `MovingObjectDetailsEditor` groups the subtype-derived object class,
purpose, basic shape, description, 1–64-tile footprint axes, 16–2048-pixel
height, anchor, movement, mechanism, material, condition, lighting, and shadow.
It is mounted as the dedicated `movingObjectDetails` step directly after Base
selection and never renders for another category.

`MovingObjectAnimationEditor` is separate from both production details and
direction selection. It stores a transient RHF map and serializes selected
types in domain order as unique `animationSequences` with 1–16 frames each.
The cart route can therefore include the independent 4/8 direction step,
whereas animated `floatingCrystal` offers sequences without any direction
control. Raw session state, delayed autosave, navigation writes, exact Resume,
and write-free hydration are shared with the generic Wizard contract.

`features/texture-editor/index.ts` is the public React boundary for Prompt 16.
`TextureMaterialEditor` is mounted only as the dedicated `textureDetails` step
after Base selection. It renders the subtype-derived material type and the
effective inherited `tileSize` read-only, then owns only RHF-controlled
Texture fields: usage, description, three-state seamless choice, structure,
condition, surface, orientation, moisture, icing, lighting, and extra details.
The wood route adds material-specific guidance without changing the data
contract. Classification changes purge Texture answers, Base changes preserve
them, and hydration/Resume remain write-free while deliberate valid edits use
the shared autosave path. Texture does not render the generic `tileability`
step or any Character, motion, animation, or direction controls.

`features/nature-editor/index.ts` is the public React boundary for Prompt 17.
`NatureTreeEditor` is mounted only as the dedicated `natureDetails` step after
Base selection. It renders the subtype-derived plant type and effective
inherited `tileSize` read-only, owns the RHF-controlled species, environment,
silhouette, overlay, complete 1-to-64-tile footprint, grounding, and 1-to-12
variant fields, and gates trunk, crown, and root groups through the public
Nature guards. Wind, magic, or custom animation remains a separate
`animated`-capability step. Nature has no directional subtype, so the editor
and flow never expose 4/8 direction controls. Base changes preserve Nature
answers, classification changes purge them, and deliberate edits use the
shared autosave path while mount, hydration, and Resume remain write-free.

`features/static-object-editor/index.ts` is the public React boundary for
Prompt 18. `StaticWorldObjectEditor` is mounted only as the dedicated
`staticObjectDetails` step after Base selection. It renders the subtype-derived
object class and effective inherited `tileSize` read-only, then owns only
RHF-controlled purpose, description, shape, proportion, symmetry, materials,
condition, construction, contents, complete 1-to-64-tile footprint, shadow,
and 1-to-12 variant fields. Opening, glowing, breaking, or custom animation
remains a separate `animated`-capability step. No Static Object subtype is
directional, so neither editor nor flow exposes 4/8 direction controls. Base
changes preserve Static Object answers, classification changes purge them,
and deliberate edits use the shared autosave path while mount, hydration, and
Resume remain write-free.

`features/building-editor/index.ts` is the public React boundary for Prompt 19.
`BuildingArchitectureEditor` is mounted only as the dedicated
`buildingDetails` step after Base selection. It renders the subtype-derived
building type plus effective inherited tile size, perspective, camera angle,
and projection read-only. RHF owns use, plan, size, complete 1-to-64-tile
footprint, 16-to-8192-pixel building height, 1-to-20 floors, materials, roof,
facade, doors, windows, condition, occupancy, environment, mapping, collision,
modularity, and local-light fields. Modular controls are shown only for gate,
fortification, and dungeon-module subtypes. A gate may receive an independent
open/close or custom animation step, but no Building subtype is directional.
Base changes preserve Building answers, classification changes purge them,
and deliberate edits use the shared autosave path while mount, hydration, and
Resume remain write-free.

Prompts 00 through 19 are complete. Prompt 20, the Tileset editor, is the next
phase. Prompt 19 does not implement Prompt Engine modules,
review/output generation, or any remaining specialist editor. It also does
not add in-place Base-family mutation or descendant reparenting.
