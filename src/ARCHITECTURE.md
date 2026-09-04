# PixelForge Studio source architecture

Prompt 39 completes Phase C with source-anchor editing and reproducible Part
placement on the immutable `humanoid-80-v1` production rig. Original-space
anchors, one-/two-point slot rules, effective trimmed coordinates, uniform
Bone placement and delta composition remain pure Domain logic. The viewport
loads an original Blob only into local presentation state and projects a live
preview through a narrow display adapter; it persists neither the Blob nor an
absolute automatic transform in React state. Rendering, playback and export
remain explicit future boundaries.
Both modules share one route source, settings source, theme, skip target,
title and focus boundary.

- `app/`: Composition, globale `StudioShell`, getrennte Prompt-/Animations-
  Modulflächen, pure Home-Zusammenfassungsprojektion mit schmalem Controller,
  View-Metadaten und semantische Modulnavigation
- `components/`: wiederverwendbare CSS-Module-Oberflächen, globales Theme-
  Control, typisierte Studio-/Prompt-Links und lokale SVG-Icons einschließlich
  eigener thematischer Illustrationen für Prompt Studio und Animation Studio
- `config/`: zentrale, typisierte `BRAND`-Konfiguration für Dachprodukt,
  Prompt-Modul und Animationsmodul, daraus abgeleitete Moduldefinitionen sowie
  getrennte, bewusst stabile Exportformat-Identifier
- `domain/`: frameworkfreie, pure TypeScript-Fachlogik
  - `animation/`: stable direction/source-mode contracts, complete Production-
    Humanoid slot metadata, the immutable five-pose `humanoid-80-v1` rig,
    validated joint/bone/slot hierarchy and compatibility key, versioned frame
    defaults, pure source-anchor validation, effective-coordinate and
    reproducible placement/delta composition, vector/angle/affine-matrix
    helpers and deterministic RGBA alpha-bound/crop operations without browser
    data
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
  - `tilesets/`: Tileset catalogs, exhaustive subtype-to-tile-type mapping,
    connection relevance guards, and deterministic atlas metrics/specification
  - `items/`: Item/Equipment catalogs, exhaustive subtype-to-item-class
    mapping, and the wearable relevance guard
  - `artworks/`: Artwork catalogs and exhaustive subtype-to-artwork-type
    mapping for free-composition production fields
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
  - `navigation/`: typed Home, Prompt Studio and Animation Studio routes,
    pure query parsing/canonical serialization, and compatibility aliases for
    the six stable Prompt views
  - `legacy-v1/`: namespaced compatibility port of the V1 defaults, state
    whitelist, prompt builder, validation, and frame/canvas metrics
- `features/`: getrennte View-Flächen; `dashboard/` enthält das produktive
  Kategorie-Dashboard, `profiles/` die kategorisierte Assetprofilbibliothek
  und `wizard/` die deklarative RHF-/Zod-Wizard-Grundlage;
  `character-editor/`, `moving-object-editor/`, `static-object-editor/`,
  `texture-editor/`, `nature-editor/`, `building-editor/` und
  `tileset-editor/`, `item-editor/` und `artwork-editor/` enthalten die neun
  spezialisierten Asset-Editoren; `review-output/` enthält Review, Prompt-
  Ausgaben und den kontrollierten Profilkonvertierungsworkflow; `settings/`
  enthält getrennte Startziele, den sichtbaren Migrationsstatus und den
  vollständigen lokalen Workspace-JSON-Transfer; `animation-projects/`
  enthält die validierte Projektanlage, pure Listenprojektion, CRUD-Ansicht,
  Dialoge und den kontrollierten Workspace-Lifecycle-State;
  `animation-workspace/` enthält die repository-freie Arbeitsoberfläche, ihre
  pure temporäre State-Machine, responsive Paneelprojektion, Slotinventar,
  DOM-Viewport, datengetriebenes Rig-SVG, read-only Inspektor und Frameauswahl;
  `animation-part-import/` enthält die unbekannte Datei-/Decoder-Grenze,
  Importentwurf, kurzlebige Object-URL-Vorschau und pure Coverage-Projektion;
  `animation-anchor-editor/` besitzt Originalbild-Eingabe, Zoom/Pan, zugängliche
  Koordinatenfelder, Live-Placement-Anzeigeadapter und projektweite
  Delta-Bedienung
- `schemas/`: Zod-Schemas und daraus abgeleitete Typen
  - `common.schema.ts`: schema version, stable IDs, profile values, locks, and
    reusable validated primitives
  - `categoryData.schema.ts`: strict category-specific answer contracts,
    including additive Character/NPC, Moving Object, Static Object,
    Texture/Material, Nature/Tree, Building/Architecture, Tileset,
    Item/Equipment, and Artwork catalogs with strict category-specific values
  - `profiles.schema.ts`: base, category, and asset profile contracts
  - `appSettings.schema.ts`: additive schema-V2-compatible roof, Prompt and
    Animation start settings with defaults for older strict data;
    `wizardDraft.schema.ts` and `exportBundle.schema.ts`: remaining
    persisted/imported V2 contracts
  - `animationPrimitives.schema.ts`, `animationProject.schema.ts`,
    `animationPartAsset.schema.ts`, `animationKit.schema.ts` and
    `animationBundle.schema.ts`: independent strict Animation schema/format
    V1 contracts, cross-field invariants and validated bundle references
  - `legacyV1.schema.ts`: defensive whitelist and normalization boundary for
    raw, autosave, preset, and export-shaped V1 input
  - `storage.schema.ts`: versioned collection envelopes, profile-graph
    integrity, migration backup, and completion-marker contracts
