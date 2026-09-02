# V2 source architecture

- `app/`: bootstrap-nahe App-Komponenten und spätere Provider/Navigation
- `components/`: wiederverwendbare UI und lokale SVG-Icons
- `domain/`: frameworkfreie, pure TypeScript-Fachlogik
  - `assets/`: V2 categories, subtype catalogs, capability resolution, and
    direction-option guards
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
- `services/`: Storage-, Import-, Export- und Migrationsadapter
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

Prompt 05 adds the framework-free `domain/profiles/` resolution layer. It must
derive compatibility keys from resolved relevant values, never trust an
imported key, and ignore `characterHeight` for assets without the
`scaledCharacter` capability.