- `services/`: injectable storage, navigation, output and Animation repository
  ports, JSON profile transfer, V1 storage migration orchestration, and the
  browser workspace bootstrap that runs migration before provider hydration;
  `animation/` owns the `ImageDecoder` port plus browser implementation, the
  native IndexedDB and full Memory adapters, pure binary reference analysis
  and browser factories; public exports live in `services/index.ts`
- `store/`: Contexts, pure Reducer, Actions und Selectors; `settings/` owns the
  complete validated app-settings envelope, all three start decisions and
  effective theme state;
  `profiles/` owns the validated profile-library UI state, filters, and
  mutation boundary; `navigation/` owns only the current canonical Studio
  route, backward-compatible Prompt-view projections and the injectable
  unsaved-navigation guard; `animation/` owns the pure project reducer,
  revision/dirty/save selectors and the repository-backed lifecycle provider;
  `wizard/` owns Startintent, aktiven validierten Draft, Dirty-Baseline und
  Persistenzstatus, während React Hook Form Eigentümer der aktuellen
  Formularwerte bleibt
- `styles/`: globale semantische Light-/Dark-Tokens, System-Fallback und
  Reset-/Grundregeln
- `test/`: gemeinsames Vitest-/Testing-Library-Setup und nicht ausführbare,
  synthetische V1-Migrations-/Promptverträge unter `fixtures/legacy-v1/`

The executable V1 UI was removed in Prompt 27 only after automated and manual
parity was demonstrated. Historical inputs now live as inert fixtures under
`test/fixtures/legacy-v1/`; the removed source remains recoverable from Git
history before the Prompt 27 release commit.

The public compatibility API remains `domain/legacy-v1/index.ts`. It intentionally
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
humanoid-subtype guards. It also exports the exhaustive field list and the
German-only `CHARACTER_TEXT_PRESETS_DE` suggestion package for every Character
text answer. Presets are prompt-ready strings but never eager defaults: React
applies one only after an explicit selection and persists it through the same
RHF/Zod field as a custom value. This keeps subtype gating, preset content, and
new Character answer serialization out of React literals; a later English
package can be added without changing the persisted schema.

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

`domain/tilesets/index.ts` is the public, framework-free Tileset API. It owns
stable IDs for tile type, mapping usage, edge/corner/transition sets, seams,
repeat modes, axes, variants, atlas layouts, and animation. The exhaustive
`TILESET_TYPE_BY_SUBTYPE` mapping and pure connection relevance guards are
shared by schemas and React. `resolveTilesetAtlasMetrics()` and
`createTilesetTechnicalSpecification()` calculate rows, columns, capacity,
unused slots, spacing, and exact canvas size without browser or React state.

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
`TilesetAnswersSchema` is strict and additive. Existing description, usage,
axes, variant count, and animation fields remain readable without defaults.
Optional tile type, edge/corner/transition, material boundary, seam, repeat,
variant-kind, and atlas fields extend the contract. A present type must match
the subtype; connection-only fields and fixed-column layout are cross-field
validated. Central `tileSize` and pixel density, Character scale, and direction
data are not Tileset answers.

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

Tileset answers use the same deterministic merge and minimal local projection.
Explicitly clearing an inherited optional value detaches Category/Asset
provenance and materializes the remaining effective answers and technical
values relative to the Base. Base changes preserve mapping rules;
classification changes remove them.

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

`services/storageAdapter.ts` owns all V2 storage semantics; direct browser
`localStorage` access is confined to this service and the migration-first
`workspaceBootstrap.ts` composition root. `createV2StorageAdapter()` accepts
an injected
`KeyValueStorage`; `initializeBrowserWorkspaceStorage()` is the production
composition root and returns the stable adapter only after attempting the
startup migration. Reads return a discriminated
`valid | empty | invalid | unavailable` result. Profile writes use versioned
namespace envelopes and validate the complete Base→Category→Asset graph before
a best-effort write with a rollback attempt. If browser storage also rejects
that rollback, the adapter reports `unavailable` but cannot guarantee
atomicity. `ProfileLibraryProvider` is the sole in-app profile mutation owner
and assumes its adapter identity remains stable for the app lifecycle. Its
public import action re-reads and replaces provider state after a successful
validated graph write; cross-tab synchronization is outside V2 scope.

`services/animation/index.ts` is the public asynchronous persistence boundary
for Animation Studio. `AnimationRepository` returns discriminated read,
query, mutation and value-mutation results: schema failures are `invalid`,
missing records and collisions remain explicit, absent/open-failed IndexedDB
is `unavailable`, and transaction failures are `failed`. No React component,
provider or domain module handles `IDBRequest` or opens the database directly.
The Memory and IndexedDB adapters implement the same project, PartAsset,
binary, preview, Character Kit and garbage-collection contract. Prompt 37
extends it with one validated import transaction that adds a fresh PartAsset,
its original Blob and the updated project assignment together.

The browser adapter owns database `pixelforge-studio` version 1 with these
stable key-path stores and secondary indexes:

```text
animationProjects.projectId       → updatedAt
animationPartAssets.assetId       → slot, direction
animationImageBlobs.blobId
animationCharacterKits.kitId      → updatedAt
animationPreviews.previewId
```

Every metadata write passes through the Prompt-33 Zod schemas. A PartAsset and
its referenced image Blob enter both stores in one readwrite transaction. A
confirmed workspace import spans the project, PartAsset and image-Blob stores,
so transaction failure leaves all three unchanged. Replacing a slot removes
only the old project reference; it never deletes the old PartAsset or Blob.
Project duplication creates only new project identity/timestamps and shares
immutable PartAsset, image and preview IDs as a copy-on-write boundary; it
never copies PNG bytes. Project, PartAsset and Kit deletion never cascades
into binary stores. `analyzeAnimationBinaryReferences()` is the pure
reference authority, while `collectGarbage()` is the sole explicit binary
deletion operation and aborts before mutation when any stored metadata is
invalid. Future database versions append monotonic `oldVersion < n` upgrade
blocks and retain existing stores and indexes during ordinary upgrades.

`createBrowserAnimationRepository()` is the only global IndexedDB capability
check. It returns `unavailable` when IndexedDB is absent or cannot be opened,
and it creates no shared singleton. `ImageDecoder` is a separate injected port;
the browser implementation prefers `createImageBitmap`, falls back to a
short-lived image-element Object URL and revokes that URL in every outcome.
Tests inject either an isolated native-API facsimile or
`MemoryAnimationRepository`; the Prompt-V2 localStorage adapter and its six
namespaces are unchanged.

`store/animation/index.ts` is the Prompt-35 React lifecycle boundary. Its pure
reducer owns sorted summaries, one active validated project, explicit load and
save states, monotonically increasing in-memory revisions, the last persisted
revision and rejected raw-input issues. `AnimationProjectProvider` receives
the repository, image decoder, clock and ID factories from composition. Initial summary
hydration and project reads are write-free. Valid edits schedule one debounced
metadata write; explicit save and a deliberate project switch flush the latest
valid revision first. Writes are serialized, stale completions cannot replace
a newer active revision, and a failure retains the last valid in-memory model
with a concrete `failed` status. Neither the reducer nor provider state holds
PNG or other Blob values; the import command forwards one confirmed original
Blob directly into the repository transaction and then publishes its already
persisted project result.

`features/animation-projects/index.ts` is the public Prompt-35 UI boundary.
`AnimationProjectsView` creates schema-valid `humanoid-80-v1` projects with a
128 × 128 frame, 80 px character, 64/112 foot anchor,
`fiveAuthoredPlusMirror`, and an enabled eight-frame Walk at 10 FPS. Search and
sort are pure summary projections. Open, rename, copy-on-write duplicate and
confirmed delete call only the injected repository provider; views never use
IndexedDB directly. Workspace routes retain the stable project ID. Missing IDs
remain on an explained non-looping error surface, while no-ID, Character Kit,
import, rig and editor surfaces stay explicit placeholders for later prompts.

`features/animation-workspace/index.ts` is the public Prompt-36 presentation
boundary. `AnimationWorkspaceLifecycleView` is the only adapter from
`AnimationProjectProvider` into that boundary and passes a validated project,
save status, errors and an explicit save command. Workspace children never
read IndexedDB or the repository. `animationWorkspaceReducer()` owns only
ephemeral direction, clip, frame, slot, inspector context, integer zoom,
overlay, pan and pane selection; the lifecycle component keys it by project ID
so switching projects cannot leak an editor selection.

`WORKSPACE_SLOT_GROUPS` projects the canonical 39-slot domain catalog without
duplicating slot truth. Existing project assignments contain only PartAsset
IDs, so Prompt 36 does not infer their slot or claim that a Blob exists: it
shows unresolved references as a distinct source state until the validated
Prompt-37 import/read boundary supplies PartAsset and Blob data. The viewport
is a DOM presentation of the fixed project frame with checker background,
integer display zoom, keyboard/button panning and text equivalents for every
overlay. `RigOverlay` receives the resolved built-in template and projects its
selected `DirectionRig` through a pure `createRigOverlayModel()` into SVG
bones, joints, required-slot labels and groundline. It never copies production
coordinates into JSX. West, north-west and south-west expose an explicit
unavailable geometry state instead of inferred joints. The viewport remains a
presentation rather than a rig-data source, and display zoom never changes
project or export coordinates. The inspector exposes Project, Part and Frame
read-only states without fake editable fields; the Timeline exposes the
validated clip's frame slots and roving keyboard selection without playback.

`useWorkspaceLayout()` maps browser width to desktop, medium and small DOM
structures. Desktop renders inventory, viewport, inspector and timeline;
medium keeps viewport/timeline and one explicitly switchable side pane; small
renders a four-tab progressive view. Pane changes transfer focus to the newly
rendered heading. The same state remains local across a resize and is never
written through the project provider.

`features/animation-part-import/index.ts` is the public Prompt-37 import
boundary. `prepareAnimationPartImport()` accepts `unknown`, requires MIME
`image/png`, the PNG signature, at most 16 MiB, a successful injected decode,
at most 2048 × 2048 pixels and at least one alpha value above the default
threshold 1. It retains the original Blob, keeps decoded and cropped RGBA as
transient values, records trim bounds in original-image coordinates and warns
when a fully opaque pixel touches the outer edge. It never creates anchors.

`PartImportPanel` adds drag-and-drop beside a native keyboard-operable file
input, shows filename, original size, trim, warnings, target slot/direction and
explicit confirm/cancel actions. `useObjectUrl()` is the only preview URL owner
and revokes on draft replacement, cancellation, unmount and therefore project
switch. The coverage matrix projects every canonical slot over authored source
directions as `ready`, `anchorsPending`, `invalidAnchors` or `missing`.
Confirmed imports receive injected IDs/timestamps and use
`writePartAssetToProject()`; failed writes do not change provider state.

`domain/animation/anchorPlacement.ts` is the Prompt-39 pure placement
boundary. `validateSourceAnchors()` enforces the selected `SlotBinding`, source
bounds and near-zero vector epsilon. `resolveEffectiveAnchor()` subtracts the
trim origin exactly once. `resolveBonePlacement()` composes
`T(parent) × R(targetAngle-sourceAngle) × S(targetLength/sourceLength) ×
T(-effectiveProximal)` for two-point parts; single-point parts use the
binding's versioned source orientation and scale 1. Scale outside 0.5–2 is
returned as a visible warning without clamping. `applyTransformDelta()`
recomposes from the immutable base placement, so no correction mutates its
source truth.

`features/animation-anchor-editor/index.ts` is the display and input boundary.
It holds only the current draft, local Blob/Object URL, integer zoom and pan.
Pointer positions snap to original whole pixels and the same coordinates are
available through native number inputs. Its adapter resolves the active
`DirectionRig` on every render, so direction or template changes recompute
placement without rewriting anchors. The CSS-matrix crop preview is
deliberately not the Prompt-40 raster renderer.

Project-wide `transformDelta` lives on the Part assignment, separate from both
the PartAsset's `SourceAnchors` and the Rig. Zod restricts offsets to ±32 px,
rotation to ±π/2 and the uniform multiplier to 0.5–1.5. The provider validates
slot-dependent readiness and `writePartSetupToProject()` atomically commits the
PartAsset plus assignment in Memory/IndexedDB without touching its original
Blob. `ready` is therefore possible only after valid required anchors;
incomplete saved work resumes as `invalidAnchors`.

The provider registers `beforeunload` only while a project is dirty. The
navigation provider also asks the composition-injected guard before internal
link or history navigation and restores the prior route when navigation is
cancelled. Project-switch commands flush before changing the active project.
Studio Home receives at most the three newest animation summaries through
`StudioHomeAnimationSummaryPort`; merely having data never opens a project.

`services/v1Migration.ts` reads both V1 keys independently, writes their exact
raw strings to a `prepared` backup before parsing, transforms valid sources,
then writes the `completed` marker last. IDs derive from technical values and
source slots, so a prepared migration can converge safely after interruption.
Legacy browser keys are never deleted. V1 constraint flags remain isolated
provenance instead of being misinterpreted as V2 inheritance locks.

`services/profileTransfer.ts` owns the V2 JSON boundary. Selected exports add
their referenced Base/Category profiles automatically. Bundle parsing checks
schema/format/application, duplicate IDs, graph references, resolver conflicts,
and recomputed Compatibility Keys. Existing identical IDs are skipped;
different payloads are returned as visible conflicts unless replacement is
explicitly requested. UI settings and draft payloads roundtrip in the bundle
contract but the low-level profile import never silently applies them to the
local UI state.

`features/settings/index.ts` is the Prompt-27 React boundary for startup status
and full-workspace transfer. It composes the profile-import service with the
profile, settings, and Wizard-session providers, reads/writes the optional
Draft through the storage adapter, and applies settings or the latest imported
Draft only when the corresponding checkboxes remain selected. A successful
Draft restore publishes an exact Resume intent so stale in-memory Wizard state
cannot mask it. Files are size-limited and fully inspected before mutation;
differing IDs require a second explicit replacement action. A later
Settings/Draft write cannot be atomic with the profile graph across
localStorage namespaces, so any partial follow-up failure is reported instead
of hidden.

`config/brand.ts` is the single source for the visible umbrella and module
names. `BRAND.productName` identifies PixelForge Studio while
`BRAND.modules.prompt` and `BRAND.modules.animation` provide their full and
compact labels. `PROMPT_EXPORT_APPLICATION_ID` remains the persisted
`"PixelForge Prompt Studio"` wire discriminator;
`EXPORT_APPLICATION_ID` is its backward-compatible alias.
`ANIMATION_EXPORT_APPLICATION_ID` is the active discriminator of the
separately versioned Animation format V1 and is never consumed by Prompt
Studio exports.

`domain/theme/index.ts` is the framework-free theme API. It distinguishes the
persisted `light | dark | system` preference from the resolved `light | dark`
mode. `store/settings/index.ts` is the React-facing settings boundary:
`SettingsProvider` loads and preserves the full Zod-validated `AppSettings`
object, persists only explicit user changes through the injected storage port,
and observes `prefers-color-scheme` only while System is selected. It writes
the resolved mode to `document.documentElement.dataset.theme`; media changes
never mutate storage or `updatedAt`. `main.tsx` creates the browser adapter once
through the migration-first workspace bootstrap at the composition root.

`components/ui/index.ts` exposes the first reusable CSS-Module primitives,
`Badge` and `Surface`. `components/theme/ThemeSwitcher.tsx` is a native,
keyboard-operable radio group. All component colors, spacing, focus rings,
control sizes, radii, shadows, and motion timings come from `styles/tokens.css`.

`domain/navigation/studioRoute.ts` is the public, framework-free roof-routing
contract. Readonly catalogs define `home | prompt | animation`, all six Prompt
views, and the four prepared Animation views. `StudioRoute` permits a validated
`StableId` project only on the Animation workspace. The pure parser distinguishes
canonical, legacy, missing and structured invalid results; controlled duplicate
parameters are rejected. The serializer emits `studio`, `view`, then optional
`project`, preserves foreign parameters, and rejects duplicate controlled input
unless a caller explicitly requests repair. Fragments remain outside routing so
the accessible `#main-content` skip target stays usable.

`domain/navigation/appView.ts` is a deliberate transition boundary. Its
`APP_VIEW_IDS`, `AppView`, guards, parser and serializer retain the previous
Prompt-only API and use the canonical Prompt catalog as their single source.
`AppSettings.startView` therefore remains schema-V2 compatible and means only
the Prompt start view. `AppSettingsSchema` adds `startStudio` (default `home`)
and `animationStartView` (default `projects`) without changing schema version
2. Zod supplies those values when older strict Settings or Export Bundles omit
them. `store/settings/settingsState.ts` exposes pure resolution and immutable
update helpers; the provider is the only UI mutation boundary for all three
independent choices.

`services/navigationAdapter.ts` is the only module that talks to browser
History. `pushRoute()` is reserved for explicit transitions,
`replaceRoute()` canonicalizes legacy, missing or invalid URLs while preserving
History state, and `subscribe()` observes `popstate`. Successful legacy
`?view=<PromptStudioView>` reads are rewritten to
`?studio=prompt&view=<PromptStudioView>` with `replaceState`; foreign parameters
survive and fragments are cleared from generated destinations.

`store/navigation/index.ts` is the React-facing Studio-route boundary. Initial
precedence is a valid canonical or legacy URL followed by the route returned
from `resolveStudioStartRoute(settings)`. The Context exposes `activeRoute`,
`hrefForRoute()` and
`navigateTo()`. `activeView`, `hrefFor()` and `navigate()` remain deprecated
Prompt compatibility aliases for existing consumers; the global shell no
longer depends on them. The projection is derived and never a second state
source. An optional synchronous guard can reject explicit and History-driven
route changes; rejected History navigation replaces the prior canonical route
without adding a new entry. `MemoryNavigation` records complete routes while
retaining Prompt-view projections for existing feature tests.

`app/StudioShell.tsx` owns only roof-level composition: brand-to-Home,
`StudioSwitcher`, global theme, visible route context, skip link, document
title, route/session focus, module navigation selection and the single main
landmark. Route and Wizard-session focus uses `preventScroll`, so module and
Home transitions preserve the user's viewport position; activating the skip
link still performs the deliberate jump to main content.
`app/AppShell.tsx` now exports the productive Prompt module surface
and its six-view navigation. `app/AnimationStudioShell.tsx` routes the
productive project list and lifecycle-aware Workspace plus explicit Character
Kit and Rig placeholders; it owns no repository implementation or Canvas
behavior. `StudioHomeController` combines the mounted profile and Animation
providers with the injected draft read port and passes only pure, narrow
`StudioHomeData` summaries to `StudioHomeView`. The view owns no storage access
or domain writes and opens animation data only after an explicit user action.
Its compact recent projections contain only IDs and presentation metadata;
profile facts, tags, materials, base metadata and full Animation projects stay
out of the roof-level view.

`components/navigation/index.ts` exposes `StudioLink` as the semantic typed
anchor for every `StudioRoute`. It preserves real hrefs and modifier/new-tab
behavior while delegating transitions to the navigation provider.
`StudioSwitcher` derives both module destinations and `aria-current` from the
central module configuration. `ViewLink` is the narrower Prompt-view adapter;
its optional `onNavigate` hook records a domain intent before the route changes.

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
Tileset facts expose the resolved tile type, mapping use, relevant connections,
material boundaries, seams, repeat axes, variants, atlas layout, and calculated
atlas dimensions. Animation is emitted only for an animated Tile; direction and
Character-scale facts are never emitted.
Unknown badge IDs are ignored safely. The React view
reads this model through the narrow `DashboardStorage` port
(`readProfileLibrary` + `readDraft`) and never accesses `localStorage`.
Category, profile and draft starts are write-free; only an explicit base-profile
selection delegates a validated AppSettings update to the existing Settings
provider. Its secondary Studio bridge links to Home and Animation without
moving or replacing the nine-category entry grid.

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

`features/wizard/wizardCategoryRouting.ts` is the Prompt-20 boundary between
core form values and the strict Draft union. It validates category/subtype
pairs against the canonical taxonomy, resolves visibility only through
`resolveCapabilities()`, preserves hidden answers for an unchanged selection,
and creates clean answers when classification changes. The stable core flow is
`project → category/subtype → baseProfile → characterDetails,
movingObjectDetails, staticObjectDetails, textureDetails, natureDetails,
buildingDetails, or tilesetDetails when applicable → directions | animation`,
with specialist and capability steps conditionally present.
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
Texture, Nature, Building, or Tileset
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
modular mapping on non-modular building subtypes, plus Tileset type/subtype,
connection relevance, repetition, and atlas-layout conflicts.
The Wizard reports a derived Nature plant-type mismatch on the editable
subtype control and offers an explicit repair that re-enters the normal
validation and autosave path without discarding the remaining Nature details.
The generic `tileability` step is skipped for Texture and Tileset because their
specialist steps own seamless or axis/repetition rules. Older persisted Tileset
drafts at that step resume in memory at `tilesetDetails` without a hydration
write.

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
Tileset summaries add the derived type, relevant connection sets, material
boundary, seams, repetition, variants, atlas layout, and calculated grid/canvas
metrics. Long free-form Tileset descriptions remain in the Draft for later
Review/Output and are not duplicated into compact cards.
Item summaries add the derived class, purpose, presentation, materials,
condition, function, significance, size, readability, glow, shadow, icon size,
and variants. Long free-form Item descriptions remain in the Draft for later
Review/Output and are not duplicated into compact cards. No Item summary
derives direction or animation facts.
Artwork summaries add the derived type, purpose, motif, scene, composition,
format, background, focus, lighting drama, and detail level. Long free-form
Artwork descriptions remain in the Draft for later Review/Output and are not
duplicated into compact cards. Wizard projection and compatibility omit
world-grid geometry for `freeComposition`; pre-existing profile values remain
losslessly readable but are neither displayed nor re-persisted as relevant
Artwork overrides.

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

`features/tileset-editor/index.ts` is the public React boundary for Prompt 20.
`TilesetEditor` is mounted only as the dedicated `tilesetDetails` step after
Base selection. It renders subtype-derived tile type, inherited tile grid, and
pixel density read-only; RHF owns mapping usage, subtype-relevant edges,
corners, transitions, material boundary, seams, repetition axes, variants, and
atlas inputs. The live technical card uses the pure domain calculator. An
animated Tile may receive a separate animation step, but no Tileset is
directional. Base changes preserve Tileset answers, classification changes
purge them, and deliberate edits use shared autosave while mount, hydration,
and Resume remain write-free.

`features/item-editor/index.ts` is the public React boundary for Prompt 21.
`ItemEquipmentEditor` is mounted only as the dedicated `itemDetails` step after
Base selection. It renders subtype-derived Item class plus inherited
background, tile size, and pixel density read-only. RHF owns purpose,
presentation, wear position, icon size, relative size, description, materials,
condition, function, significance, meaning, silhouette, readability, glow,
shadow, variants, and extra details. Wear position and equipped presentation
remain capability-bound. Base changes preserve Item answers, classification
changes purge them, and deliberate edits use shared minimal projection,
Explicit Clear, autosave, and exact Resume while mount and hydration remain
write-free. No Item subtype is directional or animated.

`domain/items/index.ts` is the framework-free public boundary for the Item
catalog, complete subtype-to-class mapping, and wearable relevance guard.
Persisted Item values continue through the shared strict Zod schemas and
Base→Category→Asset resolver; technical background and scale are never
duplicated into `ItemAnswers`.

`features/artwork-editor/index.ts` is the public React boundary for Prompt 22.
`ArtworkConceptEditor` is mounted only as the dedicated `artworkDetails` step
after Base selection. It renders subtype-derived Artwork type plus general
inherited pixel style, style profile, and outline read-only. RHF owns purpose,
motif, subject, scene, composition, format, background, focus, lighting drama,
detail level, and extra details. Base changes preserve Artwork answers,
classification changes purge them, and deliberate edits use shared minimal
projection, Explicit Clear, autosave, and exact Resume while mount and
hydration remain write-free. The editor exposes no Tile, Sprite, world-camera,
character-scale, direction, or animation controls.

`domain/artworks/index.ts` is the framework-free public boundary for stable
Artwork catalogs and the complete subtype-to-type mapping. Persisted Artwork
values continue through the shared strict Zod schemas and
Base→Category→Asset resolver; Artwork type and game-specific technical values
are never duplicated into `ArtworkAnswers`.

`domain/animation/index.ts` is the framework-free public boundary introduced
by Prompt 32 and completed with concrete neutral Rig data in Prompt 38. It
owns the non-alphabetical eight-direction production order, the three explicit
source modes and their authored-direction requirements, all 39 Production-
Humanoid slots with stable groups, labels and required status, 21 joint IDs,
20 bones and the complete required-slot binding contract. Anatomical
left/right slot IDs are never renamed by direction mirroring.

`humanoidRig80.ts` is the immutable production-data module for
`humanoid-80-v1`: a 128 × 128 frame, 80 px character, foot/root anchor 64/112,
contract versions 1 and five independently authored `south`, `southEast`,
`east`, `northEast` and `north` neutral poses. Every `DirectionRig` contains
all joint definitions plus versioned projection/near-side/step-axis/bend
metadata; it contains no clip keyframes. `BoneDefinition` records the
acyclic parent-bone hierarchy and distinguishes structure, connector and limb
bones. `SlotBinding` maps every required slot to its proximal and, for limbs,
distal joint. The three single-point parts use the versioned source
orientation −π/2. Western source geometry is deliberately absent until its
controlled derivation phase.

`validateRigTemplate()` returns structured code/path issues for invalid frame
profiles, missing or out-of-frame joints, incomplete or cyclic bone graphs,
zero-length limbs, invalid required-slot bindings and groundline violations.
`createRigCompatibilityKey()` first validates and then fingerprints all
contract-relevant fields in canonical catalog order. Vector, radian-angle and
affine 2D matrix helpers remain deterministic pure functions; matrix
composition uses `T × R × S` order and therefore applies the right-most
transform first. Production files in this directory import neither React nor
Zod and reference no browser, persistence, SVG or Canvas API.

`schemas/index.ts` is also the public Animation metadata boundary since Prompt
33. Project, PartAsset and CharacterKit use strict `schemaVersion: 1` objects;
the `.pfanim` manifest independently fixes `application` to
`"PixelForge Animation Studio"` and `formatVersion` to `1`. Every parse
function accepts `unknown`, rejects newer versions and unknown keys, returns
the Zod-derived readonly normal form, and never accepts Blob or Base64 payloads.
Prompt Studio keeps its independent schema/format version 2.

The validated bundle graph resolves references before any future write:

```text
project.parts[*].assetId → partAssets[*].assetId
partAssets[*].blobId     → blobIds[*]
project.previewBlobId    → blobIds[*]
```

Project refinements enforce unique PartAsset and clip IDs, exactly eight
frames for the V1 Walk action, and unique overrides that target an existing
clip, canonical direction and in-range frame. Source anchors and trim bounds
remain in original-image coordinates. Existing V1 PartAssets without
`anchorStatus` normalize to `ready`; new imports persist
`anchorStatus: "anchorsPending"` without an `anchors` object, so no joint or
pivot can be guessed.
`validateAnimationProjectProductionSources()` is deliberately separate from
schema parsing: an incomplete draft remains storable, while missing required
slot/direction sources, `anchorsPending` parts and two-point anchors are
explicit production issues.
IndexedDB persistence and atomic writes are implemented by Prompt 34 through
the repository boundary above; schemas remain independent of storage APIs.

`domain/prompt-engine/index.ts` is the framework-free public boundary for
Prompt 23. `buildPromptPackages()` accepts only an already validated
`ResolvedProfile` plus an optional canonical language selection. It returns
immutable packages with `main`, `negative`, `technical`, and `combined`
outputs. The inherited `styleProfile` selects one classic or dark package, or
two separate packages for `both`; no React, browser, storage, or mutable
singleton state enters this boundary.

The engine executes twelve small builders in the exported
`PROMPT_MODULE_IDS` order: base profile, style profile, category, subject,
materials, setting, lighting, motion, animation, composition, negative rules,
and technical specification. Each builder consumes the discriminated resolved
category and central capabilities. Direction text and metrics therefore exist
only for `directional`; animation is independent; a direction set fixes camera,
ground anchor, and world light while only the subject rotates. Free Artwork
omits game-grid, world-camera, character-scale, direction, and animation
constraints. Tileset canvas values delegate to the existing pure atlas metric.
Stable whitespace normalization and first-occurrence deduplication make output
ordering deterministic without modifying profile data.

`features/review-output/index.ts` is the public React/feature boundary for
Prompt 24. `prepareReviewOutput()` reads a validated active or persisted
Wizard Draft plus a validated `ProfileLibrary`, delegates Base→Category→Asset
resolution to the existing Wizard lifecycle, and calls only the public
`buildPromptPackages()` engine boundary. Missing/incomplete drafts and
resolution conflicts are discriminated fail-closed states; React never builds
a partial production prompt. Synthetic draft-snapshot key notices are hidden,
while real Draft warnings, resolver notices, value sources, Base locks, and
capabilities remain visible.

`ReviewOutputWorkspace` serves both `review` and `output` shell routes. It
provides package selectors for German/English and every effective style
variant, plus ARIA tabs for `main`, `negative`, `technical`, and `combined`
with Arrow/Home/End keyboard navigation. An active Session Draft wins; after
a reload, the workspace reads the validated stored Draft without writing.
Unavailable or invalid Draft/library storage has an explicit recovery state.

`services/outputWorkspaceAdapter.ts` is the browser effect boundary for
Clipboard and Blob-backed file downloads. The App composition root injects
it, so React tests substitute deterministic spies. TXT contains exactly the
active output. JSON continues through `createProfileExportBundle()` and
`ExportBundleSchema`, selects only the reviewed Asset plus its required Base/
Category dependencies, and includes the portable Draft.

`domain/profiles.saveAssetProfile()` is the pure Prompt-24 library mutation.
It creates clean metadata for a new reviewed Asset or updates an existing
source at its stable ID while preserving source metadata. The existing
`ProfileLibraryProvider` owns ID/time injection, full graph validation, and
the atomic storage write; a successful new save links and persists the Draft
to prevent duplicate profiles on later saves.

`features/review-output/profileConversionData.ts` is the pure Prompt-25
planning boundary. It accepts only a validated selected Draft, the resolver's
partial profile, and structured conflicts. A conversion is available only
when every conflict is a `lockedOverride`; it reconstructs desired effective
values, recomputes the opaque Compatibility group, checks candidate Base locks,
and returns a fully validated detached Draft. Effective category answers are
materialized while old Category/Asset provenance is removed, so no existing
profile or descendant reference is re-parented.

`ProfileConversionWorkflow` keeps the conflicting Review fail-closed and
offers the four explicit outcomes: cancel, duplicate the source Base, create a
new canonical Base, or select a compatible existing Base. Every commit path
shows value, group, override, and provenance impact first. Existing candidates
are ranked by exact technical match. React Hook Form plus Zod owns family-name
validation; the existing `ProfileLibraryProvider` remains the only Base-create
and Base-duplicate mutation boundary. The converted Draft is written only
after that graph mutation succeeds, and only then becomes the active Session
Draft. A failed second write is reported without pretending to roll back an
already persisted standalone family.

Prompt 26 defines the cross-application accessibility and responsive UI
contract without adding a new domain boundary. Native controls and semantic
roles retain their browser keyboard behavior; App Shell navigation, Wizard
validation, profile dialogs, conversion modes, and Output tabs own explicit
focus only when a route or dynamic context changes. Conversion success moves
focus into the newly available Review/Output region, while cancelling a mode
returns it to the exact trigger.

Global focus, motion, and forced-color behavior remains token-driven in
`styles/`. CSS Modules own local reflow: panels and grids collapse at their
feature breakpoint, every flex/grid child may shrink, and long profile,
technical, and prompt content wraps inside its surface. At
`prefers-reduced-motion: reduce`, transitions are disabled and animations are
reduced to a single 1 ms iteration. The verified desktop/tablet/360-px matrix,
keyboard paths, and contrast measurements are recorded in
`docs/erledigt/V2-ACCESSIBILITY-RESPONSIVE-AUDIT.md`.

Prompt 27 completes the numbered V2 series. Startup migration now precedes
provider reads, full workspace transfer rehydrates public provider boundaries,
and the executable Legacy UI was removed only after the automated and browser
parity evidence recorded in `docs/erledigt/V2-RELEASE-ACCEPTANCE.md`. Prompts 00 through
27 are complete; PWA and Tauri remain unstarted optional projects.

Prompt 28 rebrands the umbrella product and repository as PixelForge Studio,
keeps the current Prompt Studio runtime intact, and establishes typed names
for both modules. Package version 2.0.0, Prompt schema/format version 2,
`pixelforge:v2:*` storage keys, and the existing Prompt export discriminator
remain unchanged.

Prompt 29 completes the module-aware route, browser-adapter and provider
boundaries. Legacy Prompt URLs remain valid and are canonically replaced;
Home and Animation routes are typed and roundtrip-stable without a visible new
shell. Prompt 30 adds the global shell and accessible module placeholders.
Prompt 31 completes Phase A with the productive Home surface and additive
start settings. Prompt 32 starts Phase B with the public, tested Animation rig
foundation. Prompt 33 adds the independent strict Animation metadata and
bundle-graph schemas. Prompt 34 adds the native IndexedDB/Memory repository
boundary, atomic Part-/Blob-Writes, shared-reference duplication and explicit
binary garbage collection. Prompt 35 adds the productive project CRUD UI,
repository-backed provider, revision-safe autosave, guarded navigation, stable
workspace loading and real recent-project Home summaries. Prompt 36 adds the
responsive Animation Workspace shell, temporary selection reducer,
domain-driven inventory, DOM viewport, contextual inspector and eight-frame
Walk timeline. Prompt 37 adds validated PNG decoding and trimming,
anchor-pending PartAssets, atomic Part/Blob/project assignment, transient
preview URLs and authored-direction coverage. Prompt 38 adds the immutable
five-pose `humanoid-80-v1` template, pure structured validation, deterministic
Rig compatibility and its data-driven SVG overlay. Prompt 39 completes Phase C
with original-space anchor editing, deterministic Part placement, separate
project deltas, atomic resume persistence and live display-adapter previews.
Prompt 40 is the next separate task and owns the deterministic pixel renderer.
